<script lang="ts">
  import Icon from '../Icon.svelte';
  import SkeletonLoader from '../SkeletonLoader.svelte';
  import { onMount } from 'svelte';
  import { apiGet, apiPost } from '../api';

  let { courseId, courseTitle } = $props<{ courseId: number; courseTitle: string }>();

  interface CourseClass {
    id: number;
    scheduled_at: string;
    is_catchup: boolean;
    gmeet_link: string | null;
    course_assignment_id: number;
  }

  let classes = $state<CourseClass[]>([]);
  let isLoading = $state(true);
  let error = $state('');

  // Schedule Modal State
  let showModal = $state(false);
  let modalDate = $state('');
  let modalTime = $state('');
  let modalIsCatchup = $state(false);
  let isScheduling = $state(false);
  let scheduleError = $state('');
  let scheduleSuccess = $state('');

  onMount(async () => {
    await loadClasses();
  });

  async function loadClasses() {
    isLoading = true;
    error = '';
    try {
      // When backend is ready: GET /mentor/courses/:id/classes
      let data: CourseClass[] = [];
      try {
        data = await apiGet<CourseClass[]>(`/mentor/courses/${courseId}/classes`) || [];
      } catch {
        // Fallback: all classes filtered by course_assignment_id (won't work perfectly without backend, but keeps UI alive)
        const all = await apiGet<CourseClass[]>('/mentor/classes') || [];
        data = all.filter(c => c.course_assignment_id === courseId);
      }
      classes = data.sort((a, b) => new Date(b.scheduled_at).getTime() - new Date(a.scheduled_at).getTime());
    } catch (err: any) {
      error = err?.message || 'Failed to load classes';
    } finally {
      isLoading = false;
    }
  }

  async function scheduleClass() {
    if (!modalDate || !modalTime) {
      scheduleError = 'Please select both a date and time.';
      return;
    }
    isScheduling = true;
    scheduleError = '';
    scheduleSuccess = '';

    const scheduledAt = new Date(`${modalDate}T${modalTime}:00`).toISOString();

    try {
      await apiPost('/mentor/classes/schedule', {
        course_id: courseId,
        scheduled_at: scheduledAt,
        is_catchup: modalIsCatchup,
      });
      scheduleSuccess = 'Class scheduled successfully! Students will be notified by email.';
      modalDate = '';
      modalTime = '';
      modalIsCatchup = false;
      await loadClasses();
      setTimeout(() => { showModal = false; scheduleSuccess = ''; }, 2000);
    } catch (err: any) {
      scheduleError = err?.message || 'Failed to schedule class. Check backend.';
    } finally {
      isScheduling = false;
    }
  }

  function getStatus(scheduledAt: string): 'upcoming' | 'past' {
    return new Date(scheduledAt) > new Date() ? 'upcoming' : 'past';
  }

  function formatDateTime(dateStr: string): string {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
      + ' at '
      + d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  }

  function closeModal() {
    showModal = false;
    scheduleError = '';
    scheduleSuccess = '';
    modalDate = '';
    modalTime = '';
    modalIsCatchup = false;
  }

  let upcoming = $derived(classes.filter(c => getStatus(c.scheduled_at) === 'upcoming'));
  let past = $derived(classes.filter(c => getStatus(c.scheduled_at) === 'past'));

  // Min date = today for date input
  let minDate = new Date().toISOString().split('T')[0];
</script>

