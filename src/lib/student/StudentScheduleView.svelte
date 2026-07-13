<script lang="ts">
  import Icon from '$lib/Icon.svelte';

  let { dashboardData = null } = $props();

  const dbUpcoming = $derived(
    dashboardData?.upcoming_classes?.map((c: any) => ({
      id: c.id,
      name: c.title || 'Music Session',
      mentor: c.mentor_name || 'Assigned Mentor',
      dateTime: c.scheduled_at ? new Date(c.scheduled_at).toLocaleString() : 'Scheduled',
      status: c.gmeet_link ? 'Starts Soon' : 'Scheduled',
      statusClass: c.gmeet_link ? 'starts-soon' : 'scheduled',
      isJoinable: !!c.gmeet_link,
      gmeet_link: c.gmeet_link
    })) || []
  );

  const mockUpcoming = [
    { id: 1, name: 'Piano Mastery: Classical Era', mentor: 'Mr. Robert Chen', dateTime: 'Oct 24, 2023, 10:00 AM - 11:30 AM', status: 'Starts Soon', statusClass: 'starts-soon', isJoinable: true, gmeet_link: 'https://meet.google.com' },
    { id: 2, name: 'Jazz Improvisation', mentor: 'Sarah Jenkins', dateTime: 'Oct 25, 2023, 02:00 PM - 03:30 PM', status: 'Scheduled', statusClass: 'scheduled', isJoinable: false, gmeet_link: null }
  ];

  const upcomingClasses = $derived(dbUpcoming.length > 0 ? dbUpcoming : mockUpcoming);

  const pastClasses = [
    { title: 'Music Theory 101: Notation', focus: 'Sight reading & time signatures', mentor: 'Prof. Alan Turing', date: 'Oct 20, 2023' },
    { title: 'Vocal Warmups & Hygiene', focus: 'Range extension techniques', mentor: 'Elena Albert', date: 'Oct 18, 2023' },
    { title: 'Introduction to DAWs', focus: 'Ableton Live basics', mentor: 'Marcus Vane', date: 'Oct 15, 2023' }
  ];
</script>


