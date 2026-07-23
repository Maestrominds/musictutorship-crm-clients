<script lang="ts">
  import Icon from '$lib/Icon.svelte';

  let { dashboardData = null } = $props();

  const upcomingClasses = $derived(
    (dashboardData?.upcoming_classes || []).map((c: any) => ({
      id: c.id,
      name: c.title || 'Music Session',
      mentor: c.mentor_name || 'Assigned Mentor',
      dateTime: c.scheduled_at ? new Date(c.scheduled_at).toLocaleString() : 'Scheduled',
      status: c.gmeet_link ? 'Starts Soon' : 'Scheduled',
      statusClass: c.gmeet_link ? 'starts-soon' : 'scheduled',
      isJoinable: !!c.gmeet_link,
      gmeet_link: c.gmeet_link,
      course_assignment_id: c.course_assignment_id
    }))
  );

  import { onMount } from 'svelte';
  import { apiGet, apiPost } from '$lib/api';

  let pastClasses = $state<{ title: string; focus: string; mentor: string; date: string }[]>([]);

  onMount(async () => {
    try {
      const data = await apiGet<any[]>('/student/past-classes');
      pastClasses = (data || []).map(c => ({
        title: c.title || 'Music Session',
        focus: 'Completed Class',
        mentor: c.mentor_name || 'Assigned Mentor',
        date: c.scheduled_at ? new Date(c.scheduled_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'
      }));
    } catch (err) {
      console.error('Failed to load past classes:', err);
    }
  });

  // Catchup Booking State
  let showCatchupModal = $state(false);
  let isFetchingAvail = $state(false);
  let mentorAvails = $state<any[]>([]);
  let selectedAvail = $state('');
  let catchupCourseId = $state<number | ''>('');
  let isBooking = $state(false);
  let catchupStatus = $state('');

  async function openCatchupModal() {
    showCatchupModal = true;
    catchupStatus = '';
    selectedAvail = '';
    catchupCourseId = upcomingClasses.length > 0 ? upcomingClasses[0].course_assignment_id || '' : '';
    
    isFetchingAvail = true;
    try {
      const data = await apiGet<any[]>('/student/mentor/availability');
      mentorAvails = data || [];
    } catch (err: any) {
      catchupStatus = err.message || 'Failed to load availability';
    } finally {
      isFetchingAvail = false;
    }
  }

  function closeCatchupModal() {
    showCatchupModal = false;
  }

  async function handleBookCatchup(e: SubmitEvent) {
    e.preventDefault();
    if (!catchupCourseId || !selectedAvail) {
      catchupStatus = 'Please select a course and a time slot.';
      return;
    }
    isBooking = true;
    catchupStatus = '';
    try {
      await apiPost('/student/catchup', {
        course_assignment_id: Number(catchupCourseId),
        scheduled_at: selectedAvail
      });
      catchupStatus = 'Catch-up session booked successfully!';
      setTimeout(() => {
        if (showCatchupModal) closeCatchupModal();
      }, 1500);
    } catch (err: any) {
      catchupStatus = err.message || 'Failed to book catch-up';
    } finally {
      isBooking = false;
    }
  }
</script>



<div class="student-schedule-view">
  <div class="header-row">
    <div class="header-text">
      <h2>Class Schedule</h2>
      <p>Manage your upcoming music lessons and view past recordings.</p>
    </div>
    <button class="reschedule-btn" onclick={openCatchupModal}>Request Rescheduling</button>
  </div>

  <!-- Upcoming Classes -->
  <div class="table-card">
    <div class="table-card-header">
      <div class="title-row">
        <h3><Icon name="calendar" size={16} /> Upcoming Classes</h3>
        <span class="count-badge">{upcomingClasses.length} sessions this week</span>
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

  <!-- Catchup Modal -->
  {#if showCatchupModal}
    <div class="modal-overlay" onclick={closeCatchupModal} aria-hidden="true">
      <div class="modal-content" onclick={e => e.stopPropagation()} role="dialog">
        <div class="modal-header">
          <h3>Request Catch-up Session</h3>
          <button class="close-btn" onclick={closeCatchupModal}>&times;</button>
        </div>
        <form class="modal-form" onsubmit={handleBookCatchup} style="margin-top: 15px;">
          <div class="form-group" style="margin-bottom: 15px;">
            <label for="course-select">Course Assignment</label>
            <select id="course-select" bind:value={catchupCourseId} required style="padding: 10px; width: 100%; border: 1px solid var(--border-color); border-radius: 6px;">
              {#if upcomingClasses.length === 0}
                <option value="" disabled>No upcoming classes found</option>
              {/if}
              {#each upcomingClasses as c}
                {#if c.course_assignment_id}
                  <option value={c.course_assignment_id}>{c.name}</option>
                {/if}
              {/each}
            </select>
          </div>

          <div class="form-group" style="margin-bottom: 20px;">
            <label for="slot-select">Available Mentor Slots</label>
            {#if isFetchingAvail}
              <div style="padding: 10px; color: var(--text-muted); font-size: 0.9rem;">Loading slots...</div>
            {:else if mentorAvails.length === 0}
              <div style="padding: 10px; color: #e53e3e; font-size: 0.9rem;">No availability found for your mentor.</div>
            {:else}
              <select id="slot-select" bind:value={selectedAvail} required style="padding: 10px; width: 100%; border: 1px solid var(--border-color); border-radius: 6px;">
                <option value="" disabled>Select a time</option>
                {#each mentorAvails as avail}
                  <option value={avail.start_time}>
                    {new Date(avail.start_time).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })} - 
                    {new Date(avail.end_time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                  </option>
                {/each}
              </select>
            {/if}
          </div>

          {#if catchupStatus}
            <div style="margin-bottom: 15px; font-size: 0.9rem; color: {catchupStatus.includes('success') ? 'green' : '#e53e3e'}">
              {catchupStatus}
            </div>
          {/if}

          <div class="modal-actions" style="display: flex; justify-content: flex-end; gap: 12px;">
            <button type="button" class="cancel-btn" onclick={closeCatchupModal} style="padding: 10px 16px; border: 1px solid var(--border-color); background: white; border-radius: var(--radius-md); cursor: pointer;">Cancel</button>
            <button type="submit" class="save-btn" disabled={isBooking || isFetchingAvail || mentorAvails.length === 0} style="padding: 10px 16px; border: none; background: var(--primary); color: white; border-radius: var(--radius-md); font-weight: 600; cursor: pointer;">
              {isBooking ? 'Booking...' : 'Book Catch-up'}
            </button>
          </div>
        </form>
      </div>
    </div>
  {/if}
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
