<script lang="ts">
  import Icon from '$lib/Icon.svelte';
  import { onMount } from 'svelte';
  import { apiGet } from '$lib/api';
  import SkeletonLoader from '$lib/SkeletonLoader.svelte';

  // GET /mentor/classes returns Class model: { id, course_assignment_id, scheduled_at, is_catchup, gmeet_link, created_at }
  // Note: course_title and student_name are NOT in the raw Class model.
  // GET /mentor/stats returns: { assigned_students, upcoming_classes, completed_classes }
  // GET /mentor/students returns GetMentorStudentsListRow: { id, name, email, course_title, progress_percent, next_class_at }
  interface ApiClass {
    id: number;
    course_assignment_id: number;
    scheduled_at: string;
    is_catchup: boolean;
    gmeet_link: string | null;
    created_at: string;
  }

  let upcomingClasses = $state<{ name: string; initials: string; course: string; dateTime: string; isActionable: boolean }[]>([]);
  let stats = $state({ assignedStudents: 0, upcomingCount: 0, completedCount: 0 });
  let recentActivities = $state<{ name: string; time: string; level: string; status: string; lastActive: string; progress: number }[]>([]);
  let isLoading = $state(true);

  onMount(async () => {
    try {
      const data = await apiGet<ApiClass[]>('/mentor/classes');
      const classes = data || [];
      const now = new Date();

      upcomingClasses = classes
        .filter(c => new Date(c.scheduled_at) >= now)
        .slice(0, 5)
        .map(c => ({
          name: c.is_catchup ? 'Catch-up Session' : 'Class Session',
          initials: c.is_catchup ? 'CU' : 'CS',
          course: `Assignment #${c.course_assignment_id}`,
          dateTime: new Date(c.scheduled_at).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }),
          isActionable: !!c.gmeet_link
        }));
    } catch (err) {
      console.error(err);
    }

    try {
      const statsRes = await apiGet<any>('/mentor/stats');
      stats = {
        assignedStudents: statsRes.assigned_students || 0,
        upcomingCount: statsRes.upcoming_classes || 0,
        completedCount: statsRes.completed_classes || 0
      };
    } catch (err) {
      console.error(err);
    }

    try {
      const students = await apiGet<any[]>('/mentor/students');
      recentActivities = (students || []).slice(0, 5).map(s => ({
        name: s.name,
        time: s.next_class_at ? `Next: ${new Date(s.next_class_at).toLocaleDateString()}` : 'No classes scheduled',
        level: s.course_title,
        status: s.progress_percent >= 100 ? 'Completed' : 'Active',
        lastActive: s.next_class_at ? new Date(s.next_class_at).toLocaleDateString() : 'N/A',
        progress: s.progress_percent
      }));
    } catch (err) {
      console.error(err);
    } finally {
      isLoading = false;
    }
  });
</script>

