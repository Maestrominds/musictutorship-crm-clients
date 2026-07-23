<script lang="ts">
  import Icon from '$lib/Icon.svelte';
  import { onMount } from 'svelte';
  import { apiGet } from '$lib/api';

  let { dashboardData = null } = $props();

  let activeCourseName = $state('Classical Piano');
  let activeMentorName = $state('Assigned Mentor');
  let activeCourseProgress = $state(0);

  onMount(async () => {
    try {
      const courses = await apiGet<any[]>('/student/courses');
      if (courses && courses.length > 0) {
        activeCourseName = courses[0].course_title || 'Classical Piano';
        activeMentorName = courses[0].mentor_name || 'Assigned Mentor';
        activeCourseProgress = courses[0].progress_percent || 0;
      }
    } catch (err) {
      console.error('Failed to load student courses for dashboard:', err);
    }
  });

  const enrolledCourse = $derived(activeCourseName);

  const nextClassTime = $derived(
    dashboardData?.upcoming_classes?.[0]?.scheduled_at
      ? new Date(dashboardData.upcoming_classes[0].scheduled_at).toLocaleString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit'
        })
      : 'No upcoming classes scheduled'
  );

  const nextClassTitle = $derived(
    dashboardData?.upcoming_classes?.[0]?.title || 'Practice Session'
  );

  const nextClassLink = $derived(
    dashboardData?.upcoming_classes?.[0]?.gmeet_link || '#'
  );

  const mentorName = $derived(activeMentorName);

  const courseStats = $derived(dashboardData?.course_stats || {
    progress_percent: 0,
    completed_modules: 0,
    total_modules: 0,
    completed_assignments: 0,
    total_assignments: 0,
    practice_hours: 0,
    completed_exams: 0,
    total_exams: 0
  });

  const activities = $derived(dashboardData?.recent_activity || []);

  const dailyPractice = $derived(dashboardData?.daily_practice || {
    streak_days: 0,
    today_minutes: 0,
    goal_minutes: 60,
    week_history: [false, false, false, false, false, false, false]
  });
</script>

