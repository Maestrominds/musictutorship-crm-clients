<script lang="ts">
  import Icon from '../Icon.svelte';
  import SkeletonLoader from '../SkeletonLoader.svelte';
  import { onMount } from 'svelte';
  import { apiGet } from '../api';

  let { courseId } = $props<{ courseId: number }>();

  interface CourseStudent {
    id: number;
    name: string;
    email: string;
    course_title: string;
    enrolled_at: string;
  }

  let students = $state<CourseStudent[]>([]);
  let isLoading = $state(true);
  let error = $state('');
  let searchQuery = $state('');

  onMount(async () => {
    try {
      const data = await apiGet<CourseStudent[]>(`/mentor/courses/${courseId}/students`) || [];
      students = data.map(s => ({
        id: s.id,
        name: s.name,
        email: s.email,
        course_title: s.course_title || '',
        enrolled_at: s.enrolled_at || s.created_at || ''
      }));
    } catch (err: any) {
      error = err?.message || 'Failed to load students';
    } finally {
      isLoading = false;
    }
  });

  let filtered = $derived(
    students.filter(s =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.email.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  function getInitials(name: string) {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }

  function formatDate(dateStr: string): string {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  const avatarColors = [
    { bg: '#ebf8ff', color: '#2b6cb0' },
    { bg: '#f0fff4', color: '#276749' },
    { bg: '#faf5ff', color: '#553c9a' },
    { bg: '#fff5f5', color: '#c53030' },
    { bg: '#fffaf0', color: '#c05621' },
  ];
  function getAvatarColor(id: number) { return avatarColors[id % avatarColors.length]; }
</script>

<div class="students-tab">
  <!-- Header -->
  <div class="tab-header">
    <div class="header-left">
      <h3>Enrolled Students</h3>
      <span class="count-badge">{students.length} student{students.length !== 1 ? 's' : ''}</span>
    </div>
    <div class="header-right">
      <div class="search-box">
        <Icon name="search" size={14} />
        <input type="text" placeholder="Search students..." bind:value={searchQuery} />
      </div>
    </div>
  </div>

  {#if isLoading}
    <SkeletonLoader type="table" rows={4} cols={4} />

  {:else if error}
    <div class="empty-state error">
      <div class="empty-icon">⚠️</div>
      <h4>Unable to Load Students</h4>
      <p>{error}</p>
      <p>Please try refreshing the page or contact your administrator.</p>
    </div>

  {:else if filtered.length === 0}
    <div class="empty-state">
      {#if searchQuery}
        <div class="empty-icon">🔍</div>
        <h4>No results for "{searchQuery}"</h4>
        <p>Try a different name or email address.</p>
      {:else}
        <div class="empty-icon">👥</div>
        <h4>No Students Enrolled</h4>
        <p>No active students found for this course. Please contact your administrator to enroll students.</p>
      {/if}
    </div>

  {:else}
    <div class="table-card">
      <table class="students-table">
        <thead>
          <tr>
            <th>STUDENT</th>
            <th>EMAIL</th>
            <th>ENROLLED ON</th>
            <th style="text-align:right">ACTIONS</th>
          </tr>
        </thead>
        <tbody>
          {#each filtered as student}
            {@const av = getAvatarColor(student.id)}
            <tr>
              <td class="student-cell">
                <div class="avatar" style="background:{av.bg}; color:{av.color}">{getInitials(student.name)}</div>
                <span class="student-name">{student.name}</span>
              </td>
              <td class="email-cell">{student.email}</td>
              <td class="date-cell">{formatDate(student.enrolled_at)}</td>
              <td class="actions-cell">
                <div class="actions-row">
                  <a href="mailto:{student.email}" class="action-btn" title="Email student">
                    <Icon name="mail" size={14} />
                  </a>
                </div>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
      <div class="table-footer">
        <span>Showing {filtered.length} of {students.length} students</span>
      </div>
    </div>
  {/if}
</div>

<style>
  .students-tab { display: flex; flex-direction: column; gap: 20px; }

  .tab-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 16px;
    flex-wrap: wrap;
  }

  .header-left { display: flex; align-items: center; gap: 12px; }

  .header-left h3 {
    font-size: 1.1rem;
    font-weight: 700;
    color: var(--text-main);
    margin: 0;
  }

  .count-badge {
    background: #edf2f7;
    color: var(--text-muted);
    font-size: 0.78rem;
    font-weight: 700;
    padding: 3px 10px;
    border-radius: var(--radius-full);
  }

  .search-box {
    display: flex;
    align-items: center;
    gap: 8px;
    background: #f1f4f9;
    padding: 9px 14px;
    border-radius: 10px;
    color: var(--text-muted);
    min-width: 220px;
  }

  .search-box input {
    border: none;
    background: transparent;
    outline: none;
    font-size: 0.875rem;
    color: var(--text-main);
    width: 100%;
  }

  .table-card {
    background: var(--bg-card);
    border: 1px solid var(--border-color);
    border-radius: 12px;
    overflow: hidden;
  }

  .students-table {
    width: 100%;
    border-collapse: collapse;
    text-align: left;
  }

  .students-table th {
    font-size: 0.72rem;
    font-weight: 700;
    color: var(--text-muted);
    padding: 12px 20px;
    border-bottom: 1px solid var(--border-color);
    background: #fafbfc;
    letter-spacing: 0.5px;
    text-transform: uppercase;
  }

  .students-table td {
    padding: 14px 20px;
    font-size: 0.875rem;
    border-bottom: 1px solid var(--border-color);
    vertical-align: middle;
    color: var(--text-main);
  }

  .students-table tbody tr:last-child td { border-bottom: none; }

  .students-table tbody tr:hover { background: #f7fafc; }

  .student-cell {
    display: flex !important;
    align-items: center;
    gap: 12px;
  }

  .avatar {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    font-weight: 700;
    font-size: 0.8rem;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .student-name { font-weight: 600; }

  .email-cell { color: var(--text-muted); font-size: 0.83rem; }

  .date-cell { color: var(--text-muted); font-size: 0.83rem; }

  .actions-cell { text-align: right; }

  .actions-row { display: flex; justify-content: flex-end; gap: 8px; }

  .action-btn {
    width: 32px; height: 32px;
    border: 1px solid var(--border-color);
    background: var(--bg-card);
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: var(--text-muted);
    text-decoration: none;
    transition: all 0.15s;
  }

  .action-btn:hover { border-color: var(--primary); color: var(--primary); }

  .table-footer {
    padding: 12px 20px;
    background: #fafbfc;
    font-size: 0.8rem;
    color: var(--text-muted);
    font-weight: 500;
  }

  /* Empty States */
  .empty-state {
    background: var(--bg-card);
    border: 1px dashed #cbd5e0;
    border-radius: 12px;
    padding: 48px 32px;
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
  }

  .empty-icon { font-size: 2.5rem; }

  .empty-state h4 {
    font-size: 1.05rem;
    font-weight: 700;
    color: var(--text-main);
    margin: 0;
  }

  .empty-state p {
    color: var(--text-muted);
    font-size: 0.875rem;
    margin: 0;
  }

  .hint {
    font-size: 0.78rem !important;
    color: #999 !important;
    background: #f7fafc;
    padding: 8px 14px;
    border-radius: 8px;
    border: 1px solid #e2e8f0;
  }

  .hint code {
    font-family: monospace;
    background: #edf2f7;
    padding: 2px 5px;
    border-radius: 4px;
    color: #e53e3e;
  }
</style>
