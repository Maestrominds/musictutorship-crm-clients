<script lang="ts">
  import Icon from '../Icon.svelte';
  import MentorCourseStudentsTab from './MentorCourseStudentsTab.svelte';
  import MentorCourseClassesTab from './MentorCourseClassesTab.svelte';
  import MentorCourseAttendanceTab from './MentorCourseAttendanceTab.svelte';
  import { onMount } from 'svelte';
  import { apiGet } from '../api';

  let { courseId, courseTitle: initialTitle, goBack } = $props<{
    courseId: number;
    courseTitle: string;
    goBack: () => void;
  }>();

  type Tab = 'overview' | 'students' | 'classes' | 'attendance';
  let activeTab = $state<Tab>('overview');

  let courseTitle = $state(initialTitle || `Course #${courseId}`);
  let courseData = $state<any>(null);
  let isLoading = $state(true);

  onMount(async () => {
    try {
      const data = await apiGet<any>(`/mentor/courses/${courseId}`);
      if (data) {
        courseData = data;
        if (data.title) courseTitle = data.title;
      }
    } catch {
      // Use the title passed via props
    } finally {
      isLoading = false;
    }
  });

  const tabs: { key: Tab; label: string; icon: string }[] = [
    { key: 'overview', label: 'Overview', icon: 'layout' },
    { key: 'students', label: 'Students', icon: 'users' },
    { key: 'classes', label: 'Classes', icon: 'calendar' },
    { key: 'attendance', label: 'Attendance', icon: 'clipboard' },
  ];
</script>

