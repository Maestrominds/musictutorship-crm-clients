<script lang="ts">
  import { goto } from '$app/navigation';
  import Icon from './Icon.svelte';
  import LeadsView from './admin/LeadsView.svelte';
  import TrialsView from './admin/TrialsView.svelte';
  import StudentsView from './admin/StudentsView.svelte';
  import CoursesView from './admin/CoursesView.svelte';
  import PaymentsView from './admin/PaymentsView.svelte';
  import MentorsView from './admin/MentorsView.svelte';

  let activeSubView = $state<'dashboard' | 'leads' | 'trials' | 'students' | 'courses' | 'payments' | 'mentors'>('dashboard');

  function handleLogout() {
    goto('/login');
  }

  // Sample data for list representation to show backend-ready format
  const recentLeads = [
    { name: 'Liam Johnson', course: 'Piano Advanced', date: 'Oct 24, 2023', status: 'In Review' },
    { name: 'Liam Johnson', course: 'Piano Advanced', date: 'Oct 24, 2023', status: 'In Review' },
    { name: 'Liam Johnson', course: 'Piano Advanced', date: 'Oct 24, 2023', status: 'In Review' }
  ];

  const upcomingClasses = [
    { date: 'OCT 25', name: 'Jazz Piano Improvisation', time: '02:00 PM - 03:30 PM', mentor: 'Mentor: Miles D.' },
    { date: 'OCT 26', name: 'Vocal Breathing Techniques', time: '10:00 AM - 11:30 AM', mentor: 'Mentor: Adele K.' },
    { date: 'OCT 28', name: 'Advanced Guitar Riffs', time: '04:00 PM - 05:30 PM', mentor: 'Mentor: Jimi H.' }
  ];

  const recentPayments = [
    { id: '#TRX-92910', student: 'Mark Wilson', amount: '$150.00', date: 'Oct 24, 2023', method: 'Credit Card', status: 'Completed' },
    { id: '#TRX-92911', student: 'Sarah Lee', amount: '$220.00', date: 'Oct 24, 2023', method: 'PayPal', status: 'Completed' },
    { id: '#TRX-92912', student: 'Daniel Brown', amount: '$110.00', date: 'Oct 23, 2023', method: 'Credit Card', status: 'Pending' }
  ];
</script>

