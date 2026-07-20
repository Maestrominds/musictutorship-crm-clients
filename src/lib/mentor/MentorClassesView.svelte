<script lang="ts">
  import Icon from '$lib/Icon.svelte';
  import { onMount } from 'svelte';
  import { apiGet, apiPost } from '$lib/api';
  import SkeletonLoader from '$lib/SkeletonLoader.svelte';

  interface ApiClass {
    id: number;
    course_assignment_id: number;
    scheduled_at: string;
    is_catchup: boolean;
    gmeet_link: string | null;
    created_at: string;
    course_title?: string;
    student_name?: string;
    student_id?: number;
  }

  interface TeachingClass {
    id: number;
    studentName: string;
    studentId: string;
    course: string;
    courseLevel: string;
    dateTime: string;
    meetingType: 'Join' | 'JoinActive' | 'Recording';
    meetingLink: string;
    status: 'Upcoming' | 'In Progress' | 'Completed';
    hasFeedback: boolean;
  }

  let classes = $state<TeachingClass[]>([]);
  let isLoading = $state(true);
  let errorMsg = $state('');

  // Scheduling State
  let showScheduleModal = $state(false);
  let scheduleClassId = $state(0);
  let scheduleStudentEmail = $state('');
  let isScheduling = $state(false);
  let scheduleError = $state('');

  function mapApiClass(c: ApiClass): TeachingClass {
    const scheduledDate = new Date(c.scheduled_at);
    const now = new Date();
    let status: 'Upcoming' | 'In Progress' | 'Completed' = 'Upcoming';
    if (scheduledDate < now) status = 'Completed';

    return {
      id: c.id,
      studentName: c.student_name || 'Student',
      studentId: c.student_id ? `#${c.student_id}` : `#${c.course_assignment_id}`,
      course: c.course_title || 'Music Course',
      courseLevel: c.is_catchup ? 'Catch-up' : 'Regular',
      dateTime: scheduledDate.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }),
      meetingType: c.gmeet_link ? (status === 'Completed' ? 'Recording' : 'JoinActive') : 'Join',
      meetingLink: c.gmeet_link || '#',
      status,
      hasFeedback: false
    };
  }

  onMount(async () => {
    try {
      const data = await apiGet<ApiClass[]>('/mentor/classes');
      classes = (data || []).map(mapApiClass);
    } catch (err) {
      errorMsg = err instanceof Error ? err.message : 'Failed to load classes';
    } finally {
      isLoading = false;
    }
  });

  function openScheduleModal(classId: number) {
    scheduleClassId = classId;
    scheduleStudentEmail = '';
    scheduleError = '';
    showScheduleModal = true;
  }

  function closeScheduleModal() {
    showScheduleModal = false;
  }

  async function handleSchedule(e: SubmitEvent) {
    e.preventDefault();
    isScheduling = true;
    scheduleError = '';
    try {
      const res = await apiPost<any>('/mentor/classes/schedule', {
        class_id: scheduleClassId,
        student_email: scheduleStudentEmail
      });
      // Update local state
      classes = classes.map(c => {
        if (c.id === scheduleClassId) {
          c.meetingLink = res.gmeet_link;
          c.meetingType = 'JoinActive';
        }
        return c;
      });
      closeScheduleModal();
    } catch (err: any) {
      scheduleError = err.message || 'Failed to schedule class';
    } finally {
      isScheduling = false;
    }
  }

  function getInitials(name: string) {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }
</script>

