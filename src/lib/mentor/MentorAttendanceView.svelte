<script lang="ts">
  import Icon from '$lib/Icon.svelte';
  import { onMount } from 'svelte';
  import { apiGet, apiPost } from '$lib/api';

  interface AttendanceRecord {
    id: number;
    studentName: string;
    course: string;
    classDate: string;
    status: 'Present' | 'Absent' | 'Excused';
  }

  let records = $state<AttendanceRecord[]>([]);
  let isLoading = $state(true);
  let errorMsg = $state('');

  let showMarkModal = $state(false);
  let newClassId = $state(0);
  let newStudentId = $state(0);
  let newStatus = $state<'present' | 'absent' | 'excused'>('present');
  let isSubmitting = $state(false);
  let submitError = $state('');

  // NOTE: GET /api/mentor/attendance is not yet implemented. See backend_dev_todo.md #10
  onMount(async () => {
    try {
      const data = await apiGet<any[]>('/mentor/attendance');
      records = (data || []).map(r => ({
        id: r.id,
        studentName: r.student_name || 'Student',
        course: r.course_title || 'Music Course',
        classDate: r.class_date ? new Date(r.class_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A',
        status: (r.status.charAt(0).toUpperCase() + r.status.slice(1)) as 'Present' | 'Absent' | 'Excused'
      }));
    } catch (err) {
      // Endpoint not yet available — show empty list
      errorMsg = '';
    } finally {
      isLoading = false;
    }
  });

  function openModal() { showMarkModal = true; }
  function closeModal() { showMarkModal = false; submitError = ''; }

  async function addRecord(e: SubmitEvent) {
    e.preventDefault();
    isSubmitting = true;
    submitError = '';
    try {
      await apiPost('/mentor/attendance', {
        class_id: newClassId,
        student_id: newStudentId,
        status: newStatus
      });
      // Optimistically add to local list
      records = [{
        id: Date.now(),
        studentName: `Student #${newStudentId}`,
        course: `Class #${newClassId}`,
        classDate: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        status: (newStatus.charAt(0).toUpperCase() + newStatus.slice(1)) as 'Present' | 'Absent' | 'Excused'
      }, ...records];
      closeModal();
    } catch (err) {
      submitError = err instanceof Error ? err.message : 'Failed to mark attendance';
    } finally {
      isSubmitting = false;
    }
  }

  function getInitials(name: string) {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }
</script>

<div class="attendance-view">
  <div class="header-row">
    <div class="header-text">
      <h2>Attendance</h2>
      <p>Manage and track student presence across your music classes.</p>
    </div>
  </div>

  <!-- Stats row -->
  <!-- NOTE: GET /api/mentor/stats required for real stats — see backend_dev_todo.md #11 -->
  <div class="stats-row">
    <div class="stat-card">
      <div class="value">{records.filter(r => r.status === 'Present').length || '—'}</div>
      <span class="label">Total Present</span>
    </div>
    
    <div class="stat-card">
      <div class="value">{records.filter(r => r.status === 'Absent').length || '—'}</div>
      <span class="label">Total Absent</span>
    </div>

    <div class="stat-card">
      <div class="value">{records.filter(r => r.status === 'Excused').length || '—'}</div>
      <span class="label">Excused</span>
    </div>
  </div>

  <div class="table-card">
    <div class="table-header-row">
      <h3>Recent Class Attendance</h3>
      <div class="actions">
        <button class="filter-btn"><Icon name="filter" size={14} /> Filter</button>
        <button class="mark-btn" onclick={openModal}>+ Mark New</button>
      </div>
    </div>

    <table class="attendance-table">
      <thead>
        <tr>
          <th>STUDENT NAME</th>
          <th>COURSE</th>
          <th>CLASS DATE</th>
          <th>STATUS</th>
          <th>ACTIONS</th>
        </tr>
      </thead>
      <tbody>
        {#if isLoading}
          <tr><td colspan="5" style="text-align:center;padding:24px;color:#999;">Loading attendance records...</td></tr>
        {:else if records.length === 0}
          <tr><td colspan="5" style="text-align:center;padding:24px;color:#999;">No attendance records yet. Mark a new record above.</td></tr>
        {/if}
        {#each records as record}
          <tr>
            <td class="student-cell">
              <div class="avatar-circle">{getInitials(record.studentName)}</div>
              <span class="name">{record.studentName}</span>
            </td>
            <td class="course-text">{record.course}</td>
            <td class="date-text">{record.classDate}</td>
            <td>
              <span class="status-badge" class:present={record.status === 'Present'} class:absent={record.status === 'Absent'} class:excused={record.status === 'Excused'}>
                {record.status}
              </span>
            </td>
            <td>
              <div class="actions-row">
                <button class="action-btn" title="Edit status"><Icon name="edit" size={14} /></button>
                <button class="action-btn" title="More options">•••</button>
              </div>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>

    <div class="table-footer">
      <span class="results-count">Showing 1 to {records.length} of 128 results</span>
      <div class="pagination">
        <button class="pag-btn font-weight-bold">Previous</button>
        <button class="pag-btn active">Next</button>
      </div>
    </div>
  </div>

  <!-- Mark Attendance Modal -->
  {#if showMarkModal}
    <div class="modal-overlay" onclick={closeModal} aria-hidden="true">
      <div class="modal-content" onclick={(e) => e.stopPropagation()} role="dialog">
        <div class="modal-header">
          <h3>Mark Student Attendance</h3>
          <button class="close-btn" onclick={closeModal}>&times;</button>
        </div>
        <form onsubmit={addRecord} class="modal-form">
          <div class="form-group">
            <label for="student-select">Student Name</label>
            <select id="student-select" bind:value={newStudent}>
              <option value="Benjamin Chen">Benjamin Chen</option>
              <option value="Elena Rodriguez">Elena Rodriguez</option>
              <option value="Marcus Thompson">Marcus Thompson</option>
              <option value="Sarah Jenkins">Sarah Jenkins</option>
              <option value="Leo Vance">Leo Vance</option>
            </select>
          </div>
          <div class="form-group">
            <label for="course-select">Course</label>
            <select id="course-select" bind:value={newCourse}>
              <option value="Classical Piano II">Classical Piano II</option>
              <option value="Music Theory Basics">Music Theory Basics</option>
              <option value="Jazz Improvisation">Jazz Improvisation</option>
            </select>
          </div>
          <div class="form-group">
            <label for="status-select">Status</label>
            <select id="status-select" bind:value={newStatus}>
              <option value="Present">Present</option>
              <option value="Absent">Absent</option>
              <option value="Excused">Excused</option>
            </select>
          </div>
          <div class="modal-actions">
            <button type="button" class="cancel-btn" onclick={closeModal}>Cancel</button>
            <button type="submit" class="submit-btn">Save Record</button>
          </div>
        </form>
      </div>
    </div>
  {/if}
</div>

<style>
  .attendance-view {
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

  /* Stats Row */
  .stats-row {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 20px;
  }

  .stat-card {
    background-color: var(--bg-card);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-md);
    padding: 20px;
    box-shadow: var(--shadow-sm);
    display: flex;
    flex-direction: column;
    gap: 4px;
    position: relative;
  }

  .stat-card .trend {
    font-size: 0.75rem;
    font-weight: 700;
    padding: 2px 8px;
    border-radius: var(--radius-full);
    width: fit-content;
  }

  .stat-card .trend.positive { background-color: #f0fff4; color: #38a169; }
  .stat-card .trend.negative { background-color: #fff5f5; color: #e53e3e; }

  .stat-card .value {
    font-size: 1.8rem;
    font-weight: 700;
    color: var(--text-main);
    margin-top: 8px;
  }

  .stat-card .label {
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

  .table-header-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px;
    border-bottom: 1px solid var(--border-color);
  }

  .table-header-row h3 {
    font-size: 0.95rem;
    font-weight: 700;
    color: var(--text-main);
  }

  .table-header-row .actions {
    display: flex;
    gap: 10px;
  }

  .filter-btn {
    border: 1px solid var(--border-color);
    background: transparent;
    padding: 8px 16px;
    font-size: 0.85rem;
    font-weight: 600;
    border-radius: var(--radius-sm);
    cursor: pointer;
    color: var(--text-main);
  }

  .mark-btn {
    background-color: var(--primary);
    color: white;
    border: none;
    padding: 8px 18px;
    font-size: 0.85rem;
    font-weight: 600;
    border-radius: var(--radius-sm);
    cursor: pointer;
    box-shadow: 0 4px 10px rgba(229, 62, 62, 0.2);
  }

  .attendance-table {
    width: 100%;
    border-collapse: collapse;
    text-align: left;
  }

  .attendance-table th {
    font-size: 0.75rem;
    font-weight: 700;
    color: var(--text-muted);
    padding: 14px 20px;
    border-bottom: 1px solid var(--border-color);
    background-color: #fafbfc;
  }

  .attendance-table td {
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
    background-color: #edf2f7;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.75rem;
    font-weight: 700;
    color: var(--text-muted);
  }

  .student-cell .name {
    font-weight: 700;
    color: var(--text-main);
  }

  .course-text {
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

  .status-badge.present { background-color: #c6f6d5; color: #22543d; }
  .status-badge.absent { background-color: #fed7d7; color: #9b2c2c; }
  .status-badge.excused { background-color: #ebf8ff; color: #2b6cb0; }

  .actions-row {
    display: flex;
    gap: 12px;
  }

  .action-btn {
    border: none;
    background: transparent;
    cursor: pointer;
    font-size: 0.95rem;
    color: var(--text-muted);
  }

  /* Table Footer styling */
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
    gap: 8px;
  }

  .pag-btn {
    border: 1px solid var(--border-color);
    background-color: var(--bg-card);
    color: var(--text-main);
    padding: 6px 16px;
    font-size: 0.8rem;
    font-weight: 700;
    border-radius: var(--radius-sm);
    cursor: pointer;
  }

  .pag-btn.active {
    border-color: var(--primary);
    color: var(--primary);
  }

  /* Modal */
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.4);
    backdrop-filter: blur(4px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }

  .modal-content {
    background-color: var(--bg-card);
    width: 100%;
    max-width: 480px;
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-lg);
    overflow: hidden;
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px 24px;
    border-bottom: 1px solid var(--border-color);
  }

  .modal-header h3 {
    font-size: 1.15rem;
    font-weight: 700;
    color: var(--text-main);
  }

  .close-btn {
    border: none;
    background: transparent;
    font-size: 1.5rem;
    color: var(--text-muted);
    cursor: pointer;
  }

  .modal-form {
    padding: 24px;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .modal-form label {
    font-size: 0.85rem;
    font-weight: 600;
    color: var(--text-main);
  }

  .modal-form select {
    padding: 10px 14px;
    border: 1px solid var(--border-color);
    border-radius: var(--radius-md);
    background-color: #f8fafc;
    color: var(--text-main);
    outline: none;
    font-size: 0.9rem;
    width: 100%;
  }

  .modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    margin-top: 12px;
  }

  .cancel-btn {
    padding: 10px 16px;
    border: 1px solid var(--border-color);
    background: transparent;
    color: var(--text-muted);
    font-weight: 600;
    border-radius: var(--radius-md);
    cursor: pointer;
  }

  .modal-actions .submit-btn {
    padding: 10px 20px;
    border: none;
    background-color: var(--primary);
    color: white;
    font-weight: 600;
    border-radius: var(--radius-md);
    cursor: pointer;
    box-shadow: 0 4px 10px rgba(229, 62, 62, 0.2);
  }
</style>