<div class="dashboard-layout">
  <!-- Sidebar -->
  <aside class="sidebar">
    <div class="brand">
      <div class="logo-circle">
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="10" fill="white" />
          <path d="M9 17C7.9 17 7 16.1 7 15C7 13.9 7.9 13 9 13C10.1 13 11 13.9 11 15V9C11 8.45 11.45 8 12 8H16C16.55 8 17 8.45 17 9V11C17 11.55 16.55 12 16 12H13V15C13 16.1 12.1 17 11 17H9Z" fill="#e53e3e" />
        </svg>
      </div>
      <div class="brand-text">
        <span class="brand-name">MelodyFlow</span>
        <span class="brand-sub">Academy Management</span>
      </div>
    </div>

    <nav class="nav-menu">
      <button class="nav-item" class:active={activeSubView === 'dashboard'} onclick={() => activeSubView = 'dashboard'}>
        <span class="nav-icon"><Icon name="dashboard" size={16} /></span> Dashboard
      </button>
      <button class="nav-item" class:active={activeSubView === 'leads'} onclick={() => activeSubView = 'leads'}><span class="nav-icon"><Icon name="users" size={16} /></span> Leads</button>
      <button class="nav-item" class:active={activeSubView === 'trials'} onclick={() => activeSubView = 'trials'}><span class="nav-icon"><Icon name="calendar" size={16} /></span> Trials</button>
      <button class="nav-item" class:active={activeSubView === 'students'} onclick={() => activeSubView = 'students'}><span class="nav-icon"><Icon name="graduation" size={16} /></span> Students</button>
      <button class="nav-item" class:active={activeSubView === 'courses'} onclick={() => activeSubView = 'courses'}><span class="nav-icon"><Icon name="book" size={16} /></span> Courses</button>
      <button class="nav-item" class:active={activeSubView === 'payments'} onclick={() => activeSubView = 'payments'}><span class="nav-icon"><Icon name="credit-card" size={16} /></span> Payments</button>
      <button class="nav-item" class:active={activeSubView === 'mentors'} onclick={() => activeSubView = 'mentors'}><span class="nav-icon"><Icon name="music" size={16} /></span> Mentors</button>

      <div class="nav-section-title">ADVANCED</div>
      <button class="nav-item"><span class="nav-icon"><Icon name="activity" size={16} /></span> Automation</button>
      <button class="nav-item"><span class="nav-icon"><Icon name="chart" size={16} /></span> Analytics</button>
      <button class="nav-item"><span class="nav-icon"><Icon name="settings" size={16} /></span> Settings</button>
    </nav>

    <div class="sidebar-footer">
      <button onclick={handleLogout} class="logout-btn">
        <span class="logout-icon"><Icon name="log-out" size={16} /></span> Sign Out
      </button>
    </div>
  </aside>

  <!-- Main Content -->
  <main class="main-content">
    <!-- Header -->
    <header class="top-header">
      <div class="search-container">
        <span class="search-icon"><Icon name="search" size={16} /></span>
        <input type="text" placeholder="Search for students, courses, or payments..." />
      </div>
      
      <div class="user-profile">
        <button class="notification-btn">
          <Icon name="bell" size={18} />
          <span class="badge"></span>
        </button>
        <div class="profile-details">
          <span class="user-name">Admin User</span>
          <span class="user-role">Principal Manager</span>
        </div>
        <div class="avatar">
          <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80" alt="Avatar" />
        </div>
      </div>
    </header>

    <!-- Content Dashboard Scroll -->
    <div class="dashboard-scroll-area">
      {#if activeSubView === 'dashboard'}
        <!-- Stats Cards -->
        <section class="stats-grid">
          <div class="stat-card">
            <div class="stat-header">
              <span class="stat-icon-wrapper blue"><Icon name="chart" size={18} /></span>
              <span class="stat-trend positive">+12.5% ↗</span>
            </div>
            <div class="stat-value">1,284</div>
            <div class="stat-label">Total Leads</div>
          </div>

          <div class="stat-card">
            <div class="stat-header">
              <span class="stat-icon-wrapper purple"><Icon name="music" size={18} /></span>
              <span class="stat-trend positive">+5.2% ↗</span>
            </div>
            <div class="stat-value">456</div>
            <div class="stat-label">Active Students</div>
          </div>

          <div class="stat-card">
            <div class="stat-header">
              <span class="stat-icon-wrapper orange">⏳</span>
              <span class="stat-trend negative">-2.1% ↘</span>
            </div>
            <div class="stat-value">24</div>
            <div class="stat-label">Upcoming Trials</div>
          </div>

          <div class="stat-card">
            <div class="stat-header">
              <span class="stat-icon-wrapper green"><Icon name="dollar" size={18} /></span>
              <span class="stat-trend positive">+15.8% ↗</span>
            </div>
            <div class="stat-value">$12,500</div>
            <div class="stat-label">Monthly Revenue</div>
          </div>
        </section>

        <!-- Charts & Visual Section -->
        <section class="charts-grid">
          <!-- Leads vs Conversions Chart Placeholder -->
          <div class="chart-card">
            <div class="chart-header">
              <h3>Leads vs Conversions</h3>
              <span class="chart-period">Last 7 Months</span>
            </div>
            <div class="chart-placeholder">
              <!-- No hardcoded values for graph data per instructions -->
              <div class="empty-state">
                <span class="empty-icon"><Icon name="trending-up" size={22} /></span>
                <p>Conversions & lead metrics chart will connect to API data.</p>
              </div>
            </div>
          </div>

          <!-- Monthly Revenue Chart Placeholder -->
          <div class="chart-card">
            <div class="chart-header">
              <h3>Monthly Revenue Overview</h3>
              <span class="chart-options">•••</span>
            </div>
            <div class="chart-placeholder">
              <!-- No hardcoded values for graph data per instructions -->
              <div class="empty-state">
                <span class="empty-icon"><Icon name="dashboard" size={22} /></span>
                <p>Monthly revenue distribution chart will connect to API data.</p>
              </div>
            </div>
          </div>

          <!-- Course Enrollments Progress Placeholder -->
          <div class="chart-card">
            <div class="chart-header">
              <h3>Course Enrollments</h3>
            </div>
            <div class="chart-placeholder">
              <!-- No hardcoded/progress details -->
              <div class="empty-state">
                <span class="empty-icon"><Icon name="check-circle" size={22} /></span>
                <p>Interactive course share & active student details.</p>
              </div>
            </div>
          </div>
        </section>

        <!-- Lists & Details Section -->
        <section class="lists-grid">
          <!-- Recent Leads -->
          <div class="list-card recent-leads">
            <div class="list-header">
              <h3>Recent Leads</h3>
              <button class="view-all-btn">View All</button>
            </div>
            <table class="data-table">
              <thead>
                <tr>
                  <th>LEAD NAME</th>
                  <th>COURSE</th>
                  <th>DATE</th>
                  <th>STATUS</th>
                </tr>
              </thead>
              <tbody>
                {#each recentLeads as lead}
                  <tr>
                    <td class="user-cell">
                      <div class="avatar-sm"><Icon name="user" size={14} /></div>
                      <span>{lead.name}</span>
                    </td>
                    <td>{lead.course}</td>
                    <td>{lead.date}</td>
                    <td><span class="status-badge yellow">{lead.status}</span></td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>

          <!-- Upcoming Classes -->
          <div class="list-card upcoming-classes">
            <div class="list-header">
              <h3>Upcoming Classes</h3>
              <button class="view-all-btn">Calendar View</button>
            </div>
            <div class="classes-list">
              {#each upcomingClasses as item}
                <div class="class-item">
                  <div class="class-date-badge">
                    <span class="month">{item.date.split(' ')[0]}</span>
                    <span class="day">{item.date.split(' ')[1]}</span>
                  </div>
                  <div class="class-info">
                    <h4>{item.name}</h4>
                    <span class="class-time">{item.time}</span>
                    <span class="class-mentor">{item.mentor}</span>
                  </div>
                </div>
              {/each}
            </div>
          </div>
        </section>

        <!-- Recent Payments -->
        <section class="payments-section">
          <div class="list-card">
            <div class="list-header">
              <h3>Recent Payments</h3>
              <div class="table-actions">
                <button class="icon-btn" title="Search"><Icon name="search" size={14} /></button>
                <button class="icon-btn" title="Download"><Icon name="file" size={14} /></button>
              </div>
            </div>
            <table class="data-table">
              <thead>
                <tr>
                  <th>TRANSACTION ID</th>
                  <th>STUDENT</th>
                  <th>AMOUNT</th>
                  <th>DATE</th>
                  <th>METHOD</th>
                  <th>STATUS</th>
                </tr>
              </thead>
              <tbody>
                {#each recentPayments as pay}
                  <tr>
                    <td>{pay.id}</td>
                    <td class="user-cell">
                      <div class="avatar-sm initials">MW</div>
                      <span>{pay.student}</span>
                    </td>
                    <td class="amount-cell">{pay.amount}</td>
                    <td>{pay.date}</td>
                    <td>{pay.method}</td>
                    <td><span class="status-badge" class:green={pay.status === 'Completed'} class:orange={pay.status === 'Pending'}>{pay.status}</span></td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        </section>
      {:else if activeSubView === 'leads'}
        <LeadsView />
      {:else if activeSubView === 'trials'}
        <TrialsView />
      {:else if activeSubView === 'students'}
        <StudentsView />
      {:else if activeSubView === 'courses'}
        <CoursesView />
      {:else if activeSubView === 'payments'}
        <PaymentsView />
      {:else if activeSubView === 'mentors'}
        <MentorsView />
      {/if}
    </div>
  </main>
</div>

<style>
  .dashboard-layout {
    display: flex;
    min-height: 100vh;
    background-color: var(--bg-page);
  }

  /* Sidebar */
  .sidebar {
    width: 260px;
    background-color: var(--bg-card);
    border-right: 1px solid var(--border-color);
    display: flex;
    flex-direction: column;
    padding: 24px;
    flex-shrink: 0;
  }

  .brand {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 32px;
  }

  .logo-circle {
    background-color: var(--primary);
    width: 36px;
    height: 36px;
    border-radius: var(--radius-sm);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .brand-text {
    display: flex;
    flex-direction: column;
  }

  .brand-name {
    font-size: 0.95rem;
    font-weight: 700;
    color: var(--text-main);
  }

  .brand-sub {
    font-size: 0.7rem;
    font-weight: 500;
    color: var(--text-muted);
  }

  .nav-menu {
    display: flex;
    flex-direction: column;
    gap: 4px;
    flex-grow: 1;
  }

  .nav-section-title {
    font-size: 0.7rem;
    font-weight: 700;
    color: var(--text-muted);
    letter-spacing: 1px;
    margin: 20px 0 8px 12px;
  }

  .nav-item {
    display: flex;
    align-items: center;
    gap: 12px;
    width: 100%;
    padding: 10px 14px;
    border: none;
    background: transparent;
    border-radius: var(--radius-sm);
    font-size: 0.9rem;
    font-weight: 600;
    color: var(--text-muted);
    cursor: pointer;
    text-align: left;
    transition: all 0.2s;
  }

  .nav-item:hover {
    background-color: #f7fafc;
    color: var(--text-main);
  }

  .nav-item.active {
    background-color: var(--primary);
    color: white;
  }

  .sidebar-footer {
    padding-top: 16px;
    border-top: 1px solid var(--border-color);
  }

  .logout-btn {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
    padding: 10px 14px;
    border: none;
    background: transparent;
    color: #e53e3e;
    font-weight: 600;
    cursor: pointer;
    text-align: left;
    border-radius: var(--radius-sm);
    transition: background 0.2s;
  }

  .logout-btn:hover {
    background-color: #fff5f5;
  }

  /* Main Content Area */
  .main-content {
    flex-grow: 1;
    display: flex;
    flex-direction: column;
    height: 100vh;
    overflow: hidden;
  }

  .top-header {
    height: 70px;
    background-color: var(--bg-card);
    border-bottom: 1px solid var(--border-color);
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 32px;
    flex-shrink: 0;
  }

  .search-container {
    display: flex;
    align-items: center;
    gap: 10px;
    background-color: #f3f6fb;
    padding: 8px 16px;
    border-radius: var(--radius-full);
    width: 320px;
  }

  .search-container input {
    border: none;
    background: transparent;
    outline: none;
    font-size: 0.85rem;
    width: 100%;
    color: var(--text-main);
  }

  .user-profile {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .notification-btn {
    border: none;
    background: transparent;
    font-size: 1.2rem;
    cursor: pointer;
    position: relative;
  }

  .notification-btn .badge {
    position: absolute;
    top: 0;
    right: 0;
    width: 8px;
    height: 8px;
    background-color: var(--primary);
    border-radius: 50%;
  }

  .profile-details {
    display: flex;
    flex-direction: column;
    text-align: right;
  }

  .user-name {
    font-size: 0.9rem;
    font-weight: 700;
    color: var(--text-main);
  }

  .user-role {
    font-size: 0.75rem;
    color: var(--text-muted);
  }

  .avatar img {
    width: 38px;
    height: 38px;
    border-radius: 50%;
    object-fit: cover;
  }

  /* Scroll Area */
  .dashboard-scroll-area {
    flex-grow: 1;
    overflow-y: auto;
    padding: 32px;
    display: flex;
    flex-direction: column;
    gap: 28px;
  }

  /* Stats Grid */
  .stats-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 20px;
  }

  .stat-card {
    background-color: var(--bg-card);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-md);
    padding: 20px;
    box-shadow: var(--shadow-sm);
  }

  .stat-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
  }

  .stat-icon-wrapper {
    width: 36px;
    height: 36px;
    border-radius: var(--radius-sm);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.1rem;
  }

  .stat-icon-wrapper.blue { background-color: #ebf8ff; color: #3182ce; }
  .stat-icon-wrapper.purple { background-color: #faf5ff; color: #805ad5; }
  .stat-icon-wrapper.orange { background-color: #fffaf0; color: #dd6b20; }
  .stat-icon-wrapper.green { background-color: #f0fff4; color: #38a169; }

  .stat-trend {
    font-size: 0.8rem;
    font-weight: 700;
    padding: 2px 6px;
    border-radius: var(--radius-full);
  }

  .stat-trend.positive { background-color: #f0fff4; color: #38a169; }
  .stat-trend.negative { background-color: #fff5f5; color: #e53e3e; }

  .stat-value {
    font-size: 1.75rem;
    font-weight: 700;
    color: var(--text-main);
    line-height: 1.2;
    margin-bottom: 4px;
  }

  .stat-label {
    font-size: 0.85rem;
    color: var(--text-muted);
    font-weight: 500;
  }

  /* Charts Grid */
  .charts-grid {
    display: grid;
    grid-template-columns: 1.5fr 1fr 1fr;
    gap: 20px;
  }

  .chart-card {
    background-color: var(--bg-card);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-md);
    padding: 20px;
    box-shadow: var(--shadow-sm);
    display: flex;
    flex-direction: column;
  }

  .chart-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
  }

  .chart-header h3 {
    font-size: 0.95rem;
    font-weight: 700;
    color: var(--text-main);
  }

  .chart-period {
    font-size: 0.8rem;
    color: var(--text-muted);
    border: 1px solid var(--border-color);
    padding: 4px 10px;
    border-radius: var(--radius-sm);
  }

  .chart-placeholder {
    flex-grow: 1;
    min-height: 160px;
    border: 1.5px dashed var(--border-color);
    border-radius: var(--radius-sm);
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #fafbfc;
  }

  .empty-state {
    text-align: center;
    padding: 16px;
    color: var(--text-muted);
  }

  .empty-icon {
    font-size: 1.75rem;
    display: block;
    margin-bottom: 8px;
  }

  .empty-state p {
    font-size: 0.8rem;
    font-weight: 500;
    max-width: 200px;
    margin: 0 auto;
  }

  /* Lists Grid */
  .lists-grid {
    display: grid;
    grid-template-columns: 2fr 1fr;
    gap: 20px;
  }

  .list-card {
    background-color: var(--bg-card);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-md);
    padding: 20px;
    box-shadow: var(--shadow-sm);
  }

  .list-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
  }

  .list-header h3 {
    font-size: 0.95rem;
    font-weight: 700;
    color: var(--text-main);
  }

  .view-all-btn {
    border: none;
    background: transparent;
    color: var(--primary);
    font-size: 0.85rem;
    font-weight: 700;
    cursor: pointer;
  }

  .data-table {
    width: 100%;
    border-collapse: collapse;
    text-align: left;
  }

  .data-table th {
    font-size: 0.75rem;
    font-weight: 700;
    color: var(--text-muted);
    padding: 10px 14px;
    border-bottom: 1px solid var(--border-color);
  }

  .data-table td {
    padding: 14px;
    font-size: 0.85rem;
    border-bottom: 1px solid var(--border-color);
  }

  .user-cell {
    display: flex;
    align-items: center;
    gap: 10px;
    font-weight: 600;
  }

  .avatar-sm {
    width: 28px;
    height: 28px;
    background-color: #edf2f7;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.75rem;
  }

  .avatar-sm.initials {
    background-color: var(--primary-light);
    color: var(--primary);
    font-weight: 700;
  }

  .status-badge {
    padding: 4px 8px;
    border-radius: var(--radius-full);
    font-size: 0.75rem;
    font-weight: 700;
  }

  .status-badge.yellow { background-color: #fefcbf; color: #b7791f; }
  .status-badge.green { background-color: #c6f6d5; color: #22543d; }
  .status-badge.orange { background-color: #feebc8; color: #c05621; }

  /* Upcoming Classes */
  .classes-list {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  .class-item {
    display: flex;
    gap: 14px;
    padding: 12px;
    border: 1px solid var(--border-color);
    border-radius: var(--radius-sm);
    background-color: #fafbfc;
  }

  .class-date-badge {
    background-color: #edf2f7;
    border-radius: var(--radius-sm);
    width: 50px;
    height: 50px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    flex-shrink: 0;
  }

  .class-date-badge .month {
    font-size: 0.65rem;
    color: var(--text-muted);
  }

  .class-date-badge .day {
    font-size: 1.1rem;
    color: var(--text-main);
    line-height: 1;
  }

  .class-info {
    display: flex;
    flex-direction: column;
  }

  .class-info h4 {
    font-size: 0.85rem;
    font-weight: 700;
    color: var(--text-main);
  }

  .class-time {
    font-size: 0.75rem;
    color: var(--text-muted);
  }

  .class-mentor {
    font-size: 0.75rem;
    color: var(--text-muted);
    font-weight: 500;
  }

  /* Payments Section */
  .payments-section {
    width: 100%;
  }

  .table-actions {
    display: flex;
    gap: 8px;
  }

  .icon-btn {
    border: 1px solid var(--border-color);
    background: transparent;
    padding: 6px 10px;
    border-radius: var(--radius-sm);
    cursor: pointer;
  }

  @media (max-width: 1200px) {
    .stats-grid { grid-template-columns: repeat(2, 1fr); }
    .charts-grid { grid-template-columns: 1fr; }
    .lists-grid { grid-template-columns: 1fr; }
  }
</style>
