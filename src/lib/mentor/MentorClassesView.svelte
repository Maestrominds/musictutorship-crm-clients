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
  }

  interface ScheduledClass {
    id: number;
    course: string;
    courseLevel: string;
    dateTime: string;
    status: 'Upcoming' | 'In Progress' | 'Completed';
  }


  let isLoading = $state(true);
  let errorMsg = $state('');
  
  // Stats State
  let stats = $state({
    total_classes: 0,
    avg_rating: 0.0,
    total_hours: 0
  });

  function mapApiClass(c: ApiClass): ScheduledClass {
    const scheduledDate = new Date(c.scheduled_at);
    const now = new Date();
    let status: 'Upcoming' | 'In Progress' | 'Completed' = 'Upcoming';
    if (scheduledDate < now) status = 'Completed';

    return {
      id: c.id,
      course: c.course_title || 'Music Course',
      courseLevel: c.is_catchup ? 'Catch-up' : 'Regular',
      dateTime: scheduledDate.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }),
      status
    };
  }

  onMount(async () => {
    try {
      const [classesData, statsData] = await Promise.all([
        apiGet<ApiClass[]>('/mentor/classes').catch(() => []),
        apiGet<any>('/mentor/stats').catch(() => null)
      ]);
      scheduledClasses = (classesData || []).map(mapApiClass);
      
      if (statsData) {
        stats = {
          total_classes: statsData.completed_classes ?? statsData.total_classes ?? 0,
          avg_rating: statsData.assigned_students ?? statsData.avg_rating ?? 0.0,
          total_hours: statsData.upcoming_classes ?? statsData.total_hours ?? 0
        };
      }


    } catch (err) {
      errorMsg = err instanceof Error ? err.message : 'Failed to load classes';
    } finally {
      isLoading = false;
    }
  });


</script>