<div class="course-detail-view">
  <!-- Breadcrumb -->
  <div class="breadcrumb">
    <button class="back-btn" onclick={goBack}>
      <Icon name="chevron-left" size={16} />
      <span>My Courses</span>
    </button>
    <span class="sep">/</span>
    <span class="current">{courseTitle}</span>
  </div>

  <!-- Header -->
  <div class="course-header">
    <div class="header-left">
      <h2>{courseTitle}</h2>
      {#if courseData?.description}
        <p class="desc">{courseData.description}</p>
      {/if}
    </div>
    <div class="header-right">
      <span class="status-badge">Active</span>
    </div>
  </div>

  <!-- Tabs -->
  <div class="tabs-bar">
    {#each tabs as tab}
      <button
        class="tab-btn"
        class:active={activeTab === tab.key}
        onclick={() => activeTab = tab.key}
      >
        <Icon name={tab.icon} size={15} />
        {tab.label}
      </button>
    {/each}
  </div>

  <!-- Tab Content -->
  <div class="tab-content">
    {#if activeTab === 'overview'}
      <div class="overview-grid">
        <div class="info-card">
          <div class="info-icon"><Icon name="book" size={20} /></div>
          <div class="info-text">
            <span class="info-label">Course ID</span>
            <span class="info-value">#{courseId}</span>
          </div>
        </div>
        {#if courseData?.price}
          <div class="info-card">
            <div class="info-icon"><Icon name="dollar-sign" size={20} /></div>
            <div class="info-text">
              <span class="info-label">Course Price</span>
              <span class="info-value">₹{courseData.price}</span>
            </div>
          </div>
        {/if}
        <div class="info-card full">
          <div class="info-icon"><Icon name="info" size={20} /></div>
          <div class="info-text">
            <span class="info-label">Description</span>
            <span class="info-value desc-value">{courseData?.description || 'No description provided.'}</span>
          </div>
        </div>
        <div class="quick-nav-grid">
          <button class="quick-nav-btn" onclick={() => activeTab = 'students'}>
            <Icon name="users" size={24} />
            <span>View Students</span>
          </button>
          <button class="quick-nav-btn" onclick={() => activeTab = 'classes'}>
            <Icon name="calendar" size={24} />
            <span>Manage Classes</span>
          </button>
          <button class="quick-nav-btn" onclick={() => activeTab = 'attendance'}>
            <Icon name="clipboard" size={24} />
            <span>Mark Attendance</span>
          </button>
        </div>
      </div>

    {:else if activeTab === 'students'}
      <MentorCourseStudentsTab {courseId} />

    {:else if activeTab === 'classes'}
      <MentorCourseClassesTab {courseId} {courseTitle} />

    {:else if activeTab === 'attendance'}
      <MentorCourseAttendanceTab {courseId} />
    {/if}
  </div>
</div>

<style>
  .course-detail-view {
    display: flex;
    flex-direction: column;
    gap: 24px;
  }

  /* Breadcrumb */
  .breadcrumb {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 0.875rem;
    color: var(--text-muted);
  }

  .back-btn {
    display: flex;
    align-items: center;
    gap: 4px;
    background: transparent;
    border: none;
    color: var(--text-muted);
    font-weight: 600;
    cursor: pointer;
    padding: 0;
    transition: color 0.15s;
    font-size: 0.875rem;
  }

  .back-btn:hover { color: var(--primary); }

  .sep { color: #cbd5e0; }

  .current {
    font-weight: 600;
    color: var(--text-main);
    max-width: 300px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  /* Header */
  .course-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 16px;
  }

  .header-left h2 {
    font-size: 1.75rem;
    font-weight: 700;
    color: var(--text-main);
    line-height: 1.2;
    margin-bottom: 6px;
  }

  .header-left .desc {
    color: var(--text-muted);
    font-size: 0.9rem;
  }

  .status-badge {
    background: #c6f6d5;
    color: #22543d;
    font-size: 0.72rem;
    font-weight: 700;
    padding: 5px 12px;
    border-radius: var(--radius-full);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    white-space: nowrap;
  }

  /* Tabs */
  .tabs-bar {
    display: flex;
    gap: 4px;
    border-bottom: 1px solid var(--border-color);
    padding-bottom: 0;
  }

  .tab-btn {
    display: flex;
    align-items: center;
    gap: 7px;
    background: transparent;
    border: none;
    color: var(--text-muted);
    font-size: 0.875rem;
    font-weight: 600;
    padding: 10px 16px;
    cursor: pointer;
    border-bottom: 2px solid transparent;
    margin-bottom: -1px;
    transition: all 0.18s;
    border-radius: 6px 6px 0 0;
  }

  .tab-btn:hover {
    color: var(--text-main);
    background: #f7fafc;
  }

  .tab-btn.active {
    color: var(--primary);
    border-bottom-color: var(--primary);
    background: transparent;
  }

  /* Overview */
  .tab-content { padding-top: 8px; }

  .overview-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
  }

  .info-card {
    background: var(--bg-card);
    border: 1px solid var(--border-color);
    border-radius: 12px;
    padding: 20px;
    display: flex;
    align-items: flex-start;
    gap: 14px;
  }

  .info-card.full {
    grid-column: 1 / -1;
  }

  .info-icon {
    width: 40px;
    height: 40px;
    background: #edf2f7;
    color: var(--primary);
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .info-text {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .info-label {
    font-size: 0.75rem;
    color: var(--text-muted);
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .info-value {
    font-size: 1rem;
    font-weight: 700;
    color: var(--text-main);
  }

  .desc-value {
    font-size: 0.9rem;
    font-weight: 400;
    color: var(--text-muted);
    line-height: 1.6;
  }

  /* Quick nav */
  .quick-nav-grid {
    grid-column: 1 / -1;
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
  }

  .quick-nav-btn {
    background: var(--bg-card);
    border: 1px solid var(--border-color);
    border-radius: 12px;
    padding: 20px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    cursor: pointer;
    color: var(--primary);
    font-weight: 700;
    font-size: 0.875rem;
    transition: all 0.18s;
  }

  .quick-nav-btn:hover {
    background: var(--primary);
    color: white;
    border-color: var(--primary);
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(229,62,62,0.2);
  }
</style>
