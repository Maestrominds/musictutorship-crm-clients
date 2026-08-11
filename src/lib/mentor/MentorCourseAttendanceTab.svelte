<script lang="ts">
  import Icon from '../Icon.svelte';
  import SkeletonLoader from '../SkeletonLoader.svelte';
  import { onMount } from 'svelte';
  import { apiGet, apiPost } from '../api';

  let { courseId } = $props<{ courseId: number }>();

  interface Student {
    id: number;
    name: string;
    email: string;
    status: 'present' | 'absent' | 'excused';
  }

  interface ActiveClass {
    id: number;
    course_title: string;
    scheduled_at: string;
  }

  interface PastClass {
    id: number;
    scheduled_at: string;
    is_catchup: boolean;
  }

  let activeClass = $state<ActiveClass | null>(null);
  let roster = $state<Student[]>([]);
  let pastClasses = $state<PastClass[]>([]);
  let selectedClassId = $state<number | null>(null);

  let isLoading = $state(true);
  let isRosterLoading = $state(false);
  let isSaving = $state(false);
  let saveMessage = $state('');
  let saveSuccess = $state(false);
  let error = $state('');

  onMount(async () => {
    await loadData();
  });

  async function loadData() {
    isLoading = true;
    error = '';
    try {
      // Step 1: Get active class for this course
      try {
        const cls = await apiGet<ActiveClass>(`/mentor/courses/${courseId}/active-class`);
        if (cls) {
          activeClass = cls;
          selectedClassId = cls.id;
        }
      } catch {
        activeClass = null;
      }

      // Step 2: Get past classes (from classes list) for this course  
      try {
        const clsData = await apiGet<PastClass[]>(`/mentor/courses/${courseId}/classes`) || [];
        pastClasses = clsData
          .filter(c => new Date(c.scheduled_at) <= new Date())
          .sort((a, b) => new Date(b.scheduled_at).getTime() - new Date(a.scheduled_at).getTime())
          .slice(0, 10);

        if (!selectedClassId && pastClasses.length > 0) {
          selectedClassId = pastClasses[0].id;
        }
      } catch {
        pastClasses = [];
      }

      // Step 3: Get students for this course
      await loadStudentsForClass(selectedClassId);

    } catch (err: any) {
      error = err?.message || 'Failed to load attendance data';
    } finally {
      isLoading = false;
    }
  }

  async function loadStudentsForClass(classId: number | null) {
    isRosterLoading = true;
    try {
      const studs = await apiGet<any[]>(`/mentor/courses/${courseId}/students`).catch(async () => {
        // fallback
        return await apiGet<any[]>('/mentor/students') || [];
      });
      roster = (studs || []).map(s => ({
        id: s.id,
        name: s.name,
        email: s.email,
        status: 'absent' as const,
      }));
    } catch {
      roster = [];
    } finally {
      isRosterLoading = false;
    }
  }

  async function onClassChange(classId: number) {
    selectedClassId = classId;
    await loadStudentsForClass(classId);
  }

  function setStatus(studentId: number, status: 'present' | 'absent' | 'excused') {
    roster = roster.map(s => s.id === studentId ? { ...s, status } : s);
  }

  function markAll(status: 'present' | 'absent') {
    roster = roster.map(s => ({ ...s, status }));
  }

  async function submitAttendance() {
    if (!selectedClassId) {
      saveMessage = 'Please select a class first.';
      saveSuccess = false;
      return;
    }

    isSaving = true;
    saveMessage = '';

    try {
      // POST individual attendance records (existing endpoint)
      await Promise.all(
        roster.map(s =>
          apiPost('/mentor/attendance', {
            class_id: selectedClassId,
            student_id: s.id,
            status: s.status,
          })
        )
      );
      saveMessage = `Attendance saved for ${roster.length} student${roster.length !== 1 ? 's' : ''}!`;
      saveSuccess = true;
    } catch (err: any) {
      saveMessage = err?.message || 'Failed to save attendance. Check backend.';
      saveSuccess = false;
    } finally {
      isSaving = false;
      setTimeout(() => { saveMessage = ''; }, 4000);
    }
  }

  function formatDateTime(dt: string): string {
    const d = new Date(dt);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      + ' ' + d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  }

  function getInitials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }

  let presentCount = $derived(roster.filter(s => s.status === 'present').length);
  let absentCount = $derived(roster.filter(s => s.status === 'absent').length);
  let excusedCount = $derived(roster.filter(s => s.status === 'excused').length);

  // Combined list for selector: active class + past classes
  let classSelectorOptions = $derived([
    ...(activeClass ? [{ id: activeClass.id, scheduled_at: activeClass.scheduled_at, label: 'Current Class (Active)', is_catchup: false }] : []),
    ...pastClasses.map(c => ({ id: c.id, scheduled_at: c.scheduled_at, label: c.is_catchup ? 'Catch-up' : 'Regular', is_catchup: c.is_catchup })),
  ]);