<div class="mentor-classes-view">
  <div class="header-row">
    <div class="header-text">
      <h2>My Classes</h2>
      <p>Manage and track your upcoming teaching schedule.</p>
    </div>
    <button class="schedule-btn">
      <span><Icon name="plus" size={14} /></span> Schedule Class
    </button>
  </div>

  <div class="filter-card">
    <button class="filters-btn"><span><Icon name="filter" size={14} /></span> Filters</button>
  </div>

  <div class="table-card">
    {#if isLoading}
      <SkeletonLoader type="table" rows={5} cols={6} />
    {:else if errorMsg}
      <div class="empty-state error"><p>⚠️ {errorMsg}</p></div>
    {:else}
    <table class="classes-table">
      <thead>
        <tr>
          <th>STUDENT NAME</th>
          <th>COURSE</th>
          <th>DATE & TIME</th>
          <th>MEETING LINK</th>
          <th>STATUS</th>
          <th>ACTIONS</th>
        </tr>
      </thead>
      <tbody>
        {#if classes.length === 0}
          <tr><td colspan="6" class="empty-cell">No classes scheduled yet.</td></tr>
        {/if}
        {#each classes as item}
          <tr>
            <td class="student-cell">
              <div class="avatar-circle">{getInitials(item.studentName)}</div>
              <div class="student-info">
                <span class="name">{item.studentName}</span>
                <span class="id">Student ID: {item.studentId}</span>
              </div>
            </td>
            <td>
              <div class="course-name">{item.course}</div>
              <div class="course-level">{item.courseLevel}</div>
            </td>
            <td class="date-text">{item.dateTime}</td>
            <td>
              {#if item.meetingType === 'Join'}
                <button class="zoom-link red" style="background:none;border:1px solid #e53e3e;cursor:pointer;" onclick={() => openScheduleModal(item.id)}>
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                    <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                  </svg>
                  Generate Link
                </button>
              {:else if item.meetingType === 'JoinActive'}
                <a href={item.meetingLink} class="zoom-link green" target="_blank" rel="noreferrer">
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                    <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/>
                  </svg>
                  Join Meeting
                </a>
              {:else}
                <span class="recording-link"><Icon name="activity" size={13} /> Recording</span>
              {/if}
            </td>
            <td>
              <span class="status-badge" class:upcoming={item.status === 'Upcoming'} class:active={item.status === 'In Progress'} class:completed={item.status === 'Completed'}>
                {item.status}
              </span>
            </td>
            <td>
              <div class="actions-row">
                {#if item.status === 'Upcoming'}
                  <button class="action-btn red" title="Cancel class"><Icon name="x" size={14} /></button>
                  <button class="action-btn" title="Reschedule"><Icon name="calendar" size={14} /></button>
                {:else if item.status === 'In Progress'}
                  <button class="join-now-btn">Join Now</button>
                {:else if item.status === 'Completed'}
                  <button class="feedback-btn">Feedback</button>
                {/if}
                <button class="info-btn" title="Class Details"><Icon name="info" size={14} /></button>
              </div>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>

    <div class="table-footer">
      <span class="results-count">Showing {classes.length} class{classes.length !== 1 ? 'es' : ''}</span>
    </div>
    {/if}
  </div>

  <div class="classes-stats-grid">
    <div class="stat-card">
      <div class="stat-icon red-bg"><Icon name="calendar" size={20} /></div>
      <div class="stat-info">
        <span class="label">Total Classes</span>
        <div class="value">28</div>
      </div>
    </div>

    <div class="summary-card">
      <div class="stat-icon yellow-bg"><Icon name="star" size={20} /></div>
      <div class="stat-info">
        <span class="label">Avg. Rating</span>
        <div class="value">4.8</div>
      </div>
    </div>

    <div class="summary-card">
      <div class="stat-icon purple-bg"><Icon name="clock" size={20} /></div>
      <div class="stat-info">
        <span class="trend">TOTAL HOURS</span>
        <div class="value">148</div>
        <span class="label">Teaching Hours</span>
      </div>
    </div>
  </div>
  <!-- Schedule Modal -->
  {#if showScheduleModal}
    <div class="modal-overlay" onclick={closeScheduleModal} aria-hidden="true">
      <div class="modal-content" onclick={e => e.stopPropagation()} role="dialog">
        <div class="modal-header">
          <h3>Generate Meeting Link</h3>
          <button class="close-btn" onclick={closeScheduleModal}>&times;</button>
        </div>
        <form class="modal-form" onsubmit={handleSchedule}>
          <div class="form-group">
            <label for="studentEmail">Student Email</label>
            <input type="email" id="studentEmail" bind:value={scheduleStudentEmail} placeholder="student@example.com" required style="padding: 10px 14px; border: 1px solid var(--border-color); border-radius: var(--radius-md); background-color: #f8fafc; font-size: 0.9rem; width: 100%;" />
            <span style="font-size: 0.8rem; color: var(--text-muted); margin-top: 4px;">Needed for Google Calendar invite</span>
          </div>
          {#if scheduleError}
            <div style="color: #e53e3e; font-size: 0.9rem; margin-top: 10px;">{scheduleError}</div>
          {/if}
          <div class="modal-actions" style="margin-top: 24px; display: flex; justify-content: flex-end; gap: 12px;">
            <button type="button" class="cancel-btn" onclick={closeScheduleModal} style="padding: 10px 16px; border: 1px solid var(--border-color); background: white; border-radius: var(--radius-md); cursor: pointer;">Cancel</button>
            <button type="submit" class="save-btn" disabled={isScheduling} style="padding: 10px 16px; border: none; background: var(--primary); color: white; border-radius: var(--radius-md); font-weight: 600; cursor: pointer;">
              {isScheduling ? 'Generating...' : 'Generate Link'}
            </button>
          </div>
        </form>
      </div>
    </div>
  {/if}
</div>

<style>
  .mentor-classes-view {
    display: flex;
    flex-direction: column;
    gap: 24px;
  }

  .header-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .header-text h2 {
    font-size: 1.75rem;
    font-weight: 700;
    color: var(--text-main);
    letter-spacing: -0.5px;
  }

  .header-text p {
    color: var(--text-muted);
    font-size: 0.95rem;
  }

  .schedule-btn {
    background-color: var(--primary);
    color: white;
    border: none;
    border-radius: var(--radius-md);
    padding: 10px 18px;
    font-weight: 600;
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(229, 62, 62, 0.2);
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .filter-card {
    background-color: var(--bg-card);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-md);
    padding: 16px;
    box-shadow: var(--shadow-sm);
  }

  .filters-btn {
    border: 1px solid var(--border-color);
    background-color: var(--bg-card);
    color: var(--text-main);
    font-weight: 600;
    padding: 8px 16px;
    border-radius: var(--radius-sm);
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  /* Table Card styling */
  .table-card {
    background-color: var(--bg-card);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-md);
    box-shadow: var(--shadow-sm);
    overflow: hidden;
  }

  .classes-table {
    width: 100%;
    border-collapse: collapse;
    text-align: left;
  }

  .classes-table th {
    font-size: 0.75rem;
    font-weight: 700;
    color: var(--text-muted);
    padding: 14px 20px;
    border-bottom: 1px solid var(--border-color);
    background-color: #fafbfc;
  }

  .classes-table td {
    padding: 16px 20px;
    font-size: 0.9rem;
    border-bottom: 1px solid var(--border-color);
    vertical-align: middle;
  }

  .student-cell {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .avatar-circle {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background-color: #fed7d7;
    color: #c53030;
    font-weight: 700;
    font-size: 0.8rem;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .student-info {
    display: flex;
    flex-direction: column;
  }

  .student-info .name {
    font-weight: 700;
    color: var(--text-main);
  }

  .student-info .id {
    font-size: 0.75rem;
    color: var(--text-muted);
  }

  .course-name {
    font-weight: 700;
    color: var(--text-main);
  }

  .course-level {
    font-size: 0.75rem;
    color: var(--text-muted);
  }

  .date-text {
    font-weight: 500;
    color: var(--text-main);
  }

  .zoom-link {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-weight: 700;
  }

  .zoom-link.red { color: #e53e3e; }
  .zoom-link.green { color: #38a169; }

  .recording-link {
    color: var(--text-muted);
    font-weight: 600;
    font-size: 0.85rem;
  }

  .status-badge {
    padding: 4px 10px;
    border-radius: var(--radius-full);
    font-size: 0.75rem;
    font-weight: 700;
    display: inline-block;
  }

  .status-badge.upcoming { background-color: #ebf8ff; color: #2b6cb0; }
  .status-badge.active { background-color: #c6f6d5; color: #22543d; }
  .status-badge.completed { background-color: #edf2f7; color: #4a5568; }

  .actions-row {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .action-btn {
    border: 1px solid var(--border-color);
    background: transparent;
    width: 28px;
    height: 28px;
    border-radius: var(--radius-sm);
    cursor: pointer;
    font-size: 0.8rem;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .join-now-btn {
    background-color: var(--primary);
    color: white;
    border: none;
    border-radius: var(--radius-sm);
    padding: 6px 14px;
    font-weight: 600;
    font-size: 0.8rem;
    cursor: pointer;
  }

  .feedback-btn {
    border: 1px solid var(--border-color);
    background-color: var(--bg-card);
    color: var(--text-main);
    padding: 6px 14px;
    font-weight: 600;
    font-size: 0.8rem;
    border-radius: var(--radius-sm);
    cursor: pointer;
  }

  .info-btn {
    border: none;
    background: transparent;
    cursor: pointer;
    font-size: 1rem;
    color: var(--text-muted);
  }

  .table-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 20px;
    background-color: #fafbfc;
  }

  .results-count {
    font-size: 0.8rem;
    color: var(--text-muted);
  }

  .pagination {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .pag-btn {
    border: 1px solid var(--border-color);
    background-color: var(--bg-card);
    color: var(--text-muted);
    padding: 6px 12px;
    font-size: 0.8rem;
    font-weight: 600;
    border-radius: var(--radius-sm);
    cursor: pointer;
  }

  .pag-btn.active {
    background-color: var(--primary);
    color: white;
    border-color: var(--primary);
  }

  /* Stats grid */
  .classes-stats-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 20px;
  }

  .classes-stats-grid .stat-card {
    background-color: var(--bg-card);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-md);
    padding: 20px;
    display: flex;
    align-items: center;
    gap: 16px;
    box-shadow: var(--shadow-sm);
  }

  .classes-stats-grid .stat-icon {
    width: 44px;
    height: 44px;
    border-radius: var(--radius-sm);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.2rem;
  }

  .classes-stats-grid .stat-icon.red-bg { background-color: #fff5f5; color: #e53e3e; }
  .classes-stats-grid .stat-icon.yellow-bg { background-color: #fffaf0; color: #dd6b20; }
  .classes-stats-grid .stat-icon.purple-bg { background-color: #faf5ff; color: #805ad5; }

  .classes-stats-grid .stat-info {
    display: flex;
    flex-direction: column;
  }

  .classes-stats-grid .trend {
    font-size: 0.65rem;
    font-weight: 700;
    color: #38a169;
  }

  .classes-stats-grid .value {
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--text-main);
    line-height: 1.2;
  }

  .classes-stats-grid .label {
    font-size: 0.75rem;
    color: var(--text-muted);
    font-weight: 600;
  }
</style>
