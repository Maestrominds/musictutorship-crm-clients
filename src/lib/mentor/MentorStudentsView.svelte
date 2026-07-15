<script lang="ts">
  import Icon from '$lib/Icon.svelte';
  import { onMount } from 'svelte';
  import { apiGet } from '$lib/api';

  interface MentorStudent {
    id: number;
    name: string;
    email: string;
    course: string;
    progress: number;
    nextClass: string;
  }

  let students = $state<MentorStudent[]>([]);
  let isLoading = $state(true);

  // NOTE: GET /api/mentor/students is not yet implemented. See backend_dev_todo.md #9
  onMount(async () => {
    try {
      const data = await apiGet<any[]>('/mentor/students');
      students = (data || []).map(s => ({
        id: s.id,
        name: s.name,
        email: s.email,
        course: s.course_title || 'Music Course',
        progress: s.progress_percent || 0,
        nextClass: s.next_class_at
          ? new Date(s.next_class_at).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })
          : 'Not scheduled'
      }));
    } catch {
      students = []; // Not yet available — show empty state
    } finally {
      isLoading = false;
    }
  });

  let searchQuery = $state('');
  let filteredStudents = $derived(
    students.filter(s =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.course.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  function getInitials(name: string) {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }
</script>

<div class="mentor-students-view">
  <div class="header-row">
    <div class="header-text">
      <h2>My Students</h2>
      <p>Monitor and manage the musical progress of your enrolled students.</p>
    </div>
    <div class="header-actions">
      <button class="filters-btn"><span><Icon name="filter" size={14} /></span> Filters</button>
      <button class="add-student-btn"><span><Icon name="plus" size={14} /></span> Add New Student</button>
    </div>
  </div>

  <div class="search-card">
    <div class="search-input-wrapper">
      <span class="search-icon"><Icon name="search" size={15} /></span>
      <input type="text" placeholder="Search students by name, course..." bind:value={searchQuery} />
    </div>
  </div>

  <div class="table-card">
    <table class="students-table">
      <thead>
        <tr>
          <th>STUDENT NAME</th>
          <th>COURSE</th>
          <th>ENROLLMENT DATE</th>
          <th>PROGRESS</th>
          <th>NEXT CLASS</th>
          <th>ACTIONS</th>
        </tr>
      </thead>
      <tbody>
        {#if isLoading}
          <tr><td colspan="6" style="text-align:center;padding:24px;color:#999;">Loading students...</td></tr>
        {:else if filteredStudents.length === 0}
          <tr>
            <td colspan="6" class="empty-row">No students assigned yet. The backend endpoint is pending — see backend_dev_todo.md #9.</td>
          </tr>
        {:else}
          {#each filteredStudents as student}
            <tr>
              <td class="student-cell">
                <div class="avatar-circle">{getInitials(student.name)}</div>
                <div class="student-info">
                  <span class="name">{student.name}</span>
                  <span class="email">{student.email}</span>
                </div>
              </td>
              <td>
                <span class="course-badge">{student.course}</span>
              </td>
              <td class="date-text">{student.email || '—'}</td>
              <td>
                <div class="progress-container">
                  <div class="progress-bar-bg">
                    <div class="progress-bar-fill" style="width: {student.progress}%"></div>
                  </div>
                  <span class="pct">{student.progress}%</span>
                </div>
              </td>
              <td class="next-class-text">{student.nextClass}</td>
              <td>
                <div class="actions-row">
                  <button class="action-btn" title="View Progress"><Icon name="eye" size={14} /></button>
                  <button class="action-btn" title="Message Student"><Icon name="mail" size={14} /></button>
                </div>
              </td>
            </tr>
          {/each}
        {/if}
      </tbody>
    </table>

    <div class="table-footer">
      <span class="results-count">Showing 1 to {filteredStudents.length} of {students.length} students</span>
      <div class="pagination">
        <button class="pag-btn prev">◀</button>
        <button class="pag-btn active">1</button>
        <button class="pag-btn">2</button>
        <button class="pag-btn next">▶</button>
      </div>
    </div>
  </div>
</div>

<style>
  .mentor-students-view {
    display: flex;
    flex-direction: column;
    gap: 24px;
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

  .header-actions {
    display: flex;
    gap: 12px;
  }

  .filters-btn {
    border: 1px solid var(--border-color);
    background-color: var(--bg-card);
    color: var(--text-main);
    font-weight: 600;
    padding: 10px 18px;
    border-radius: var(--radius-md);
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .add-student-btn {
    background-color: var(--primary);
    color: white;
    border: none;
    border-radius: var(--radius-md);
    padding: 10px 18px;
    font-weight: 600;
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(229, 62, 62, 0.2);
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .search-card {
    background-color: var(--bg-card);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-md);
    padding: 16px;
    box-shadow: var(--shadow-sm);
  }

  .search-input-wrapper {
    display: flex;
    align-items: center;
    gap: 10px;
    background-color: #f1f4f9;
    padding: 10px 16px;
    border-radius: var(--radius-md);
    max-width: 450px;
  }

  .search-input-wrapper input {
    border: none;
    background: transparent;
    outline: none;
    font-size: 0.9rem;
    color: var(--text-main);
    width: 100%;
  }

  /* Table Card styling */
  .table-card {
    background-color: var(--bg-card);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-md);
    box-shadow: var(--shadow-sm);
    overflow: hidden;
  }

  .students-table {
    width: 100%;
    border-collapse: collapse;
    text-align: left;
  }

  .students-table th {
    font-size: 0.75rem;
    font-weight: 700;
    color: var(--text-muted);
    padding: 14px 20px;
    border-bottom: 1px solid var(--border-color);
    background-color: #fafbfc;
  }

  .students-table td {
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
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background-color: #ebf8ff;
    color: #2b6cb0;
    font-weight: 700;
    font-size: 0.8rem;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .student-info {
    display: flex;
    flex-direction: column;
  }

  .student-info .name {
    font-weight: 700;
    color: var(--text-main);
  }

  .student-info .email {
    font-size: 0.8rem;
    color: var(--text-muted);
  }

  .course-badge {
    color: var(--primary);
    background-color: var(--primary-light);
    font-size: 0.75rem;
    font-weight: 700;
    padding: 4px 10px;
    border-radius: var(--radius-sm);
  }

  .date-text {
    font-weight: 500;
    color: var(--text-muted);
  }

  .progress-container {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 160px;
  }

  .progress-bar-bg {
    height: 8px;
    background-color: #edf2f7;
    border-radius: var(--radius-full);
    flex-grow: 1;
    overflow: hidden;
  }

  .progress-bar-fill {
    height: 100%;
    background-color: var(--primary);
    border-radius: var(--radius-full);
  }

  .progress-container .pct {
    font-size: 0.8rem;
    font-weight: 700;
    color: var(--text-main);
  }

  .next-class-text {
    font-weight: 600;
    color: var(--text-main);
  }

  .actions-row {
    display: flex;
    gap: 12px;
  }

  .action-btn {
    border: none;
    background: transparent;
    cursor: pointer;
    font-size: 1rem;
    opacity: 0.7;
    transition: opacity 0.2s;
  }

  .action-btn:hover {
    opacity: 1;
  }

  .empty-row {
    text-align: center;
    color: var(--text-muted);
    padding: 32px !important;
  }

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
  }

  .pag-btn.active {
    background-color: var(--primary);
    color: white;
    border-color: var(--primary);
  }
</style>
