<script lang="ts">
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import Icon from './Icon.svelte';
  import LeadsView from './admin/LeadsView.svelte';
  import TrialsView from './admin/TrialsView.svelte';
  import StudentsView from './admin/StudentsView.svelte';
  import CoursesView from './admin/CoursesView.svelte';
  import PaymentsView from './admin/PaymentsView.svelte';
  import MentorsView from './admin/MentorsView.svelte';
  import TicketsView from './admin/TicketsView.svelte';
  import SkeletonLoader from './SkeletonLoader.svelte';
  import { apiGet } from './api';

  let activeSubView = $state<'dashboard' | 'leads' | 'trials' | 'students' | 'courses' | 'payments' | 'mentors' | 'tickets'>(
    (typeof window !== 'undefined' ? localStorage.getItem('adminActiveSubView') as any : null) || 'dashboard'
  );
  let isPageTransitioning = $state(false);

  function navigateTo(view: typeof activeSubView) {
    if (view === activeSubView) return;
    isPageTransitioning = true;
    setTimeout(() => {
      activeSubView = view;
      isPageTransitioning = false;
    }, 180);
  }

  $effect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('adminActiveSubView', activeSubView);
    }
  });

  function handleLogout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('adminActiveSubView');
    goto('/login');
  }

  // Get admin name from localStorage
  const userStr = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
  const user = userStr ? JSON.parse(userStr) : null;
  const userName = user?.name || 'Admin User';

  // Dashboard live data
  let stats = $state({ totalLeads: 0, activeStudents: 0, upcomingTrials: 0, monthlyRevenue: 0 });
  let recentLeads = $state<{ name: string; email: string; status: string; created_at: string }[]>([]);
  let upcomingClasses = $state<{ date: string; name: string; time: string; mentor: string }[]>([]);
  let recentPayments = $state<{ id: string; student: string; amount: string; date: string; status: string }[]>([]);

  onMount(async () => {
    try {
      const statsRes = await apiGet<any>('/admin/stats');
      stats = {
        totalLeads: statsRes.total_leads || 0,
        activeStudents: statsRes.active_students || 0,
        upcomingTrials: statsRes.upcoming_trials || 0,
        monthlyRevenue: Number(statsRes.monthly_revenue) || 0
      };
    } catch (err) {
      console.error('Failed to fetch admin stats:', err);
    }

    try {
      const leads = await apiGet<any[]>('/admin/leads');
      recentLeads = (leads || []).slice(0, 5).map(l => ({
        name: l.name,
        email: l.email,
        status: l.mapped_status || 'New',
        created_at: l.created_at ? new Date(l.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'
      }));
    } catch (err) {
      console.error('Failed to fetch admin leads:', err);
    }

    try {
      const classes = await apiGet<any[]>('/admin/classes');
      upcomingClasses = (classes || []).slice(0, 5).map(c => {
        const dt = new Date(c.scheduled_at);
        return {
          date: dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          name: c.course_title,
          time: dt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          mentor: c.mentor_name
        };
      });
    } catch (err) {
      console.error('Failed to fetch admin classes:', err);
    }

    try {
      const payments = await apiGet<any[]>('/admin/payments');
      recentPayments = (payments || []).slice(0, 5).map(p => ({
        id: String(p.id),
        student: p.student_name,
        amount: `$${p.amount}`,
        date: p.created_at ? new Date(p.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A',
        status: 'Paid'
      }));
    } catch (err) {
      console.error('Failed to fetch admin payments:', err);
    }
  });
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
      <button class="nav-item" class:active={activeSubView === 'dashboard'} onclick={() => navigateTo('dashboard')}>
        <span class="nav-icon"><Icon name="dashboard" size={16} /></span> Dashboard
      </button>
      <button class="nav-item" class:active={activeSubView === 'leads'} onclick={() => navigateTo('leads')}><span class="nav-icon"><Icon name="users" size={16} /></span> Leads</button>
      <button class="nav-item" class:active={activeSubView === 'trials'} onclick={() => navigateTo('trials')}><span class="nav-icon"><Icon name="calendar" size={16} /></span> Trials</button>
      <button class="nav-item" class:active={activeSubView === 'students'} onclick={() => navigateTo('students')}><span class="nav-icon"><Icon name="graduation" size={16} /></span> Students</button>
      <button class="nav-item" class:active={activeSubView === 'courses'} onclick={() => navigateTo('courses')}><span class="nav-icon"><Icon name="book" size={16} /></span> Courses</button>
      <button class="nav-item" class:active={activeSubView === 'payments'} onclick={() => navigateTo('payments')}><span class="nav-icon"><Icon name="credit-card" size={16} /></span> Payments</button>
      <button class="nav-item" class:active={activeSubView === 'mentors'} onclick={() => navigateTo('mentors')}><span class="nav-icon"><Icon name="music" size={16} /></span> Mentors</button>
      <button class="nav-item" class:active={activeSubView === 'tickets'} onclick={() => navigateTo('tickets')}><span class="nav-icon"><Icon name="message-square" size={16} /></span> Tickets</button>

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
          <span class="user-name">{userName}</span>
          <span class="user-role">Admin</span>
        </div>
        <div class="avatar" style="display: flex; align-items: center; justify-content: center; background: #e53e3e; color: white; border-radius: 50%; font-weight: 700; width: 36px; height: 36px; font-size: 1rem;">
          {userName.charAt(0).toUpperCase()}
        </div>
      </div>
    </header>

    <!-- Content Dashboard Scroll -->
    <div class="dashboard-scroll-area">
      {#if isPageTransitioning}
        <SkeletonLoader type="table" rows={6} cols={5} />
      {:else if activeSubView === 'dashboard'}
        <!-- Stats Cards -->
        <section class="stats-grid">
          <!-- NOTE: Stats from GET /api/admin/stats — see backend_dev_todo.md #1 -->
          <div class="stat-card">
            <div class="stat-header">
              <span class="stat-icon-wrapper blue"><Icon name="chart" size={18} /></span>
              <span class="stat-trend positive">↗</span>
            </div>
            <div class="stat-value">{stats.totalLeads || '—'}</div>
            <div class="stat-label">Total Leads</div>
          </div>

          <div class="stat-card">
            <div class="stat-header">
              <span class="stat-icon-wrapper purple"><Icon name="music" size={18} /></span>
              <span class="stat-trend positive">↗</span>
            </div>
            <div class="stat-value">{stats.activeStudents || '—'}</div>
            <div class="stat-label">Active Students</div>
          </div>

          <div class="stat-card">
            <div class="stat-header">
              <span class="stat-icon-wrapper orange">⏳</span>
              <span class="stat-trend negative">↘</span>
            </div>
            <div class="stat-value">{stats.upcomingTrials || '—'}</div>
            <div class="stat-label">Upcoming Trials</div>
          </div>

          <div class="stat-card">
            <div class="stat-header">
              <span class="stat-icon-wrapper green"><Icon name="dollar" size={18} /></span>
              <span class="stat-trend positive">↗</span>
            </div>
            <div class="stat-value">{stats.monthlyRevenue ? `$${stats.monthlyRevenue.toLocaleString()}` : '—'}</div>
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
              <button class="view-all-btn" onclick={() => activeSubView = 'leads'}>View All</button>
            </div>
            <table class="data-table">
              <thead>
                <tr>
                  <th>LEAD NAME</th>
                  <th>EMAIL</th>
                  <th>DATE</th>
                  <th>STATUS</th>
                </tr>
              </thead>
              <tbody>
                {#if recentLeads.length === 0}
                  <tr><td colspan="4" style="text-align:center;color:#999;padding:20px;">No leads yet. Add leads from the Leads tab.</td></tr>
                {/if}
                {#each recentLeads as lead}
                  <tr>
                    <td class="user-cell">
                      <div class="avatar-sm"><Icon name="user" size={14} /></div>
                      <span>{lead.name}</span>
                    </td>
                    <td>{lead.email}</td>
                    <td>{lead.created_at}</td>
                    <td><span class="status-badge yellow">{lead.status}</span></td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>

          <!-- Upcoming Classes -->
          <!-- NOTE: requires GET /api/admin/classes — see backend_dev_todo.md #7 -->
          <div class="list-card upcoming-classes">
            <div class="list-header">
              <h3>Upcoming Classes</h3>
              <button class="view-all-btn">Calendar View</button>
            </div>
            <div class="classes-list">
              {#if upcomingClasses.length === 0}
                <div style="text-align:center;color:#999;padding:20px;font-size:0.85rem;">Upcoming classes will appear here once the backend endpoint is ready.</div>
              {/if}
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
        <!-- NOTE: requires GET /api/admin/payments — see backend_dev_todo.md #6 -->
        <section class="payments-section">
          <div class="list-card">
            <div class="list-header">
              <h3>Recent Payments</h3>
              <button class="view-all-btn" onclick={() => activeSubView = 'payments'}>View All</button>
            </div>
            <table class="data-table">
              <thead>
                <tr>
                  <th>STUDENT</th>
                  <th>AMOUNT</th>
                  <th>DATE</th>
                  <th>STATUS</th>
                </tr>
              </thead>
              <tbody>
                {#if recentPayments.length === 0}
                  <tr><td colspan="4" style="text-align:center;color:#999;padding:20px;">Payment data will appear here once the backend endpoint is ready.</td></tr>
                {/if}
                {#each recentPayments as pay}
                  <tr>
                    <td class="user-cell">
                      <div class="avatar-sm initials">{pay.student.charAt(0)}</div>
                      <span>{pay.student}</span>
                    </td>
                    <td class="amount-cell">{pay.amount}</td>
                    <td>{pay.date}</td>
                    <td><span class="status-badge" class:green={pay.status === 'Paid'} class:orange={pay.status === 'Pending'}>{pay.status}</span></td>
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
      {:else if activeSubView === 'tickets'}
        <TicketsView />
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