<div class="student-schedule-view">
  <div class="header-row">
    <div class="header-text">
      <h2>Class Schedule</h2>
      <p>Manage your upcoming music lessons and view past recordings.</p>
    </div>
    <button class="reschedule-btn">Request Rescheduling</button>
  </div>

  <!-- Upcoming Classes -->
  <div class="table-card">
    <div class="table-card-header">
      <div class="title-row">
        <h3><Icon name="calendar" size={16} /> Upcoming Classes</h3>
        <span class="count-badge">3 sessions this week</span>
      </div>
    </div>

    <table class="schedule-table">
      <thead>
        <tr>
          <th>COURSE NAME</th>
          <th>MENTOR</th>
          <th>DATE & TIME</th>
          <th>STATUS</th>
          <th>MEETING</th>
          <th>ACTION</th>
        </tr>
      </thead>
      <tbody>
        {#each upcomingClasses as item}
          <tr>
            <td class="course-cell">
              <span class="title">{item.name}</span>
              <span class="sub">Advanced Module</span>
            </td>
            <td class="mentor-cell">
              <div class="avatar-sm"><Icon name="user" size={16} /></div>
              <span class="name">{item.mentor}</span>
            </td>
            <td class="date-text">{item.dateTime}</td>
            <td>
              <span class="status-badge {item.statusClass}">{item.status}</span>
            </td>
            <td>
              {#if item.gmeet_link}
                <a href={item.gmeet_link} target="_blank" class="zoom-link" style="text-decoration: none;"><Icon name="activity" size={14} /> Google Meet</a>
              {:else}
                <span class="zoom-link" style="opacity: 0.5;"><Icon name="activity" size={14} /> TBD</span>
              {/if}
            </td>
            <td>
              {#if item.isJoinable && item.gmeet_link}
                <a href={item.gmeet_link} target="_blank" class="action-btn join" style="text-decoration: none; display: inline-block;">Join Class</a>
              {:else}
                <button class="action-btn disabled" disabled>Join Class</button>
              {/if}
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>

  <!-- Past Classes Section -->
  <div class="past-classes-section">
    <div class="section-header">
      <h3><Icon name="clock" size={16} /> Past Classes</h3>
      <button class="view-history-btn">View all history</button>
    </div>

    <div class="past-classes-grid">
      {#each pastClasses as past}
        <div class="past-class-card">
          <span class="completed-tag">COMPLETED</span>
          <h4 class="title">{past.title}</h4>
          <p class="focus">Focus: {past.focus}</p>
          <div class="mentor-footer">
            <span class="name"><Icon name="user" size={13} /> {past.mentor}</span>
            <span class="date">{past.date}</span>
          </div>
          <button class="recording-btn">▶ View Recording</button>
        </div>
      {/each}
    </div>
  </div>
</div>

<style>
  .student-schedule-view {
    display: flex;
    flex-direction: column;
    gap: 28px;
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

  .reschedule-btn {
    background-color: var(--primary);
    color: white;
    border: none;
    border-radius: var(--radius-md);
    padding: 10px 18px;
    font-weight: 600;
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(229, 62, 62, 0.2);
  }

  /* Table Card styling */
  .table-card {
    background-color: var(--bg-card);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-md);
    box-shadow: var(--shadow-sm);
    overflow: hidden;
  }

  .table-card-header {
    padding: 20px;
    border-bottom: 1px solid var(--border-color);
  }

  .title-row {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .title-row h3 {
    font-size: 0.95rem;
    font-weight: 700;
    color: var(--text-main);
  }

  .count-badge {
    color: #38a169;
    font-size: 0.75rem;
    font-weight: 700;
  }

  .schedule-table {
    width: 100%;
    border-collapse: collapse;
    text-align: left;
  }

  .schedule-table th {
    font-size: 0.75rem;
    font-weight: 700;
    color: var(--text-muted);
    padding: 14px 20px;
    border-bottom: 1px solid var(--border-color);
    background-color: #fafbfc;
  }

  .schedule-table td {
    padding: 16px 20px;
    font-size: 0.9rem;
    border-bottom: 1px solid var(--border-color);
    vertical-align: middle;
  }

  .course-cell {
    display: flex;
    flex-direction: column;
  }

  .course-cell .title {
    font-weight: 700;
    color: var(--text-main);
  }

  .course-cell .sub {
    font-size: 0.75rem;
    color: var(--text-muted);
  }

  .mentor-cell {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .avatar-sm {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background-color: #edf2f7;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.75rem;
  }

  .mentor-cell .name {
    font-weight: 700;
    color: var(--text-main);
  }

  .date-text {
    font-weight: 600;
    color: var(--text-main);
  }

  .status-badge {
    padding: 4px 10px;
    border-radius: var(--radius-full);
    font-size: 0.75rem;
    font-weight: 700;
    display: inline-block;
  }

  .status-badge.starts-soon { background-color: #c6f6d5; color: #22543d; }
  .status-badge.scheduled { background-color: #ebf8ff; color: #2b6cb0; }

  .zoom-link {
    color: var(--primary);
    font-weight: 700;
  }

  .action-btn {
    border: none;
    padding: 6px 14px;
    font-weight: 700;
    font-size: 0.8rem;
    border-radius: var(--radius-sm);
    cursor: pointer;
  }

  .action-btn.join {
    background-color: var(--primary);
    color: white;
    box-shadow: 0 2px 6px rgba(229, 62, 62, 0.2);
  }

  .action-btn.disabled {
    background-color: #edf2f7;
    color: #a0aec0;
    cursor: not-allowed;
  }

  /* Past Classes section */
  .past-classes-section {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .section-header h3 {
    font-size: 0.95rem;
    font-weight: 700;
    color: var(--text-main);
  }

  .view-history-btn {
    border: none;
    background: transparent;
    color: var(--primary);
    font-weight: 700;
    font-size: 0.85rem;
    cursor: pointer;
  }

  .past-classes-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 20px;
  }

  .past-class-card {
    background-color: var(--bg-card);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-md);
    padding: 20px;
    box-shadow: var(--shadow-sm);
    display: flex;
    flex-direction: column;
    gap: 8px;
    position: relative;
  }

  .completed-tag {
    background-color: #edf2f7;
    color: #4a5568;
    font-size: 0.6rem;
    font-weight: 700;
    padding: 2px 6px;
    border-radius: var(--radius-sm);
    width: fit-content;
  }

  .past-class-card .title {
    font-size: 0.95rem;
    font-weight: 700;
    color: var(--text-main);
  }

  .past-class-card .focus {
    font-size: 0.75rem;
    color: var(--text-muted);
  }

  .mentor-footer {
    display: flex;
    justify-content: space-between;
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--text-muted);
    border-top: 1px solid var(--border-color);
    padding-top: 12px;
    margin-top: 4px;
  }

  .recording-btn {
    width: 100%;
    background-color: transparent;
    border: 1px solid var(--border-color);
    border-radius: var(--radius-sm);
    padding: 8px;
    font-weight: 700;
    color: var(--text-main);
    cursor: pointer;
    font-size: 0.8rem;
    transition: background 0.2s;
  }

  .recording-btn:hover {
    background-color: #f7fafc;
  }

  @media (max-width: 768px) {
    .past-classes-grid { grid-template-columns: 1fr; }
  }
</style>
