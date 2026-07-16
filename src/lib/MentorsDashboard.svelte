<script lang="ts">
  import { goto } from '$app/navigation';
  import Icon from './Icon.svelte';
  import MentorDashboardView from './mentor/MentorDashboardView.svelte';
  import MentorStudentsView from './mentor/MentorStudentsView.svelte';
  import MentorClassesView from './mentor/MentorClassesView.svelte';
  import MentorAttendanceView from './mentor/MentorAttendanceView.svelte';
  import MentorProfileView from './mentor/MentorProfileView.svelte';

  let { data } = $props();

  let activeSubView = $state<'dashboard' | 'students' | 'classes' | 'attendance' | 'profile'>(
    (typeof window !== 'undefined' ? localStorage.getItem('mentorActiveSubView') as any : null) || 'dashboard'
  );

  $effect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('mentorActiveSubView', activeSubView);
    }
  });

  function handleLogout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('mentorActiveSubView');
    goto('/login');
  }

  // Get user name from localStorage
  const userStr = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
  const user = userStr ? JSON.parse(userStr) : null;
  const userName = user?.name || 'Prof. Robert Fox';
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
        <span class="brand-sub">Mentor Portal</span>
      </div>
    </div>

    <nav class="nav-menu">
      <button class="nav-item" class:active={activeSubView === 'dashboard'} onclick={() => activeSubView = 'dashboard'}>
        <span class="nav-icon"><Icon name="dashboard" size={16} /></span> Mentor Dashboard
      </button>
      <button class="nav-item" class:active={activeSubView === 'students'} onclick={() => activeSubView = 'students'}>
        <span class="nav-icon"><Icon name="users" size={16} /></span> My Students
      </button>
      <button class="nav-item" class:active={activeSubView === 'classes'} onclick={() => activeSubView = 'classes'}>
        <span class="nav-icon"><Icon name="calendar" size={16} /></span> My Classes
      </button>
      <button class="nav-item" class:active={activeSubView === 'attendance'} onclick={() => activeSubView = 'attendance'}>
        <span class="nav-icon"><Icon name="clipboard" size={16} /></span> Attendance
      </button>
      <button class="nav-item" class:active={activeSubView === 'profile'} onclick={() => activeSubView = 'profile'}>
        <span class="nav-icon"><Icon name="user" size={16} /></span> Profile
      </button>
    </nav>

    <div class="sidebar-footer">
      <button onclick={handleLogout} class="logout-btn">
        <span class="logout-icon"><Icon name="log-out" size={16} /></span> Sign Out
      </button>
    </div>
  </aside>

  <!-- Main Content -->
  <main class="main-content">
    <header class="top-header">
      <div class="search-container">
        <span class="search-icon"><Icon name="search" size={16} /></span>
        <input type="text" placeholder="Search students, classes, or notes..." />
      </div>

      <div class="user-profile">
        <button class="notification-btn">
          <Icon name="bell" size={18} />
          <span class="badge"></span>
        </button>
        <div class="profile-details">
          <span class="user-name">{userName}</span>
          <span class="user-role">Senior Mentor</span>
        </div>
        <div class="avatar" style="display: flex; align-items: center; justify-content: center; background: #2b6cb0; color: white; border-radius: 50%; font-weight: 700; width: 36px; height: 36px; font-size: 1rem;">
          {userName.charAt(0).toUpperCase()}
        </div>
      </div>
    </header>
    
    <!-- Content Switching Area -->
    <div class="dashboard-scroll-area">
      {#if activeSubView === 'dashboard'}
        <MentorDashboardView mentorData={data?.mentorData} />
      {:else if activeSubView === 'students'}
        <MentorStudentsView />
      {:else if activeSubView === 'classes'}
        <MentorClassesView mentorData={data?.mentorData} />
      {:else if activeSubView === 'attendance'}
        <MentorAttendanceView />
      {:else if activeSubView === 'profile'}
        <MentorProfileView />
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

  .dashboard-scroll-area {
    flex-grow: 1;
    overflow-y: auto;
    padding: 32px;
  }
</style>