<!-- Schedule Class Modal -->
{#if showModal}
  <div class="modal-overlay" onclick={closeModal}>
    <div class="modal" onclick={(e) => e.stopPropagation()}>
      <div class="modal-header">
        <div>
          <h3>Schedule a Class</h3>
          <p class="modal-subtitle">Course: <strong>{courseTitle}</strong></p>
        </div>
        <button class="close-btn" onclick={closeModal}><Icon name="x" size={18} /></button>
      </div>

      <div class="modal-body">
        <div class="form-group">
          <label for="class-date">Date</label>
          <input id="class-date" type="date" bind:value={modalDate} min={minDate} />
        </div>

        <div class="form-group">
          <label for="class-time">Time</label>
          <input id="class-time" type="time" bind:value={modalTime} />
        </div>

        <div class="form-group checkbox-group">
          <label class="checkbox-label">
            <input type="checkbox" bind:checked={modalIsCatchup} />
            <span class="checkmark"></span>
            <div>
              <span class="cb-title">Mark as Catch-up Class</span>
              <span class="cb-desc">For students who missed a previous session.</span>
            </div>
          </label>
        </div>

        {#if scheduleError}
          <div class="alert error">{scheduleError}</div>
        {/if}

        {#if scheduleSuccess}
          <div class="alert success">✅ {scheduleSuccess}</div>
        {/if}
      </div>

      <div class="modal-footer">
        <button class="cancel-btn" onclick={closeModal} disabled={isScheduling}>Cancel</button>
        <button class="submit-btn" onclick={scheduleClass} disabled={isScheduling}>
          {#if isScheduling}
            <span class="spinner"></span> Scheduling...
          {:else}
            <Icon name="calendar" size={15} /> Schedule Class
          {/if}
        </button>
      </div>
    </div>
  </div>
{/if}

<div class="classes-tab">
  <!-- Header -->
  <div class="tab-header">
    <div>
      <h3>Classes</h3>
      <p>Manage scheduled classes for this course.</p>
    </div>
    <button class="schedule-btn" onclick={() => showModal = true}>
      <Icon name="plus" size={15} /> Schedule Class
    </button>
  </div>

  {#if isLoading}
    <SkeletonLoader type="table" rows={4} cols={4} />

  {:else if error}
    <div class="empty-state">
      <p>⚠️ {error}</p>
      <p class="hint">Backend needed: <code>GET /api/mentor/courses/{courseId}/classes</code></p>
    </div>

  {:else}
    <!-- Upcoming -->
    <div class="section">
      <div class="section-label">
        <span class="dot green"></span>
        Upcoming ({upcoming.length})
      </div>
      {#if upcoming.length === 0}
        <div class="no-items">
          No upcoming classes. <button class="link-btn" onclick={() => showModal = true}>Schedule one now →</button>
        </div>
      {:else}
        <div class="class-list">
          {#each upcoming as cls}
            <div class="class-row upcoming">
              <div class="class-left">
                <div class="class-icon upcoming-icon"><Icon name="calendar" size={16} /></div>
                <div>
                  <div class="class-dt">{formatDateTime(cls.scheduled_at)}</div>
                  <div class="class-meta">
                    {cls.is_catchup ? '🔄 Catch-up Class' : '📘 Regular Class'}
                    {#if cls.gmeet_link}
                      · <a href={cls.gmeet_link} target="_blank" class="meet-link"><Icon name="video" size={12} /> Join Meet</a>
                    {/if}
                  </div>
                </div>
              </div>
              <span class="status-pill upcoming">Upcoming</span>
            </div>
          {/each}
        </div>
      {/if}
    </div>

    <!-- Past -->
    <div class="section">
      <div class="section-label">
        <span class="dot grey"></span>
        Past Classes ({past.length})
      </div>
      {#if past.length === 0}
        <div class="no-items">No past classes yet.</div>
      {:else}
        <div class="class-list">
          {#each past as cls}
            <div class="class-row past">
              <div class="class-left">
                <div class="class-icon past-icon"><Icon name="check-circle" size={16} /></div>
                <div>
                  <div class="class-dt">{formatDateTime(cls.scheduled_at)}</div>
                  <div class="class-meta">
                    {cls.is_catchup ? '🔄 Catch-up' : '📘 Regular'}
                    {#if cls.gmeet_link}
                      · <a href={cls.gmeet_link} target="_blank" class="meet-link"><Icon name="video" size={12} /> Recording</a>
                    {/if}
                  </div>
                </div>
              </div>
              <span class="status-pill past">Completed</span>
            </div>
          {/each}
        </div>
      {/if}
    </div>
  {/if}
</div>

<style>
  .classes-tab { display: flex; flex-direction: column; gap: 24px; }

  .tab-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 16px;
  }

  .tab-header h3 {
    font-size: 1.1rem;
    font-weight: 700;
    color: var(--text-main);
    margin: 0 0 4px;
  }

  .tab-header p {
    font-size: 0.875rem;
    color: var(--text-muted);
    margin: 0;
  }

  .schedule-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    background: var(--primary);
    color: white;
    border: none;
    padding: 10px 18px;
    border-radius: 10px;
    font-weight: 700;
    font-size: 0.875rem;
    cursor: pointer;
    white-space: nowrap;
    box-shadow: 0 4px 14px rgba(229,62,62,0.25);
    transition: all 0.18s;
  }

  .schedule-btn:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(229,62,62,0.35); }

  .section { display: flex; flex-direction: column; gap: 12px; }

  .section-label {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 0.8rem;
    font-weight: 700;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .dot {
    width: 8px; height: 8px;
    border-radius: 50%;
    display: inline-block;
  }
  .dot.green { background: #38a169; }
  .dot.grey { background: #a0aec0; }

  .class-list { display: flex; flex-direction: column; gap: 8px; }

  .class-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: var(--bg-card);
    border: 1px solid var(--border-color);
    border-radius: 10px;
    padding: 14px 18px;
    transition: box-shadow 0.15s;
  }

  .class-row:hover { box-shadow: 0 2px 12px rgba(0,0,0,0.07); }
  .class-row.upcoming { border-left: 3px solid #38a169; }
  .class-row.past { border-left: 3px solid #a0aec0; opacity: 0.8; }

  .class-left {
    display: flex;
    align-items: center;
    gap: 14px;
  }

  .class-icon {
    width: 38px; height: 38px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .upcoming-icon { background: #f0fff4; color: #38a169; }
  .past-icon { background: #f7fafc; color: #a0aec0; }

  .class-dt {
    font-weight: 700;
    font-size: 0.9rem;
    color: var(--text-main);
    margin-bottom: 3px;
  }

  .class-meta {
    font-size: 0.8rem;
    color: var(--text-muted);
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .meet-link {
    display: inline-flex;
    align-items: center;
    gap: 3px;
    color: var(--primary);
    text-decoration: none;
    font-weight: 600;
  }

  .status-pill {
    font-size: 0.72rem;
    font-weight: 700;
    padding: 4px 10px;
    border-radius: var(--radius-full);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    white-space: nowrap;
  }

  .status-pill.upcoming { background: #f0fff4; color: #276749; }
  .status-pill.past { background: #edf2f7; color: #718096; }

  .no-items {
    background: var(--bg-card);
    border: 1px dashed #cbd5e0;
    border-radius: 10px;
    padding: 24px;
    text-align: center;
    font-size: 0.875rem;
    color: var(--text-muted);
  }

  .link-btn {
    background: none;
    border: none;
    color: var(--primary);
    font-weight: 700;
    cursor: pointer;
    font-size: 0.875rem;
    padding: 0;
  }

  /* Modal */
  .modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.45);
    backdrop-filter: blur(4px);
    z-index: 9999;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
  }

  .modal {
    background: var(--bg-card);
    border-radius: 16px;
    width: 100%;
    max-width: 480px;
    box-shadow: 0 20px 60px rgba(0,0,0,0.2);
    overflow: hidden;
    animation: modalIn 0.2s ease;
  }

  @keyframes modalIn {
    from { opacity: 0; transform: translateY(-12px) scale(0.97); }
    to { opacity: 1; transform: translateY(0) scale(1); }
  }

  .modal-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    padding: 24px 24px 0;
  }

  .modal-header h3 {
    font-size: 1.15rem;
    font-weight: 700;
    color: var(--text-main);
    margin: 0 0 4px;
  }

  .modal-subtitle {
    font-size: 0.83rem;
    color: var(--text-muted);
    margin: 0;
  }

  .close-btn {
    background: #f1f4f9;
    border: none;
    border-radius: 8px;
    width: 32px; height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: var(--text-muted);
    transition: all 0.15s;
    flex-shrink: 0;
  }

  .close-btn:hover { background: #e2e8f0; color: var(--text-main); }

  .modal-body {
    padding: 20px 24px;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .form-group label {
    font-size: 0.8rem;
    font-weight: 700;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.4px;
  }

  .form-group input[type="date"],
  .form-group input[type="time"] {
    border: 1.5px solid var(--border-color);
    border-radius: 8px;
    padding: 10px 14px;
    font-size: 0.9rem;
    color: var(--text-main);
    background: var(--bg-card);
    outline: none;
    transition: border-color 0.15s;
  }

  .form-group input:focus { border-color: var(--primary); }

  .checkbox-group { flex-direction: row; align-items: flex-start; }

  .checkbox-label {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    cursor: pointer;
    text-transform: none;
    font-weight: 400;
    font-size: 0.875rem;
    color: var(--text-main);
    letter-spacing: 0;
  }

  .checkbox-label input[type="checkbox"] {
    margin-top: 2px;
    width: 16px;
    height: 16px;
    accent-color: var(--primary);
    flex-shrink: 0;
  }

  .cb-title { font-weight: 600; display: block; font-size: 0.875rem; color: var(--text-main); }
  .cb-desc { font-size: 0.78rem; color: var(--text-muted); display: block; margin-top: 2px; }

  .alert {
    border-radius: 8px;
    padding: 10px 14px;
    font-size: 0.85rem;
    font-weight: 600;
  }

  .alert.error { background: #fff5f5; color: #c53030; border: 1px solid #fed7d7; }
  .alert.success { background: #f0fff4; color: #276749; border: 1px solid #c6f6d5; }

  .modal-footer {
    padding: 16px 24px;
    border-top: 1px solid var(--border-color);
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    background: #fafbfc;
  }

  .cancel-btn {
    background: transparent;
    border: 1.5px solid var(--border-color);
    color: var(--text-muted);
    padding: 10px 20px;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s;
    font-size: 0.875rem;
  }

  .cancel-btn:hover { border-color: var(--text-muted); color: var(--text-main); }

  .submit-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    background: var(--primary);
    color: white;
    border: none;
    padding: 10px 20px;
    border-radius: 8px;
    font-weight: 700;
    font-size: 0.875rem;
    cursor: pointer;
    transition: all 0.15s;
    box-shadow: 0 4px 12px rgba(229,62,62,0.25);
  }

  .submit-btn:hover:not(:disabled) { transform: translateY(-1px); }
  .submit-btn:disabled { opacity: 0.65; cursor: not-allowed; }

  .spinner {
    width: 14px; height: 14px;
    border: 2px solid rgba(255,255,255,0.3);
    border-top-color: white;
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
    display: inline-block;
  }

  @keyframes spin { to { transform: rotate(360deg); } }

  .empty-state {
    background: var(--bg-card);
    border: 1px dashed #cbd5e0;
    border-radius: 12px;
    padding: 36px 24px;
    text-align: center;
    font-size: 0.875rem;
    color: var(--text-muted);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
  }

  .hint {
    font-size: 0.78rem;
    background: #f7fafc;
    padding: 8px 14px;
    border-radius: 8px;
    border: 1px solid #e2e8f0;
    color: #999;
  }

  .hint code {
    font-family: monospace;
    background: #edf2f7;
    padding: 2px 5px;
    border-radius: 4px;
    color: #e53e3e;
  }
</style>