<div class="student-dash-view">
  <!-- Stats Row -->
  <section class="stats-row">
    <div class="stat-card">
      <div class="stat-icon pink-bg"><Icon name="piano" size={20} /></div>
      <div class="stat-info">
        <span class="label">ENROLLED COURSE</span>
        <div class="value">{enrolledCourse}</div>
      </div>
    </div>

    <div class="stat-card">
      <div class="stat-icon orange-bg"><Icon name="clock" size={20} /></div>
      <div class="stat-info">
        <span class="label">NEXT CLASS</span>
        <div class="value">{nextClassTime}</div>
      </div>
    </div>

    <div class="stat-card">
      <div class="stat-icon green-bg"><Icon name="trending-up" size={20} /></div>
      <div class="stat-info">
        <span class="label">COURSE PROGRESS</span>
        <div class="value">{activeCourseProgress}%</div>
      </div>
    </div>
  </section>

  <!-- Split Grid -->
  <section class="dash-grid">
    <!-- Left Column: Upcoming Class & Progress -->
    <div class="left-col">
      <div class="upcoming-class-card">
        <div class="card-header">
          <h3>Upcoming Class</h3>
          <span class="live-badge">Live Session</span>
        </div>

        <div class="class-content">
          <div class="class-info">
            <h2>{nextClassTitle}</h2>
            <p>Mastering the complex jazz and classical movements in modern compositions.</p>
            
            <div class="mentor-row">
              <div class="mentor-avatar"><Icon name="user" size={20} /></div>
              <div class="mentor-details">
                <span class="lbl">Mentor</span>
                <span class="name">{mentorName}</span>
              </div>
            </div>

            <div class="time-meta">
              <div class="meta-item"><Icon name="calendar" size={13} /> {nextClassTime}</div>
            </div>

            {#if nextClassLink !== '#'}
              <a href={nextClassLink} target="_blank" class="join-btn" style="text-decoration: none; display: inline-block;">Join Class Now</a>
            {:else}
              <button class="join-btn" onclick={() => alert('Class link is not ready yet.')}>Join Class Now</button>
            {/if}
          </div>

          <div class="class-image">
            <img src="https://images.unsplash.com/photo-1552422535-c45813c61732?auto=format&fit=crop&w=300&q=80" alt="Piano playing" />
          </div>
        </div>
      </div>


      <!-- Course Progress Summary -->
      <div class="overall-progress-card">
        <div class="progress-header">
          <h3>Overall Course Progress</h3>
          <span class="pct-complete">{courseStats.progress_percent}% Complete</span>
        </div>
        <div class="bar-bg">
          <div class="bar-fill" style="width: {courseStats.progress_percent}%"></div>
        </div>
        <div class="progress-details-grid">
          <div class="detail-box">
            <span class="lbl">Modules</span>
            <span class="val">{courseStats.completed_modules} / {courseStats.total_modules}</span>
          </div>
          <div class="detail-box">
            <span class="lbl">Assignments</span>
            <span class="val">{courseStats.completed_assignments} / {courseStats.total_assignments}</span>
          </div>
          <div class="detail-box">
            <span class="lbl">Practice Hours</span>
            <span class="val">{courseStats.practice_hours}h</span>
          </div>
          <div class="detail-box">
            <span class="lbl">Live Exams</span>
            <span class="val">{courseStats.completed_exams} / {courseStats.total_exams}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Right Column: Recent Activity & Daily Practice -->
    <div class="right-col">
      <!-- Recent Activity Card -->
      <div class="activity-card">
        <h3>Recent Activity</h3>
        <div class="activity-list">
          {#each activities as act}
            <div class="activity-item">
              <span class="act-icon">{act.icon}</span>
              <div class="act-text">
                <span class="type">{act.type}</span>
                <span class="detail">{act.detail}</span>
                <span class="time">{act.time}</span>
              </div>
            </div>
          {/each}
        </div>
        <button class="view-activity-btn">View All Activity</button>
      </div>

      <!-- Daily Practice Card -->
      <div class="daily-practice-card">
        <h4>Daily Practice</h4>
        {#if dailyPractice.streak_days > 0}
          <p>You've reached your practice goal for {dailyPractice.streak_days} days in a row!</p>
        {:else}
          <p>Start practicing today to build your streak!</p>
        {/if}
        <div class="dots-row">
          {#each dailyPractice.week_history as isActive}
            <span class="dot" class:active={isActive}></span>
          {/each}
        </div>
        <button class="practice-btn">Start Practice</button>
      </div>
    </div>
  </section>
</div>

<style>
  .student-dash-view {
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
    padding: 20px;
    display: flex;
    align-items: center;
    gap: 16px;
    box-shadow: var(--shadow-sm);
  }

  .stat-icon {
    width: 44px;
    height: 44px;
    border-radius: var(--radius-sm);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.2rem;
  }

  .stat-icon.pink-bg { background-color: #fff5f5; color: #e53e3e; }
  .stat-icon.orange-bg { background-color: #fffaf0; color: #dd6b20; }
  .stat-icon.green-bg { background-color: #f0fff4; color: #38a169; }

  .stat-info {
    display: flex;
    flex-direction: column;
  }

  .stat-info .label {
    font-size: 0.7rem;
    font-weight: 700;
    color: var(--text-muted);
    letter-spacing: 0.5px;
  }

  .stat-info .value {
    font-size: 1.2rem;
    font-weight: 700;
    color: var(--text-main);
  }

  /* Split Grid */
  .dash-grid {
    display: grid;
    grid-template-columns: 2.2fr 1.1fr;
    gap: 24px;
  }

  .left-col {
    display: flex;
    flex-direction: column;
    gap: 24px;
  }

  .upcoming-class-card {
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
    font-size: 0.95rem;
    color: var(--text-muted);
    font-weight: 600;
  }

  .live-badge {
    background-color: #fff5f5;
    color: #e53e3e;
    font-size: 0.7rem;
    font-weight: 700;
    padding: 3px 8px;
    border-radius: var(--radius-sm);
  }

  .class-content {
    display: grid;
    grid-template-columns: 1.2fr 1fr;
    gap: 20px;
  }

  .class-info h2 {
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--text-main);
    letter-spacing: -0.5px;
    line-height: 1.2;
    margin-bottom: 8px;
  }

  .class-info p {
    color: var(--text-muted);
    font-size: 0.85rem;
    line-height: 1.4;
    margin-bottom: 16px;
  }

  .mentor-row {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 16px;
  }

  .mentor-avatar {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background-color: #edf2f7;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.75rem;
  }

  .mentor-details {
    display: flex;
    flex-direction: column;
  }

  .mentor-details .lbl {
    font-size: 0.6rem;
    color: var(--text-muted);
    font-weight: 700;
  }

  .mentor-details .name {
    font-size: 0.8rem;
    font-weight: 700;
    color: var(--text-main);
  }

  .time-meta {
    display: flex;
    gap: 16px;
    font-size: 0.8rem;
    font-weight: 600;
    color: var(--text-muted);
    margin-bottom: 20px;
  }

  .join-btn {
    background-color: var(--primary);
    color: white;
    border: none;
    border-radius: var(--radius-md);
    padding: 10px 20px;
    font-weight: 600;
    cursor: pointer;
    font-size: 0.85rem;
    box-shadow: 0 4px 10px rgba(229, 62, 62, 0.2);
  }

  .class-image img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: var(--radius-md);
  }

  /* Overall Course Progress */
  .overall-progress-card {
    background-color: var(--bg-card);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-md);
    padding: 24px;
    box-shadow: var(--shadow-sm);
  }

  .progress-header {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    margin-bottom: 12px;
  }

  .progress-header h3 {
    font-size: 0.95rem;
    font-weight: 700;
    color: var(--text-main);
  }

  .pct-complete {
    font-size: 0.85rem;
    font-weight: 700;
    color: var(--primary);
  }

  .overall-progress-card .bar-bg {
    height: 10px;
    background-color: #edf2f7;
    border-radius: var(--radius-full);
    margin-bottom: 20px;
    overflow: hidden;
  }

  .overall-progress-card .bar-fill {
    height: 100%;
    background-color: var(--primary);
  }

  .progress-details-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 12px;
  }

  .detail-box {
    background-color: #f8fafc;
    border-radius: var(--radius-md);
    padding: 12px;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .detail-box .lbl {
    font-size: 0.65rem;
    color: var(--text-muted);
    font-weight: 700;
    margin-bottom: 4px;
  }

  .detail-box .val {
    font-size: 0.95rem;
    font-weight: 700;
    color: var(--text-main);
  }

  /* Right column */
  .right-col {
    display: flex;
    flex-direction: column;
    gap: 24px;
  }

  .activity-card, .daily-practice-card {
    background-color: var(--bg-card);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-md);
    padding: 20px;
    box-shadow: var(--shadow-sm);
  }

  .activity-card h3 {
    font-size: 0.95rem;
    font-weight: 700;
    color: var(--text-main);
    margin-bottom: 16px;
  }

  .activity-list {
    display: flex;
    flex-direction: column;
    gap: 16px;
    margin-bottom: 16px;
  }

  .activity-item {
    display: flex;
    gap: 10px;
  }

  .act-text {
    display: flex;
    flex-direction: column;
  }

  .act-text .type {
    font-size: 0.65rem;
    font-weight: 700;
    color: var(--text-muted);
  }

  .act-text .detail {
    font-size: 0.8rem;
    font-weight: 700;
    color: var(--primary);
  }

  .act-text .time {
    font-size: 0.7rem;
    color: var(--text-muted);
  }

  .view-activity-btn {
    width: 100%;
    padding: 8px;
    border: 1px solid var(--border-color);
    background: transparent;
    border-radius: var(--radius-sm);
    font-size: 0.8rem;
    font-weight: 700;
    color: var(--text-main);
    cursor: pointer;
  }

  /* Daily Practice Card styling */
  .daily-practice-card {
    background-color: var(--primary);
    color: white;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 8px;
  }

  .daily-practice-card h4 {
    font-size: 0.95rem;
    font-weight: 700;
  }

  .daily-practice-card p {
    font-size: 0.75rem;
    opacity: 0.95;
    line-height: 1.3;
  }

  .dots-row {
    display: flex;
    gap: 4px;
    margin: 8px 0;
  }

  .dots-row .dot {
    width: 6px;
    height: 6px;
    background-color: rgba(255, 255, 255, 0.4);
    border-radius: 50%;
  }

  .dots-row .dot.active {
    background-color: white;
  }

  .practice-btn {
    width: 100%;
    background-color: white;
    color: var(--primary);
    font-weight: 700;
    padding: 8px;
    border: none;
    border-radius: var(--radius-sm);
    cursor: pointer;
    font-size: 0.8rem;
    box-shadow: 0 4px 10px rgba(0,0,0,0.1);
  }

  @media (max-width: 1024px) {
    .stats-row { grid-template-columns: 1fr; }
    .dash-grid { grid-template-columns: 1fr; }
    .class-content { grid-template-columns: 1fr; }
  }
</style>
