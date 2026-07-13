<script lang="ts">
  import Icon from '$lib/Icon.svelte';
  import { onDestroy } from 'svelte';
  import { studentsStore, type Student } from '../dataStore';

  let students: Student[] = $state([]);
  const unsubscribe = studentsStore.subscribe((val) => {
    students = val;
  });

  onDestroy(() => {
    unsubscribe();
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

  function deleteStudent(id: number) {
    studentsStore.update(list => list.filter(s => s.id !== id));
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
    <table class="students-table">
      <thead>
        <tr>
          <th>NAME</th>
          <th>COURSE</th>
          <th>MENTOR</th>
          <th>ENROLLMENT DATE</th>
          <th>PAYMENT STATUS</th>
          <th>ACTIONS</th>
        </tr>
      </thead>
      <tbody>
        {#if filteredStudents.length === 0}
          <tr>
            <td colspan="6" class="empty-row">No students found.</td>
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
              <td class="course-text">{student.course}</td>
              <td class="mentor-text">{student.mentor}</td>
              <td class="date-text">{student.enrollmentDate}</td>
              <td>
                <span class="status-badge" class:paid={student.paymentStatus === 'Paid'} class:pending={student.paymentStatus === 'Pending'} class:overdue={student.paymentStatus === 'Overdue'}>
                  {student.paymentStatus}
                </span>
              </td>
              <td>
                <div class="actions-row">
                  <button class="action-icon-btn" title="View details"><Icon name="eye" size={14} /></button>
                  <button class="action-icon-btn" title="Edit student"><Icon name="edit" size={14} /></button>
                  <button class="action-icon-btn delete" onclick={() => deleteStudent(student.id)} title="Delete student"><Icon name="x" size={14} /></button>
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
        <button class="pag-btn">3</button>
        <span class="pag-dots">...</span>
        <button class="pag-btn">9</button>
        <button class="pag-btn next">▶</button>
      </div>
    </div>
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
