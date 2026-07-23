<script lang="ts">
  import Icon from '$lib/Icon.svelte';
  import { onMount } from 'svelte';
  import { apiGet } from '$lib/api';
  import SkeletonLoader from '$lib/SkeletonLoader.svelte';

  let activeTab = $state<'In Progress' | 'Completed' | 'Saved'>('In Progress');

  interface StudentCourse {
    id: number;
    title: string;
    mentor: string;
    progress: number;
    totalLessons: number;
    completedLessons: number;
  }

  let inProgressCourses = $state<StudentCourse[]>([]);
  let upcomingSessions = $state<{ id: number; title: string; instructor: string; date: string; time: string; isActionable: boolean }[]>([]);
  let dailyGoal = $state({ minutes: 0, target: 60, progress_pct: 0 });
  let isLoading = $state(true);

  // GET /api/student/courses returns GetStudentCoursesListRow { id, course_title, mentor_name, progress_percent, total_lessons, completed_lessons }
  onMount(async () => {
    try {
      const [coursesData, dashboardData] = await Promise.all([
        apiGet<any[]>('/student/courses').catch(() => []),
        apiGet<any>('/student/dashboard').catch(() => null)
      ]);
      
      inProgressCourses = (coursesData || []).map(c => ({
        id: c.id,
        title: c.course_title,
        mentor: c.mentor_name || 'Assigned Mentor',
        progress: c.progress_percent || 0,
        totalLessons: c.total_lessons || 0,
        completedLessons: c.completed_lessons || 0
      }));
      
      if (dashboardData) {
        upcomingSessions = (dashboardData.upcoming_classes || []).map((c: any) => ({
          id: c.id,
          title: c.title || 'Music Session',
          instructor: c.mentor_name || 'Assigned Mentor',
          date: c.scheduled_at ? new Date(c.scheduled_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short' }) : 'TBD',
          time: c.scheduled_at ? new Date(c.scheduled_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : 'TBD',
          isActionable: !!c.gmeet_link
        }));
        
        if (dashboardData.daily_practice) {
          const pct = Math.min(100, Math.round((dashboardData.daily_practice.today_minutes / dashboardData.daily_practice.goal_minutes) * 100)) || 0;
          dailyGoal = {
            minutes: dashboardData.daily_practice.today_minutes || 0,
            target: dashboardData.daily_practice.goal_minutes || 60,
            progress_pct: pct
          };
        }
      }
    } catch {
      inProgressCourses = []; // Not yet available — show empty state
    } finally {
      isLoading = false;
    }
  });
</script>

<div class="student-courses-view">
  {#if isLoading}
    <SkeletonLoader type="cards" rows={4} />
  {:else}
  <div class="header-row">
    <div class="header-text">
      <h2>My Courses</h2>
      <p>Pick up where you left off and master your craft.</p>
    </div>
    <div class="header-actions">
      <button class="filter-btn">Filter</button>
      <button class="explore-btn">+ Explore More</button>
    </div>
  </div>

  <!-- Tabs Navigation -->
  <div class="tabs-row">
    <button class="tab-btn" class:active={activeTab === 'In Progress'} onclick={() => activeTab = 'In Progress'}>In Progress ({inProgressCourses.length})</button>
    <button class="tab-btn" class:active={activeTab === 'Completed'} onclick={() => activeTab = 'Completed'}>Completed</button>
    <button class="tab-btn" class:active={activeTab === 'Saved'} onclick={() => activeTab = 'Saved'}>Saved for Later</button>
  </div>

  <!-- In Progress Courses Grid -->
  {#if activeTab === 'In Progress'}
    {#if isLoading}
      <div style="text-align:center;padding:40px;color:#999;">Loading your courses...</div>
    {:else if inProgressCourses.length === 0}
      <div style="text-align:center;padding:40px;color:#999;font-size:0.9rem;">No courses enrolled yet. Please contact your admin to get enrolled in a course.</div>
    {:else}
    <div class="courses-grid">
      {#each inProgressCourses as course}
        <div class="course-card">
          <div class="card-image-placeholder">
            <span class="tag">MUSIC</span>
          </div>
          <div class="card-body">
            <h3>{course.title}</h3>
            <span class="mentor-label"><Icon name="user" size={13} /> Mentor: {course.mentor}</span>
            
            <div class="progress-section">
              <div class="bar-bg">
                <div class="bar-fill" style="width: {course.progress}%"></div>
              </div>
              <div class="meta-row">
                <span class="pct">{course.progress}% Complete</span>
                <span class="lessons">{course.completedLessons}/{course.totalLessons} Lessons</span>
              </div>
            </div>

            <button class="continue-btn">Continue Learning →</button>
          </div>
        </div>
      {/each}
    </div>
    {/if}
  {:else}
    <div class="empty-state">
      <p>No courses in this category currently.</p>
    </div>
  {/if}

  <!-- Bottom Section: Sessions & Goals -->
  <div class="bottom-grid">
    <!-- Upcoming Live Sessions -->
    <div class="sessions-card">
      <h3>Upcoming Live Sessions</h3>
      <div class="sessions-list">
        {#if upcomingSessions.length === 0}
          <div style="padding: 20px 0; color: #999; font-size: 0.9rem;">No upcoming live sessions.</div>
        {/if}
        {#each upcomingSessions as session}
          <div class="session-row">
            <div class="date-badge">
              <span class="day">{session.date.split(' ')[1] || '-'}</span>
              <span class="month">{session.date.split(' ')[0] || '-'}</span>
            </div>
            <div class="session-info">
              <h4>{session.title}</h4>
              <span class="instructor">with {session.instructor} • {session.time}</span>
            </div>
            {#if session.isActionable}
              <button class="join-session-btn">Join Class</button>
            {:else}
              <button class="remind-session-btn">Reminder</button>
            {/if}
          </div>
        {/each}
      </div>
    </div>

    <!-- Daily Goal Card -->
    <div class="goal-card">
      <div class="card-header">
        <h3>Daily Goal</h3>
        <span class="goal-value">{dailyGoal.minutes} <span class="muted">/ {dailyGoal.target} mins</span></span>
      </div>
      <div class="bar-bg">
        <div class="bar-fill" style="width: {dailyGoal.progress_pct}%"></div>
      </div>
      <p class="goal-message">
        {#if dailyGoal.progress_pct >= 100}
          "Goal achieved! Amazing work today."
        {:else}
          "Practice makes progress. You're almost at your goal for today!"
        {/if}
      </p>
    </div>
  </div>
  {/if}
</div>

<style>
  .student-courses-view {
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

  .header-actions {
    display: flex;
    gap: 12px;
  }

  .filter-btn {
    border: 1px solid var(--border-color);
    background-color: var(--bg-card);
    color: var(--text-main);
    font-weight: 600;
    padding: 10px 18px;
    border-radius: var(--radius-md);
    cursor: pointer;
  }

  .explore-btn {
    background-color: var(--primary);
    color: white;
    border: none;
    border-radius: var(--radius-md);
    padding: 10px 18px;
    font-weight: 600;
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(229, 62, 62, 0.2);
  }

  /* Tabs Navigation */
  .tabs-row {
    display: flex;
    gap: 12px;
    border-bottom: 2px solid var(--border-color);
    padding-bottom: 8px;
  }

  .tab-btn {
    border: none;
    background: transparent;
    font-size: 0.9rem;
    font-weight: 700;
    color: var(--text-muted);
    cursor: pointer;
    padding: 6px 12px;
    border-bottom: 2px solid transparent;
    margin-bottom: -10px;
    transition: all 0.2s;
  }

  .tab-btn.active {
    color: var(--primary);
    border-bottom-color: var(--primary);
  }

  /* Courses grid */
  .courses-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    gap: 20px;
  }

  .course-card {
    background-color: var(--bg-card);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-md);
    overflow: hidden;
    box-shadow: var(--shadow-sm);
    display: flex;
    flex-direction: column;
  }

  .card-image-placeholder {
    height: 120px;
    background: linear-gradient(135deg, #1a202c, #4a5568);
    position: relative;
  }

  .card-image-placeholder .tag {
    position: absolute;
    top: 12px;
    left: 12px;
    background-color: var(--primary-light);
    color: var(--primary);
    font-size: 0.65rem;
    font-weight: 700;
    padding: 3px 8px;
    border-radius: var(--radius-sm);
  }

  .card-body {
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .card-body h3 {
    font-size: 1rem;
    font-weight: 700;
    color: var(--text-main);
  }

  .mentor-label {
    font-size: 0.8rem;
    color: var(--text-muted);
    font-weight: 500;
  }

  .progress-section {
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin: 8px 0;
  }

  .progress-section .bar-bg {
    height: 6px;
    background-color: #edf2f7;
    border-radius: var(--radius-full);
  }

  .progress-section .bar-fill {
    height: 100%;
    background-color: var(--primary);
  }

  .meta-row {
    display: flex;
    justify-content: space-between;
    font-size: 0.75rem;
    font-weight: 700;
    color: var(--text-muted);
  }

  .continue-btn {
    width: 100%;
    background-color: var(--primary);
    color: white;
    border: none;
    border-radius: var(--radius-sm);
    padding: 10px;
    font-weight: 600;
    font-size: 0.85rem;
    cursor: pointer;
    box-shadow: 0 4px 10px rgba(229, 62, 62, 0.2);
  }

  .empty-state {
    padding: 40px;
    text-align: center;
    background-color: var(--bg-card);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-md);
    color: var(--text-muted);
  }

  /* Bottom layout */
  .bottom-grid {
    display: grid;
    grid-template-columns: 2fr 1.1fr;
    gap: 24px;
  }

  .sessions-card, .goal-card {
    background-color: var(--bg-card);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-md);
    padding: 24px;
    box-shadow: var(--shadow-sm);
  }

  .sessions-card h3, .goal-card h3 {
    font-size: 0.95rem;
    font-weight: 700;
    color: var(--text-main);
    margin-bottom: 20px;
  }

  .sessions-list {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .session-row {
    display: flex;
    align-items: center;
    gap: 16px;
    padding-bottom: 16px;
    border-bottom: 1px solid var(--border-color);
  }

  .session-row:last-child {
    border-bottom: none;
    padding-bottom: 0;
  }

  .date-badge {
    background-color: #f7fafc;
    border-radius: var(--radius-sm);
    width: 44px;
    height: 44px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    flex-shrink: 0;
    border: 1px solid var(--border-color);
  }

  .date-badge .day { font-size: 1.05rem; color: var(--text-main); line-height: 1; }
  .date-badge .month { font-size: 0.6rem; color: var(--text-muted); }

  .session-info {
    display: flex;
    flex-direction: column;
    flex-grow: 1;
  }

  .session-info h4 {
    font-size: 0.85rem;
    font-weight: 700;
    color: var(--text-main);
  }

  .session-info .instructor {
    font-size: 0.75rem;
    color: var(--text-muted);
  }

  .join-session-btn {
    background-color: #fff5f5;
    color: #e53e3e;
    border: 1px solid #fed7d7;
    padding: 6px 14px;
    font-weight: 700;
    font-size: 0.8rem;
    border-radius: var(--radius-sm);
    cursor: pointer;
  }

  .remind-session-btn {
    background-color: #edf2f7;
    color: #4a5568;
    border: none;
    padding: 6px 14px;
    font-weight: 600;
    font-size: 0.8rem;
    border-radius: var(--radius-sm);
    cursor: pointer;
  }

  /* Goal card details */
  .goal-card {
    display: flex;
    flex-direction: column;
  }

  .goal-card .card-header {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    margin-bottom: 12px;
  }

  .goal-value {
    font-size: 1.25rem;
    font-weight: 700;
    color: var(--text-main);
  }

  .goal-value .muted {
    font-size: 0.8rem;
    color: var(--text-muted);
  }

  .goal-card .bar-bg {
    height: 8px;
    background-color: #edf2f7;
    border-radius: var(--radius-full);
    margin-bottom: 12px;
    overflow: hidden;
  }

  .goal-card .bar-fill {
    height: 100%;
    background-color: var(--primary);
  }

  .goal-message {
    font-size: 0.8rem;
    color: var(--text-muted);
    font-style: italic;
    line-height: 1.4;
  }

  @media (max-width: 768px) {
    .bottom-grid { grid-template-columns: 1fr; }
  }
</style>