<div class="mentor-dash-view">
  {#if isLoading}
    <SkeletonLoader type="dashboard" />
  {:else}
  <section class="stats-row">
    <div class="stat-card">
      <div class="stat-icon red-bg"><Icon name="graduation" size={20} /></div>
      <div class="stat-info">
        <span class="label">Assigned Students</span>
        <!-- NOTE: requires GET /api/mentor/stats — see backend_dev_todo.md #11 -->
        <div class="value">{stats.assignedStudents || '—'}</div>
      </div>
    </div>

    <div class="stat-card">
      <div class="stat-icon green-bg"><Icon name="calendar" size={20} /></div>
      <div class="stat-info">
        <span class="label">Upcoming Classes</span>
        <div class="value">{stats.upcomingCount}</div>
      </div>
    </div>

    <div class="stat-card">
      <div class="stat-icon orange-bg"><Icon name="check-circle" size={20} /></div>
      <div class="stat-info">
        <span class="label">Completed Classes</span>
        <div class="value">{stats.completedCount}</div>
      </div>
    </div>
  </section>

  <!-- Split grid for Today's Classes and Recent Activity -->
  <section class="dash-grid">
    <!-- Left Column: Upcoming Classes Today -->
    <div class="classes-card">
      <div class="card-header">
        <h3>Upcoming Classes Today</h3>
        <button class="view-all-link">View All</button>
      </div>

      <table class="today-classes-table">
        <thead>
          <tr>
            <th>STUDENT NAME</th>
            <th>COURSE</th>
            <th>DATE & TIME</th>
            <th>ACTION</th>
          </tr>
        </thead>
        <tbody>
          {#each upcomingClasses as item}
            <tr>
              <td class="student-cell">
                <div class="avatar-sm">{item.initials}</div>
                <span class="name-text">{item.name}</span>
              </td>
              <td class="course-text">{item.course}</td>
              <td class="date-text">{item.dateTime}</td>
              <td>
                {#if item.isActionable}
                  <button class="join-btn">Join Meeting</button>
                {:else}
                  <span class="tomorrow-badge">Tomorrow</span>
                {/if}
              </td>
            </tr>
          {/each}
          {#if upcomingClasses.length === 0 && !isLoading}
            <tr><td colspan="4" class="empty-cell">No upcoming classes. Schedule one from My Classes tab.</td></tr>
          {/if}
        </tbody>
      </table>
    </div>

    <!-- Right Column: Recent Activity -->
    <div class="activity-card">
      <div class="card-header">
        <h3>Recent Activity</h3>
      </div>

      <div class="activity-list">
        {#each recentActivities as act}
          <div class="activity-item">
            <div class="avatar-circle"><Icon name="user" size={18} /></div>
            <div class="activity-details">
              <div class="act-header">
                <span class="name">{act.name}</span>
                <span class="time">{act.time}</span>
              </div>
              <div class="level">{act.level}</div>
              
              {#if act.status === 'Completed'}
                <div class="progress-info">
                  <div class="status-pill completed">course-completed</div>
                  <span class="date">Last: {act.lastActive}</span>
                </div>
              {:else}
                <div class="progress-bar-wrapper">
                  <div class="bar-bg">
                    <div class="bar-fill" style="width: {act.progress}%"></div>
                  </div>
                  <span class="pct">Progress: {act.progress}%</span>
                </div>
                <div class="act-footer">
                  <span class="date">Last: {act.lastActive}</span>
                </div>
              {/if}
            </div>
          </div>
        {:else}
          {#if !isLoading}
            <div class="empty-state-inline"><p>No assigned students or activities yet.</p></div>
          {/if}
        {/each}
      </div>

      <button class="view-all-act-btn">View All Activity</button>
    </div>
  </section>
  {/if}
</div>

<style>
  .mentor-dash-view {
    display: flex;
    flex-direction: column;
    gap: 28px;
  }

  /* Stats Row */
  .stats-row {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 20px;
  }

  .stat-card {
    background-color: var(--bg-card);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-md);
    padding: 24px;
    display: flex;
    align-items: center;
    gap: 20px;
    box-shadow: var(--shadow-sm);
  }

  .stat-icon {
    width: 48px;
    height: 48px;
    border-radius: var(--radius-md);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.4rem;
  }

  .stat-icon.red-bg { background-color: #fff5f5; color: #e53e3e; }
  .stat-icon.green-bg { background-color: #f0fff4; color: #38a169; }
  .stat-icon.orange-bg { background-color: #fffaf0; color: #dd6b20; }

  .stat-info {
    display: flex;
    flex-direction: column;
  }

  .stat-info .label {
    font-size: 0.85rem;
    font-weight: 600;
    color: var(--text-muted);
  }

  .stat-info .value {
    font-size: 1.8rem;
    font-weight: 700;
    color: var(--text-main);
  }

  /* Dash Grid */
  .dash-grid {
    display: grid;
    grid-template-columns: 2fr 1.2fr;
    gap: 24px;
  }

  .classes-card, .activity-card {
    background-color: var(--bg-card);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-md);
    padding: 24px;
    box-shadow: var(--shadow-sm);
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
  }

  .card-header h3 {
    font-size: 1rem;
    font-weight: 700;
    color: var(--text-main);
  }

  .view-all-link {
    background: transparent;
    border: none;
    color: var(--primary);
    font-size: 0.85rem;
    font-weight: 700;
    cursor: pointer;
  }

  /* Classes Table */
  .today-classes-table {
    width: 100%;
    border-collapse: collapse;
    text-align: left;
  }

  .today-classes-table th {
    font-size: 0.75rem;
    font-weight: 700;
    color: var(--text-muted);
    padding: 10px 14px;
    border-bottom: 1px solid var(--border-color);
  }

  .today-classes-table td {
    padding: 16px 14px;
    font-size: 0.85rem;
    border-bottom: 1px solid var(--border-color);
    vertical-align: middle;
  }

  .student-cell {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .avatar-sm {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background-color: #edf2f7;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.75rem;
    font-weight: 700;
    color: var(--text-muted);
  }

  .name-text {
    font-weight: 700;
    color: var(--text-main);
  }

  .course-text {
    font-weight: 500;
    color: var(--text-main);
  }

  .date-text {
    font-weight: 500;
    color: var(--text-muted);
  }

  .join-btn {
    background-color: var(--primary);
    color: white;
    border: none;
    border-radius: var(--radius-sm);
    padding: 6px 16px;
    font-weight: 600;
    cursor: pointer;
    font-size: 0.8rem;
    box-shadow: 0 2px 6px rgba(229, 62, 62, 0.2);
    transition: all 0.2s;
  }

  .join-btn:hover {
    background-color: var(--primary-hover);
  }

  .tomorrow-badge {
    background-color: #edf2f7;
    color: #4a5568;
    padding: 4px 10px;
    border-radius: var(--radius-sm);
    font-size: 0.75rem;
    font-weight: 600;
  }

  /* Activity Column */
  .activity-list {
    display: flex;
    flex-direction: column;
    gap: 20px;
    margin-bottom: 24px;
  }

  .activity-item {
    display: flex;
    gap: 12px;
  }

  .activity-item .avatar-circle {
    width: 34px;
    height: 34px;
    border-radius: 50%;
    background-color: #e2e8f0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.85rem;
    flex-shrink: 0;
  }

  .activity-details {
    display: flex;
    flex-direction: column;
    flex-grow: 1;
    gap: 4px;
  }

  .act-header {
    display: flex;
    justify-content: space-between;
    font-size: 0.85rem;
  }

  .act-header .name {
    font-weight: 700;
    color: var(--text-main);
  }

  .act-header .time {
    color: var(--text-muted);
    font-size: 0.75rem;
  }

  .activity-details .level {
    font-size: 0.75rem;
    color: var(--text-muted);
  }

  .progress-bar-wrapper {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 4px;
  }

  .bar-bg {
    height: 6px;
    background-color: #edf2f7;
    border-radius: var(--radius-full);
    flex-grow: 1;
    overflow: hidden;
  }

  .bar-fill {
    height: 100%;
    background-color: var(--primary);
  }

  .progress-bar-wrapper .pct {
    font-size: 0.7rem;
    font-weight: 700;
    color: var(--text-muted);
    white-space: nowrap;
  }

  .act-footer {
    display: flex;
    justify-content: flex-end;
    font-size: 0.7rem;
    color: var(--text-muted);
  }

  .progress-info {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 4px;
  }

  .status-pill.completed {
    background-color: #c6f6d5;
    color: #22543d;
    font-size: 0.7rem;
    font-weight: 700;
    padding: 2px 8px;
    border-radius: var(--radius-full);
  }

  .progress-info .date {
    font-size: 0.7rem;
    color: var(--text-muted);
  }

  .view-all-act-btn {
    width: 100%;
    padding: 10px;
    border: 1px solid var(--border-color);
    background-color: transparent;
    border-radius: var(--radius-md);
    font-weight: 600;
    color: var(--text-main);
    cursor: pointer;
    transition: background 0.2s;
    font-size: 0.85rem;
  }

  .view-all-act-btn:hover {
    background-color: #f7fafc;
  }

  @media (max-width: 1024px) {
    .stats-row { grid-template-columns: 1fr; }
    .dash-grid { grid-template-columns: 1fr; }
  }
</style>
