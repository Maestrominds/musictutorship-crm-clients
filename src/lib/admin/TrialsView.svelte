<script lang="ts">
  import Icon from '$lib/Icon.svelte';

  interface Trial {
    id: number;
    studentName: string;
    mentor: string;
    dateTime: string;
    meetingLink: string;
    status: 'Scheduled' | 'Completed' | 'Cancelled';
  }

  // Trials endpoint does not exist in the backend — this view shows an empty state.
  let trials = $state<Trial[]>([]);
  let activeTab = $state<'Upcoming' | 'Completed' | 'Cancelled'>('Upcoming');

  // Filtered schedules computation
  let filteredTrials = $derived(
    trials.filter(t => {
      if (activeTab === 'Upcoming') return t.status === 'Scheduled';
      return t.status === activeTab;
    })
  );

  const totalTrials = $derived(trials.length);
  const pendingTrials = $derived(trials.filter(t => t.status === 'Scheduled').length);

  function getInitials(name: string) {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 1);
  }
</script>

<div class="trials-view">
  <!-- Trials Page Header -->
  <div class="trials-header-row">
    <div class="header-text">
      <h2>Trial Classes</h2>
      <p>Manage and track introductory sessions for potential students.</p>
    </div>
    
    <!-- Navigation Tabs -->
    <div class="tabs-control">
      <button 
        class="tab-btn" 
        class:active={activeTab === 'Upcoming'} 
        onclick={() => activeTab = 'Upcoming'}
      >
        Upcoming
      </button>
      <button 
        class="tab-btn" 
        class:active={activeTab === 'Completed'} 
        onclick={() => activeTab = 'Completed'}
      >
        Completed
      </button>
      <button 
        class="tab-btn" 
        class:active={activeTab === 'Cancelled'} 
        onclick={() => activeTab = 'Cancelled'}
      >
        Cancelled
      </button>
    </div>
  </div>

  <!-- Top Stats Grid -->
  <div class="trials-stats-grid">
    <div class="trial-stat-card">
      <div class="stat-main">
        <div class="value">{totalTrials}</div>
        <span class="trend">↗ total scheduled</span>
      </div>
      <div class="label">Total Trials (This week)</div>
    </div>
    
    <div class="trial-stat-card">
      <div class="stat-main">
        <div class="value">{pendingTrials}</div>
        <span class="trend warning"><Icon name="info" size={12} /> Requires action</span>
      </div>
      <div class="label">Pending Trials</div>
    </div>

    <div class="trial-stat-card">
      <div class="stat-main">
        <div class="value">N/A</div>
        <span class="trend">Requires conversion endpoint</span>
      </div>
      <div class="label">Conversion Rate</div>
    </div>

    <div class="trial-stat-card">
      <div class="stat-main">
        <div class="value">N/A</div>
        <span class="trend">Requires availability endpoint</span>
      </div>
      <div class="label">Available Mentors</div>
    </div>
  </div>

  <!-- Schedules Table Card -->
  <div class="table-card">
    <div class="table-card-header">
      <h3>Recent Schedules</h3>
      <div class="actions-group">
        <button class="icon-btn">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M4 6h16M6 12h12M10 18h4" />
          </svg>
        </button>
        <button class="icon-btn">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 5v14M5 12h14" />
          </svg>
        </button>
      </div>
    </div>

    <table class="trials-table">
      <thead>
        <tr>
          <th>STUDENT NAME</th>
          <th>MENTOR</th>
          <th>DATE & TIME</th>
          <th>MEETING LINK</th>
          <th>STATUS</th>
          <th>ACTIONS</th>
        </tr>
      </thead>
      <tbody>
        {#if filteredTrials.length === 0}
          <tr>
            <td colspan="6" class="empty-row">No trial sessions available. This feature is coming soon.</td>
          </tr>
        {:else}
          {#each filteredTrials as trial}
            <tr>
              <td class="student-cell">
                <div class="avatar-circle">{getInitials(trial.studentName)}</div>
                <span class="name-text">{trial.studentName}</span>
              </td>
              <td class="mentor-text">{trial.mentor}</td>
              <td class="date-text">{trial.dateTime}</td>
              <td>
                <a href={trial.meetingLink} class="zoom-link" target="_blank" rel="noreferrer">
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                    <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/>
                  </svg>
                  Join Zoom
                </a>
              </td>
              <td>
                <span class="status-badge status-scheduled">
                  {trial.status}
                </span>
              </td>
              <td>
                <div class="actions-row">
                  <button class="action-btn play" title="Start Lesson">▶</button>
                  <button class="action-btn cal" title="View Calendar"><Icon name="calendar" size={14} /></button>
                  <button class="action-btn check" title="Mark Done">✓</button>
                </div>
              </td>
            </tr>
          {/each}
        {/if}
      </tbody>
    </table>

    <div class="table-footer">
      <span class="results-count">Showing 1-{filteredTrials.length} of 24 results</span>
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
</div>

<style>
  .trials-view {
    display: flex;
    flex-direction: column;
    gap: 24px;
  }

  .trials-header-row {
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

  /* Tabs styling */
  .tabs-control {
    display: flex;
    background-color: #f1f4f9;
    padding: 4px;
    border-radius: var(--radius-md);
  }

  .tab-btn {
    border: none;
    background: transparent;
    padding: 8px 16px;
    font-size: 0.85rem;
    font-weight: 600;
    color: var(--text-muted);
    cursor: pointer;
    border-radius: var(--radius-sm);
    transition: all 0.2s;
  }

  .tab-btn.active {
    background-color: var(--bg-card);
    color: var(--primary);
    box-shadow: var(--shadow-sm);
  }

  /* Stats Grid */
  .trials-stats-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 20px;
  }

  .trial-stat-card {
    background-color: var(--bg-card);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-md);
    padding: 20px;
    box-shadow: var(--shadow-sm);
  }

  .stat-main {
    display: flex;
    flex-direction: column;
    gap: 2px;
    margin-bottom: 8px;
  }

  .stat-main .value {
    font-size: 1.8rem;
    font-weight: 700;
    color: var(--text-main);
    line-height: 1.1;
  }

  .stat-main .trend {
    font-size: 0.75rem;
    font-weight: 700;
  }

  .stat-main .trend.positive { color: #38a169; }
  .stat-main .trend.warning { color: #dd6b20; }
  .stat-main .trend.neutral { color: #3182ce; }

  .trial-stat-card .label {
    font-size: 0.8rem;
    color: var(--text-muted);
    font-weight: 600;
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
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px;
    border-bottom: 1px solid var(--border-color);
  }

  .table-card-header h3 {
    font-size: 0.95rem;
    font-weight: 700;
    color: var(--text-main);
  }

  .actions-group {
    display: flex;
    gap: 8px;
  }

  .icon-btn {
    border: 1px solid var(--border-color);
    background: transparent;
    padding: 6px 10px;
    border-radius: var(--radius-sm);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--text-muted);
  }

  .trials-table {
    width: 100%;
    border-collapse: collapse;
    text-align: left;
  }

  .trials-table th {
    font-size: 0.75rem;
    font-weight: 700;
    color: var(--text-muted);
    padding: 14px 20px;
    border-bottom: 1px solid var(--border-color);
    background-color: #fafbfc;
  }

  .trials-table td {
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
    width: 34px;
    height: 34px;
    border-radius: 50%;
    background-color: #fed7d7;
    color: #c53030;
    font-weight: 700;
    font-size: 0.8rem;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .name-text {
    font-weight: 700;
    color: var(--text-main);
  }

  .mentor-text {
    font-weight: 600;
    color: var(--text-main);
  }

  .date-text {
    font-weight: 500;
    color: var(--text-muted);
  }

  .zoom-link {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    color: var(--primary);
    font-weight: 700;
    transition: color 0.2s;
  }

  .zoom-link:hover {
    color: var(--primary-hover);
  }

  .status-badge {
    padding: 4px 10px;
    border-radius: var(--radius-full);
    font-size: 0.75rem;
    font-weight: 700;
    display: inline-block;
  }

  .status-badge.status-scheduled {
    background-color: #ebf8ff;
    color: #2b6cb0;
  }

  .actions-row {
    display: flex;
    gap: 8px;
  }

  .action-btn {
    border: 1px solid var(--border-color);
    background-color: transparent;
    cursor: pointer;
    width: 28px;
    height: 28px;
    border-radius: var(--radius-sm);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.8rem;
    transition: all 0.2s;
  }

  .action-btn:hover {
    background-color: #edf2f7;
  }

  .action-btn.play { color: #38a169; }
  .action-btn.cal { color: #3182ce; }
  .action-btn.check { color: #e53e3e; }

  .empty-row {
    text-align: center;
    color: var(--text-muted);
    padding: 32px !important;
  }

  /* Footer styling */
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
    font-weight: 500;
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
    transition: all 0.2s;
  }

  .pag-btn:hover {
    background-color: #f7fafc;
    color: var(--text-main);
  }

  .pag-btn.active {
    background-color: var(--primary);
    color: white;
    border-color: var(--primary);
  }

  .pag-dots {
    color: var(--text-muted);
    font-size: 0.8rem;
    padding: 0 4px;
  }

  @media (max-width: 1024px) {
    .trials-stats-grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }
</style>