<div class="mentor-classes-view">
  <div class="header-row">
    <div class="header-text">
      <h2>My Classes & Requests</h2>
      <p>Manage your teaching schedule.</p>
    </div>
    <button class="schedule-btn">
      <span><Icon name="plus" size={14} /></span> Schedule Class
    </button>
  </div>

  <div class="classes-stats-grid">
    <div class="stat-card">
      <div class="stat-icon red-bg"><Icon name="calendar" size={20} /></div>
      <div class="stat-info">
        <span class="label">Total Classes</span>
        <div class="value">{stats.total_classes}</div>
      </div>
    </div>

    <div class="summary-card stat-card">
      <div class="stat-icon yellow-bg"><Icon name="star" size={20} /></div>
      <div class="stat-info">
        <span class="label">Students</span>
        <div class="value">{stats.avg_rating}</div>
      </div>
    </div>

    <div class="summary-card stat-card">
      <div class="stat-icon purple-bg"><Icon name="clock" size={20} /></div>
      <div class="stat-info">
        <span class="label">Upcoming</span>
        <div class="value">{stats.total_hours}</div>
      </div>
    </div>
  </div>

  {#if isLoading}
    <SkeletonLoader type="table" rows={4} cols={5} />
  {:else if errorMsg}
    <div class="empty-state error"><p>⚠️ {errorMsg}</p></div>
  {:else}

    <!-- Table 1: Mentor Scheduled Classes -->
    <div class="table-card">
      <div class="card-header">
        <h3>My Scheduled Classes</h3>
        <p class="subtitle">Classes you have scheduled. Links are automatically generated and emailed to enrolled students.</p>
      </div>
      <table class="classes-table">
        <thead>
          <tr>
            <th>COURSE</th>
            <th>DATE & TIME</th>
            <th>STATUS</th>
            <th style="text-align: right;">ACTIONS</th>
          </tr>
        </thead>
        <tbody>
          {#if scheduledClasses.length === 0}
            <tr><td colspan="4" class="empty-cell">No classes scheduled yet.</td></tr>
          {/if}
          {#each scheduledClasses as item}
            <tr>
              <td>
                <div class="course-name">{item.course}</div>
                <div class="course-level">{item.courseLevel}</div>
              </td>
              <td class="date-text">{item.dateTime}</td>
              <td>
                <span class="status-badge" class:upcoming={item.status === 'Upcoming'} class:active={item.status === 'In Progress'} class:completed={item.status === 'Completed'}>
                  {item.status}
                </span>
              </td>
              <td style="text-align: right;">
                <div class="actions-row">
                  {#if item.status === 'Upcoming'}
                    <button class="action-btn" title="Edit Class"><Icon name="edit" size={14} /></button>
                    <button class="action-btn red" title="Cancel Class"><Icon name="x" size={14} /></button>
                  {:else}
                    <button class="info-btn" title="Class Details"><Icon name="info" size={14} /></button>
                  {/if}
                </div>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
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
    font-size: 0.9rem;
    display: flex;
    align-items: center;
    gap: 8px;
    box-shadow: 0 4px 10px rgba(229, 62, 62, 0.2);
    transition: all 0.2s;
  }

  .schedule-btn:hover {
    background-color: var(--primary-hover);
    transform: translateY(-1px);
  }

  .classes-stats-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 20px;
  }

  .stat-card {
    background-color: var(--bg-card);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-md);
    padding: 20px;
    display: flex;
    align-items: center;
    gap: 16px;
    box-shadow: var(--shadow-sm);
  }

  .stat-icon {
    width: 44px;
    height: 44px;
    border-radius: var(--radius-md);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.2rem;
  }

  .stat-icon.red-bg { background-color: #fff5f5; color: #e53e3e; }
  .stat-icon.yellow-bg { background-color: #fffff0; color: #d69e2e; }
  .stat-icon.purple-bg { background-color: #faf5ff; color: #805ad5; }

  .stat-info { display: flex; flex-direction: column; }
  .stat-info .label { font-size: 0.8rem; font-weight: 600; color: var(--text-muted); }
  .stat-info .value { font-size: 1.6rem; font-weight: 700; color: var(--text-main); }

  .table-card {
    background-color: var(--bg-card);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-md);
    box-shadow: var(--shadow-sm);
    overflow: hidden;
  }
  
  .request-card {
    border: 1px solid #feebc8;
  }
  
  .request-card .card-header {
    background-color: #fffaf0;
    border-bottom: 1px solid #feebc8;
  }

  .card-header {
    padding: 16px 20px;
    border-bottom: 1px solid var(--border-color);
  }

  .card-header h3 {
    font-size: 1.1rem;
    font-weight: 700;
    color: var(--text-main);
  }

  .card-header .subtitle {
    font-size: 0.8rem;
    color: var(--text-muted);
    margin-top: 4px;
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
    padding: 12px 20px;
    border-bottom: 1px solid var(--border-color);
    background-color: #fafbfc;
  }

  .classes-table td {
    padding: 16px 20px;
    font-size: 0.9rem;
    border-bottom: 1px solid var(--border-color);
    vertical-align: middle;
  }

  .student-info { display: flex; flex-direction: column; }
  .student-info .name { font-weight: 700; color: var(--text-main); }
  
  .course-name { font-weight: 700; color: var(--text-main); }
  .course-level { font-size: 0.75rem; color: var(--text-muted); font-weight: 600; background-color: #edf2f7; padding: 2px 6px; border-radius: 4px; display: inline-block; margin-top: 4px;}
  
  .date-text { font-weight: 600; color: var(--text-muted); }

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
    justify-content: flex-end;
    gap: 8px;
    align-items: center;
  }

  .action-btn, .info-btn {
    width: 32px;
    height: 32px;
    border-radius: var(--radius-sm);
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid var(--border-color);
    background-color: transparent;
    color: var(--text-muted);
    cursor: pointer;
    transition: all 0.2s;
  }

  .action-btn:hover, .info-btn:hover { background-color: #f7fafc; color: var(--text-main); }
  .action-btn.red:hover { background-color: #fff5f5; color: #e53e3e; border-color: #feb2b2; }


  .empty-cell {
    text-align: center;
    color: var(--text-muted);
    padding: 40px !important;
    font-style: italic;
  }
</style>
