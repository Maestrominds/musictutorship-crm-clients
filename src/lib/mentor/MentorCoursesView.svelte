<script lang="ts">
  import Icon from '../Icon.svelte';
  import SkeletonLoader from '../SkeletonLoader.svelte';
  import { onMount } from 'svelte';
  import { apiGet } from '../api';

  let { openCourse } = $props<{ openCourse: (id: number, title: string) => void }>();

  interface Course {
    id: number;
    title: string;
    description: string;
    student_count: number;
    next_class_at: string | null;
    completed_classes: number;
    total_classes: number;
    is_active: boolean;
  }

  let courses = $state<Course[]>([]);
  let isLoading = $state(true);
  let error = $state('');

  onMount(async () => {
    try {
      const data = await apiGet<Course[]>('/mentor/courses');
      courses = data || [];
    } catch (err: any) {
      error = err?.message || 'Failed to load courses';
      courses = [];
    } finally {
      isLoading = false;
    }
  });

  function formatNextClass(dateStr: string | null): string {
    if (!dateStr) return 'Not scheduled';
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = d.getTime() - now.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Today, ' + d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    if (diffDays === 1) return 'Tomorrow, ' + d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ', ' + d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  }

  function getProgress(completed: number, total: number): number {
    if (!total) return 0;
    return Math.round((completed / total) * 100);
  }

  const courseColors = [
    { icon: '🎸', bg: '#fff5f5', iconBg: '#fed7d7', color: '#c53030' },
    { icon: '🎹', bg: '#ebf8ff', iconBg: '#bee3f8', color: '#2b6cb0' },
    { icon: '🎤', bg: '#f0fff4', iconBg: '#c6f6d5', color: '#276749' },
    { icon: '🎼', bg: '#faf5ff', iconBg: '#e9d8fd', color: '#553c9a' },
    { icon: '🥁', bg: '#fffaf0', iconBg: '#feebc8', color: '#c05621' },
    { icon: '🎺', bg: '#e6fffa', iconBg: '#b2f5ea', color: '#234e52' },
  ];

  function getCourseColor(idx: number) {
    return courseColors[idx % courseColors.length];
  }
</script>

<div class="courses-view">
  <div class="page-header">
    <div>
      <h2>My Courses</h2>
      <p>Select a course to manage students, schedule classes, and track attendance.</p>
    </div>
    <div class="total-badge">
      <Icon name="book" size={16} />
      <span>{courses.length} Active Course{courses.length !== 1 ? 's' : ''}</span>
    </div>
  </div>

  {#if isLoading}
    <div class="courses-grid">
      {#each [1,2,3] as _}
        <div class="course-card skeleton-card">
          <SkeletonLoader type="card" />
        </div>
      {/each}
    </div>

  {:else if error}
    <div class="empty-state error-state">
      <div class="empty-icon">⚠️</div>
      <h3>Unable to Load Courses</h3>
      <p>Something went wrong while loading your courses. Please try refreshing the page.</p>
      <p style="font-size: 0.82rem; color: var(--text-muted);">If the problem continues, please contact your administrator.</p>
    </div>

  {:else if courses.length === 0}
    <div class="empty-state">
      <div class="empty-icon">📚</div>
      <h3>No Courses Assigned Yet</h3>
      <p>You haven't been assigned to any courses. Please contact your administrator to get started.</p>
    </div>

  {:else}
    <div class="courses-grid">
      {#each courses as course, idx}
        {@const color = getCourseColor(idx)}
        {@const progress = getProgress(course.completed_classes, course.total_classes)}
        <div class="course-card" onclick={() => openCourse(course.id, course.title)} style="--card-bg: {color.bg}; --icon-bg: {color.iconBg}; --accent: {color.color}">
          <div class="card-top">
            <div class="course-emoji">{color.icon}</div>
            <span class="status-badge {course.is_active ? 'active' : 'inactive'}">
              {course.is_active ? 'Active' : 'Inactive'}
            </span>
          </div>

          <div class="course-content">
            <h3 class="course-title">{course.title}</h3>
            {#if course.description}
              <p class="course-desc">{course.description.slice(0, 80)}{course.description.length > 80 ? '...' : ''}</p>
            {/if}
          </div>

          <div class="course-stats">
            <div class="stat">
              <div class="stat-icon"><Icon name="users" size={13} /></div>
              <span>{course.student_count} Student{course.student_count !== 1 ? 's' : ''}</span>
            </div>
            <div class="stat">
              <div class="stat-icon"><Icon name="calendar" size={13} /></div>
              <span>{formatNextClass(course.next_class_at)}</span>
            </div>
          </div>

          <div class="progress-section">
            <div class="progress-header">
              <span>Progress</span>
              <span class="pct">{progress}%</span>
            </div>
            <div class="progress-bar-bg">
              <div class="progress-bar-fill" style="width: {progress}%; background: var(--accent)"></div>
            </div>
            <div class="class-count">{course.completed_classes} / {course.total_classes} classes done</div>
          </div>

          <div class="card-footer">
            <span class="open-link">Open Course <Icon name="chevron-right" size={14} /></span>
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .courses-view {
    display: flex;
    flex-direction: column;
    gap: 28px;
  }

  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
  }

  .page-header h2 {
    font-size: 1.6rem;
    font-weight: 700;
    color: var(--text-main);
    margin-bottom: 6px;
  }

  .page-header p {
    color: var(--text-muted);
    font-size: 0.9rem;
  }

  .total-badge {
    display: flex;
    align-items: center;
    gap: 8px;
    background: var(--bg-card);
    border: 1px solid var(--border-color);
    padding: 8px 16px;
    border-radius: var(--radius-full);
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--text-main);
    white-space: nowrap;
  }

  .courses-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 24px;
  }

  .course-card {
    background: var(--card-bg, var(--bg-card));
    border: 1px solid var(--border-color);
    border-radius: 16px;
    padding: 24px;
    cursor: pointer;
    transition: all 0.22s ease;
    display: flex;
    flex-direction: column;
    gap: 16px;
    box-shadow: 0 1px 4px rgba(0,0,0,0.06);
    position: relative;
    overflow: hidden;
  }

  .course-card::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 3px;
    background: var(--accent);
    opacity: 0;
    transition: opacity 0.22s;
  }

  .course-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 12px 32px rgba(0,0,0,0.1);
    border-color: var(--accent);
  }

  .course-card:hover::before {
    opacity: 1;
  }

  .card-top {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .course-emoji {
    font-size: 2rem;
    width: 52px;
    height: 52px;
    background: var(--icon-bg);
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .status-badge {
    font-size: 0.72rem;
    font-weight: 700;
    padding: 4px 10px;
    border-radius: var(--radius-full);
    letter-spacing: 0.5px;
    text-transform: uppercase;
  }

  .status-badge.active { background: #c6f6d5; color: #22543d; }
  .status-badge.inactive { background: #e2e8f0; color: #4a5568; }

  .course-content {
    flex: 1;
  }

  .course-title {
    font-size: 1.05rem;
    font-weight: 700;
    color: var(--text-main);
    line-height: 1.4;
    margin-bottom: 6px;
  }

  .course-desc {
    font-size: 0.82rem;
    color: var(--text-muted);
    line-height: 1.5;
  }

  .course-stats {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .stat {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 0.83rem;
    color: var(--text-muted);
    font-weight: 500;
  }

  .stat-icon {
    color: var(--accent);
    display: flex;
  }

  .progress-section {
    padding-top: 14px;
    border-top: 1px solid var(--border-color);
  }

  .progress-header {
    display: flex;
    justify-content: space-between;
    font-size: 0.78rem;
    font-weight: 600;
    color: var(--text-muted);
    margin-bottom: 8px;
  }

  .pct {
    color: var(--accent);
    font-weight: 700;
  }

  .progress-bar-bg {
    height: 6px;
    background: rgba(0,0,0,0.08);
    border-radius: var(--radius-full);
    overflow: hidden;
    margin-bottom: 6px;
  }

  .progress-bar-fill {
    height: 100%;
    border-radius: var(--radius-full);
    transition: width 0.6s ease;
  }

  .class-count {
    font-size: 0.75rem;
    color: var(--text-muted);
  }

  .card-footer {
    border-top: 1px solid var(--border-color);
    padding-top: 14px;
  }

  .open-link {
    font-size: 0.85rem;
    font-weight: 700;
    color: var(--accent);
    display: flex;
    align-items: center;
    gap: 4px;
  }

  /* Empty / Error States */
  .empty-state {
    background: var(--bg-card);
    border: 1px dashed #cbd5e0;
    border-radius: 16px;
    padding: 60px 40px;
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
  }

  .empty-icon { font-size: 3rem; }

  .empty-state h3 {
    font-size: 1.2rem;
    font-weight: 700;
    color: var(--text-main);
  }

  .empty-state p {
    color: var(--text-muted);
    font-size: 0.9rem;
    max-width: 380px;
  }

  .empty-state .hint {
    font-size: 0.8rem;
    color: #999;
    background: #f7fafc;
    padding: 10px 16px;
    border-radius: 8px;
    border: 1px solid #e2e8f0;
  }

  .hint code {
    font-family: monospace;
    background: #edf2f7;
    padding: 2px 6px;
    border-radius: 4px;
    color: #e53e3e;
    font-size: 0.85em;
  }
</style>