</script>

<div class="attendance-tab">
  <!-- Header -->
  <div class="tab-header">
    <div>
      <h3>Attendance</h3>
      <p>Select a class session and mark attendance for each student.</p>
    </div>
  </div>

  {#if isLoading}
    <SkeletonLoader type="table" rows={5} cols={4} />

  {:else if error}
    <div class="empty-state">
      <p>⚠️ {error}</p>
    </div>

  {:else}
    <!-- Class Selector -->
    <div class="class-selector-card">
      <div class="selector-label">
        <Icon name="calendar" size={15} />
        <span>Select Class Session</span>
      </div>

      {#if classSelectorOptions.length === 0}
        <div class="no-class-msg">
          No classes found for this course. 
          <strong>Schedule a class first</strong> from the Classes tab.
        </div>
      {:else}
        <div class="class-options">
          {#each classSelectorOptions as opt}
            <button
              class="class-option-btn"
              class:selected={selectedClassId === opt.id}
              onclick={() => onClassChange(opt.id)}
            >
              <div class="co-top">
                <span class="co-label">{opt.label}</span>
                {#if opt.id === activeClass?.id}
                  <span class="live-badge">● ACTIVE</span>
                {/if}
              </div>
              <span class="co-dt">{formatDateTime(opt.scheduled_at)}</span>
            </button>
          {/each}
        </div>
      {/if}
    </div>

    {#if selectedClassId && roster.length > 0}
      <!-- Summary Bar -->
      <div class="summary-bar">
        <div class="summary-item present">
          <span class="summary-dot present"></span>
          <span class="summary-count">{presentCount}</span>
          <span class="summary-label">Present</span>
        </div>
        <div class="summary-item absent">
          <span class="summary-dot absent"></span>
          <span class="summary-count">{absentCount}</span>
          <span class="summary-label">Absent</span>
        </div>
        <div class="summary-item excused">
          <span class="summary-dot excused"></span>
          <span class="summary-count">{excusedCount}</span>
          <span class="summary-label">Excused</span>
        </div>
        <div class="summary-actions">
          <button class="bulk-btn" onclick={() => markAll('present')}>Mark All Present</button>
          <button class="bulk-btn outline" onclick={() => markAll('absent')}>Mark All Absent</button>
        </div>
      </div>

      <!-- Attendance Roster -->
      <div class="roster-card">
        {#if isRosterLoading}
          <SkeletonLoader type="table" rows={4} cols={3} />
        {:else}
          <table class="roster-table">
            <thead>
              <tr>
                <th>STUDENT</th>
                <th>EMAIL</th>
                <th style="text-align:center">ATTENDANCE</th>
              </tr>
            </thead>
            <tbody>
              {#each roster as student}
                <tr class="roster-row {student.status}">
                  <td class="student-cell">
                    <div class="avatar" class:present={student.status === 'present'} class:absent={student.status === 'absent'} class:excused={student.status === 'excused'}>
                      {getInitials(student.name)}
                    </div>
                    <span class="student-name">{student.name}</span>
                  </td>
                  <td class="email">{student.email}</td>
                  <td class="status-cell">
                    <div class="status-toggle">
                      <button
                        class="toggle-btn present"
                        class:active={student.status === 'present'}
                        onclick={() => setStatus(student.id, 'present')}
                      >✓ Present</button>
                      <button
                        class="toggle-btn absent"
                        class:active={student.status === 'absent'}
                        onclick={() => setStatus(student.id, 'absent')}
                      >✗ Absent</button>
                      <button
                        class="toggle-btn excused"
                        class:active={student.status === 'excused'}
                        onclick={() => setStatus(student.id, 'excused')}
                      >~ Excused</button>
                    </div>
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        {/if}
      </div>

      <!-- Save Bar -->
      <div class="save-bar">
        {#if saveMessage}
          <div class="save-msg" class:success={saveSuccess} class:error={!saveSuccess}>
            {saveMessage}
          </div>
        {/if}
        <button class="save-btn" onclick={submitAttendance} disabled={isSaving || isRosterLoading}>
          {#if isSaving}
            <span class="spinner"></span> Saving...
          {:else}
            <Icon name="check-circle" size={16} /> Save Attendance
          {/if}
        </button>
      </div>

    {:else if selectedClassId && roster.length === 0 && !isRosterLoading}
      <div class="empty-state">
        <div class="empty-icon">👥</div>
        <h4>No Students Found</h4>
        <p>No students are enrolled in this course yet.</p>
        <p style="font-size: 0.8rem; color: var(--text-muted);">Please contact your administrator to enroll students in this course.</p>
      </div>
    {/if}
  {/if}
</div>

<style>
  .attendance-tab { display: flex; flex-direction: column; gap: 20px; }

  .tab-header { margin-bottom: 4px; }
  .tab-header h3 { font-size: 1.1rem; font-weight: 700; color: var(--text-main); margin: 0 0 4px; }
  .tab-header p { font-size: 0.875rem; color: var(--text-muted); margin: 0; }

  /* Class Selector */
  .class-selector-card {
    background: var(--bg-card);
    border: 1px solid var(--border-color);
    border-radius: 12px;
    padding: 16px 20px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .selector-label {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 0.8rem;
    font-weight: 700;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .no-class-msg {
    font-size: 0.875rem;
    color: var(--text-muted);
    background: #fffaf0;
    border: 1px solid #feebc8;
    border-radius: 8px;
    padding: 12px 16px;
  }

  .class-options {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
  }

  .class-option-btn {
    background: #f7fafc;
    border: 1.5px solid var(--border-color);
    border-radius: 10px;
    padding: 10px 16px;
    cursor: pointer;
    text-align: left;
    transition: all 0.15s;
    display: flex;
    flex-direction: column;
    gap: 3px;
    min-width: 180px;
  }

  .class-option-btn:hover { border-color: var(--primary); background: #fff5f5; }
  .class-option-btn.selected { border-color: var(--primary); background: #fff5f5; }

  .co-top {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .co-label { font-size: 0.83rem; font-weight: 700; color: var(--text-main); }

  .live-badge {
    font-size: 0.65rem;
    font-weight: 800;
    color: #22543d;
    background: #c6f6d5;
    padding: 2px 8px;
    border-radius: 20px;
    letter-spacing: 0.5px;
    animation: pulse 2s ease-in-out infinite;
  }

  @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.6; } }

  .co-dt { font-size: 0.78rem; color: var(--text-muted); }

  /* Summary Bar */
  .summary-bar {
    display: flex;
    align-items: center;
    gap: 24px;
    background: var(--bg-card);
    border: 1px solid var(--border-color);
    border-radius: 12px;
    padding: 14px 20px;
    flex-wrap: wrap;
  }

  .summary-item {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .summary-dot {
    width: 10px; height: 10px;
    border-radius: 50%;
  }
  .summary-dot.present { background: #38a169; }
  .summary-dot.absent { background: #e53e3e; }
  .summary-dot.excused { background: #d69e2e; }

  .summary-count { font-size: 1.1rem; font-weight: 800; color: var(--text-main); }
  .summary-label { font-size: 0.8rem; color: var(--text-muted); font-weight: 500; }

  .summary-actions {
    display: flex;
    gap: 8px;
    margin-left: auto;
    flex-wrap: wrap;
  }

  .bulk-btn {
    background: var(--primary);
    color: white;
    border: none;
    padding: 8px 14px;
    border-radius: 8px;
    font-size: 0.8rem;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.15s;
  }

  .bulk-btn.outline {
    background: transparent;
    border: 1.5px solid var(--border-color);
    color: var(--text-muted);
  }

  .bulk-btn:hover { opacity: 0.85; }

  /* Roster */
  .roster-card {
    background: var(--bg-card);
    border: 1px solid var(--border-color);
    border-radius: 12px;
    overflow: hidden;
  }

  .roster-table {
    width: 100%;
    border-collapse: collapse;
    text-align: left;
  }

  .roster-table th {
    font-size: 0.72rem;
    font-weight: 700;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    padding: 12px 20px;
    border-bottom: 1px solid var(--border-color);
    background: #fafbfc;
  }

  .roster-table td {
    padding: 12px 20px;
    border-bottom: 1px solid var(--border-color);
    vertical-align: middle;
  }

  .roster-row:last-child td { border-bottom: none; }
  .roster-row:hover { background: #f7fafc; }

  .roster-row.present { background: rgba(56,161,105,0.03); }
  .roster-row.absent { background: rgba(229,62,62,0.03); }
  .roster-row.excused { background: rgba(214,158,46,0.03); }

  .student-cell {
    display: flex !important;
    align-items: center;
    gap: 12px;
  }

  .avatar {
    width: 36px; height: 36px;
    border-radius: 50%;
    background: #edf2f7;
    color: #4a5568;
    font-weight: 700;
    font-size: 0.78rem;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    transition: all 0.2s;
  }

  .avatar.present { background: #c6f6d5; color: #276749; }
  .avatar.absent { background: #fed7d7; color: #c53030; }
  .avatar.excused { background: #feebc8; color: #c05621; }

  .student-name { font-weight: 600; font-size: 0.875rem; color: var(--text-main); }

  .email { font-size: 0.82rem; color: var(--text-muted); }

  .status-cell { text-align: center; }

  .status-toggle {
    display: flex;
    gap: 6px;
    justify-content: center;
  }

  .toggle-btn {
    padding: 5px 12px;
    border-radius: 20px;
    border: 1.5px solid var(--border-color);
    background: transparent;
    color: var(--text-muted);
    font-size: 0.75rem;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.15s;
  }

  .toggle-btn:hover { opacity: 0.8; }

  .toggle-btn.present.active { background: #c6f6d5; border-color: #38a169; color: #276749; }
  .toggle-btn.absent.active { background: #fed7d7; border-color: #e53e3e; color: #c53030; }
  .toggle-btn.excused.active { background: #feebc8; border-color: #d69e2e; color: #c05621; }

  /* Save Bar */
  .save-bar {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 16px;
    padding: 16px 0;
    border-top: 1px solid var(--border-color);
    flex-wrap: wrap;
  }

  .save-msg {
    font-size: 0.875rem;
    font-weight: 600;
    padding: 8px 14px;
    border-radius: 8px;
  }

  .save-msg.success { background: #f0fff4; color: #276749; border: 1px solid #c6f6d5; }
  .save-msg.error { background: #fff5f5; color: #c53030; border: 1px solid #fed7d7; }

  .save-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    background: var(--primary);
    color: white;
    border: none;
    padding: 11px 22px;
    border-radius: 10px;
    font-weight: 700;
    font-size: 0.875rem;
    cursor: pointer;
    transition: all 0.18s;
    box-shadow: 0 4px 14px rgba(229,62,62,0.25);
  }

  .save-btn:hover:not(:disabled) { transform: translateY(-1px); }
  .save-btn:disabled { opacity: 0.65; cursor: not-allowed; }

  .spinner {
    width: 14px; height: 14px;
    border: 2px solid rgba(255,255,255,0.3);
    border-top-color: white;
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
    display: inline-block;
  }

  @keyframes spin { to { transform: rotate(360deg); } }

  /* Empty State */
  .empty-state {
    background: var(--bg-card);
    border: 1px dashed #cbd5e0;
    border-radius: 12px;
    padding: 48px 32px;
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
  }

  .empty-icon { font-size: 2.5rem; }

  .empty-state h4 {
    font-size: 1rem;
    font-weight: 700;
    color: var(--text-main);
    margin: 0;
  }

  .empty-state p { font-size: 0.875rem; color: var(--text-muted); margin: 0; }

  .hint {
    font-size: 0.78rem !important;
    background: #f7fafc;
    padding: 8px 14px;
    border-radius: 8px;
    border: 1px solid #e2e8f0;
    color: #999 !important;
  }

  .hint code {
    font-family: monospace;
    background: #edf2f7;
    padding: 2px 5px;
    border-radius: 4px;
    color: #e53e3e;
  }
</style>
