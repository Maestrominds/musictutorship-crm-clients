<script lang="ts">
  import Icon from '$lib/Icon.svelte';
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

  // Writable teaching classes state using Svelte 5 state
  let classes = $state<TeachingClass[]>([
    { id: 1, studentName: 'Alex Johnson', studentId: '#9821', course: 'Piano Fundamentals', courseLevel: 'Advanced Level', dateTime: 'Oct 24, 2023, 10:00 AM - 11:30 AM', meetingType: 'Join', meetingLink: 'https://zoom.us', status: 'Upcoming', hasFeedback: false },
    { id: 2, studentName: 'Maria Garcia', studentId: '#7742', course: 'Vocal Training', courseLevel: 'Intermediate', dateTime: 'Oct 24, 2023, 02:00 PM - 03:00 PM', meetingType: 'JoinActive', meetingLink: 'https://zoom.us', status: 'In Progress', hasFeedback: false },
    { id: 3, studentName: 'James Wilson', studentId: '#9011', course: 'Guitar Mastery', courseLevel: 'Pro Course', dateTime: 'Oct 23, 2023, 11:00 AM - 12:00 PM', meetingType: 'Recording', meetingLink: 'https://zoom.us', status: 'Completed', hasFeedback: true },
    { id: 4, studentName: 'Sarah Lee', studentId: '#1009', course: 'Violin Intro', courseLevel: 'Beginner', dateTime: 'Oct 25, 2023, 09:00 AM - 10:00 AM', meetingType: 'Join', meetingLink: 'https://zoom.us', status: 'Upcoming', hasFeedback: false }
  ]);

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
                <a href={item.meetingLink} class="zoom-link red" target="_blank" rel="noreferrer">
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                    <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/>
                  </svg>
                  Join Meeting
                </a>
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
      <span class="results-count">Showing 1-{classes.length} of 24 classes</span>
      <div class="pagination">
        <button class="pag-btn prev">◀</button>
        <button class="pag-btn active">1</button>
        <button class="pag-btn">2</button>
        <button class="pag-btn">3</button>
        <span class="pag-dots">...</span>
        <button class="pag-btn">9</button>
        <button class="pag-btn next">▶</button>
      </div>
    </div>
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
