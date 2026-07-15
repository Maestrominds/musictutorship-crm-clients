<script lang="ts">
  import Icon from '$lib/Icon.svelte';
  import { onMount } from 'svelte';
  import { apiGet } from '$lib/api';
  import type { Student } from '../dataStore';

  let students = $state<Student[]>([]);
  let isLoading = $state(true);

  // NOTE: GET /api/admin/students is not yet implemented. See backend_dev_todo.md #3
  onMount(async () => {
    try {
      const data = await apiGet<Student[]>('/admin/students');
      students = data || [];
    } catch {
      students = []; // Not yet available — show empty state
    } finally {
      isLoading = false;
    }
  });

  let searchQuery = $state('');
  let filteredStudents = $derived(
    students.filter(student => {
      const matchSearch = student.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          student.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          student.course.toLowerCase().includes(searchQuery.toLowerCase());
      return matchSearch;
    })
  );

  function getInitials(name: string) {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }
</script>

<div class="students-view">
  <div class="header-row">
    <div class="header-text">
      <h2>Students Management</h2>
      <p>View and manage all enrolled students in the academy.</p>
    </div>
    <div class="header-actions">
      <button class="export-btn">
        <span><Icon name="file" size={14} /></span> Export
      </button>
    </div>
  </div>

  <div class="filter-card">
    <div class="search-box">
      <span class="search-icon"><Icon name="search" size={15} /></span>
      <input type="text" placeholder="Search students by name or ID..." bind:value={searchQuery} />
    </div>
    <button class="filter-btn">
      <span><Icon name="filter" size={14} /></span> Filter
    </button>
  </div>

  <div class="table-card">
    {#if isLoading}
      <div style="text-align:center;padding:40px;color:#999;">Loading students...</div>
    {:else}
    <table class="students-table">
      <thead>
        <tr>
          <th>NAME</th>
          <th>COURSE</th>
          <th>MENTOR</th>
          <th>ENROLLMENT DATE</th>
          <th>PAYMENT STATUS</th>
        </tr>
      </thead>
      <tbody>
        {#if filteredStudents.length === 0}
          <tr>
            <td colspan="5" class="empty-row" style="text-align:center;padding:24px;color:#999;">
              No students found. The backend endpoint is pending — see backend_dev_todo.md #3.
            </td>
          </tr>
        {:else}
          {#each filteredStudents as student}
            <tr>
              <td class="user-cell">
                <div class="avatar-circle">{getInitials(student.name)}</div>
                <div class="user-details">
                  <span class="name">{student.name}</span>
                  <span class="email">{student.email}</span>
                </div>
              </td>
              <td class="course-text">{student.course_title || student.course || '—'}</td>
              <td class="mentor-text">{student.mentor_name || student.mentor || '—'}</td>
              <td class="date-text">
                {student.enrolled_at ? new Date(student.enrolled_at).toLocaleDateString() : (student.enrollmentDate || '—')}
              </td>
              <td>
                <span class="status-badge" class:paid={student.paymentStatus === 'Paid'} class:pending={student.paymentStatus === 'Pending'} class:overdue={student.paymentStatus === 'Overdue'}>
                  {student.paymentStatus || 'Paid'}
                </span>
              </td>
            </tr>
          {/each}
        {/if}
      </tbody>
    </table>

    <div class="table-footer">
      <span class="results-count">Showing {filteredStudents.length} student{filteredStudents.length !== 1 ? 's' : ''}</span>
    </div>
    {/if}
  </div>
</div>

<style>
  .students-view {
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

  .export-btn {
    border: 1.5px solid var(--border-color);
    background-color: var(--bg-card);
    color: var(--primary);
    font-weight: 700;
    padding: 10px 20px;
    border-radius: var(--radius-md);
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 8px;
    transition: all 0.2s;
  }

  .export-btn:hover {
    background-color: var(--primary-light);
    border-color: var(--primary);
  }

  .filter-card {
    background-color: var(--bg-card);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-md);
    padding: 16px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    box-shadow: var(--shadow-sm);
    gap: 16px;
  }

  .search-box {
    display: flex;
    align-items: center;
    gap: 10px;
    background-color: #f1f4f9;
    padding: 10px 16px;
    border-radius: var(--radius-md);
    flex-grow: 1;
    max-width: 450px;
  }

  .search-box input {
    border: none;
    background: transparent;
    outline: none;
    font-size: 0.9rem;
    color: var(--text-main);
    width: 100%;
  }

  .filter-btn {
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

  .filter-btn:hover {
    background-color: #f7fafc;
  }

  /* Table Card */
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

  .user-cell {
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

  .user-details {
    display: flex;
    flex-direction: column;
  }

  .user-details .name {
    font-weight: 700;
    color: var(--text-main);
  }

  .user-details .email {
    font-size: 0.8rem;
    color: var(--text-muted);
  }

  .course-text {
    font-weight: 500;
    color: var(--text-main);
  }

  .mentor-text {
    font-weight: 500;
    color: var(--text-main);
  }

  .date-text {
    font-weight: 500;
    color: var(--text-muted);
  }

  .status-badge {
    padding: 4px 10px;
    border-radius: var(--radius-full);
    font-size: 0.75rem;
    font-weight: 700;
    display: inline-block;
  }

  .status-badge.paid {
    background-color: #c6f6d5;
    color: #22543d;
  }

  .status-badge.pending {
    background-color: #feebc8;
    color: #c05621;
  }

  .status-badge.overdue {
    background-color: #fed7d7;
    color: #9b2c2c;
  }

  .actions-row {
    display: flex;
    gap: 10px;
  }

  .action-icon-btn {
    border: none;
    background: transparent;
    cursor: pointer;
    font-size: 1rem;
    opacity: 0.7;
    transition: opacity 0.2s;
  }

  .action-icon-btn:hover {
    opacity: 1;
  }

  .action-icon-btn.delete {
    color: var(--primary);
  }

  .empty-row {
    text-align: center;
    color: var(--text-muted);
    padding: 32px !important;
  }

  /* Table Footer */
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
</style>
