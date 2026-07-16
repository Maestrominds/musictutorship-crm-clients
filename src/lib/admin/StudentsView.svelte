<script lang="ts">
  import Icon from '$lib/Icon.svelte';
  import { onMount } from 'svelte';
  import { apiGet, apiFetch, apiPost } from '$lib/api';
  import type { Student } from '../dataStore';

  let students = $state<Student[]>([]);
  let isLoading = $state(true);

  // Helper to extract string from pgtype objects or raw values
  function safeString(val: any): string {
    if (!val) return '';
    if (typeof val === 'object') {
      if ('String' in val) return val.String;
      if ('Time' in val) return val.Time;
    }
    return String(val);
  }

  let coursesList = $state<{ id: number; title: string }[]>([]);
  let selectedCourseId = $state<number | null>(null);

  onMount(async () => {
    try {
      const data = await apiGet<any[]>('/admin/students');
      students = (data || []).map(s => ({
        id: s.id,
        name: s.name,
        email: s.email,
        course_title: safeString(s.course_title),
        mentor_name: s.mentor_name || '',
        enrolled_at: s.enrolled_at ? safeString(s.enrolled_at) : ''
      }));
    } catch {
      students = [];
    }

    try {
      const coursesData = await apiGet<any[]>('/admin/courses');
      coursesList = (coursesData || []).map(c => ({ id: c.id, title: c.title }));
      if (coursesList.length > 0) {
        selectedCourseId = coursesList[0].id;
      }
    } catch (err) {
      console.error('Failed to load courses in StudentsView:', err);
    } finally {
      isLoading = false;
    }
  });

  let searchQuery = $state('');
  let filteredStudents = $derived(
    students.filter(student => {
      const matchSearch = student.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          student.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (student.course_title || student.course || '').toLowerCase().includes(searchQuery.toLowerCase());
      return matchSearch;
    })
  );

  function getInitials(name: string) {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 1);
  }

  // Add states
  let showAddModal = $state(false);
  let newStudentName = $state('');
  let newStudentEmail = $state('');
  let isSubmitting = $state(false);

  function openAddModal() { showAddModal = true; }
  function closeAddModal() { showAddModal = false; newStudentName = ''; newStudentEmail = ''; }

  async function addStudent(e: SubmitEvent) {
    e.preventDefault();
    if (!newStudentName || !newStudentEmail) return;
    isSubmitting = true;
    try {
      // 1. Create the student user
      const res = await apiPost<any>('/admin/users', {
        name: newStudentName,
        email: newStudentEmail,
        role: 'student'
      });
      const userId = res.id;

      // 2. Assign selected course to student
      let courseTitle = '';
      if (selectedCourseId && userId) {
        try {
          await apiPost('/admin/assign', {
            user_id: userId,
            course_id: selectedCourseId
          });
          const matchedCourse = coursesList.find(c => c.id === selectedCourseId);
          if (matchedCourse) {
            courseTitle = matchedCourse.title;
          }
        } catch (err) {
          console.error('User created, but course assignment failed:', err);
        }
      }

      students = [{
        id: userId || Date.now(),
        name: newStudentName,
        email: newStudentEmail,
        course_title: courseTitle,
        mentor_name: '',
        enrolled_at: new Date().toISOString()
      }, ...students];
      closeAddModal();
    } catch (err) {
      alert('Failed to add student: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      isSubmitting = false;
    }
  }

  // Edit states
  let showEditModal = $state(false);
  let editStudentId = $state<number | null>(null);
  let editName = $state('');
  let editEmail = $state('');

  function openEditModal(student: any) {
    editStudentId = student.id;
    editName = student.name;
    editEmail = student.email;
    showEditModal = true;
  }
  function closeEditModal() { showEditModal = false; editStudentId = null; }

  async function updateStudent(e: SubmitEvent) {
    e.preventDefault();
    if (!editStudentId || !editName || !editEmail) return;
    try {
      await apiFetch(`/admin/users/${editStudentId}`, {
        method: 'PUT',
        body: JSON.stringify({ name: editName, email: editEmail })
      });
      students = students.map(s => s.id === editStudentId ? { ...s, name: editName, email: editEmail } : s);
      closeEditModal();
    } catch (err) {
      alert('Failed to update student: ' + (err instanceof Error ? err.message : String(err)));
    }
  }

  async function removeStudent(id: number) {
    if (!confirm('Are you sure you want to delete this student?')) return;
    try {
      await apiFetch(`/admin/users/${id}`, { method: 'DELETE' });
      students = students.filter(s => s.id !== id);
    } catch (err) {
      alert('Failed to delete student: ' + (err instanceof Error ? err.message : String(err)));
    }
  }
</script>

<div class="students-view">
  <div class="header-row">
    <div class="header-text">
      <h2>Students Management</h2>
      <p>View and manage all enrolled students in the academy.</p>
    </div>
    <div class="header-actions" style="display: flex; gap: 12px; align-items: center;">
      <button class="export-btn">
        <span><Icon name="file" size={14} /></span> Export
      </button>
      <button class="add-student-btn" onclick={openAddModal} style="background-color: var(--primary); color: white; border: none; border-radius: var(--radius-md); padding: 10px 18px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 8px; box-shadow: 0 4px 12px rgba(229, 62, 62, 0.2);">
        <span><Icon name="plus" size={14} /></span> Add Student
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
          <th>ACTIONS</th>
        </tr>
      </thead>
      <tbody>
        {#if filteredStudents.length === 0}
          <tr>
            <td colspan="6" class="empty-row" style="text-align:center;padding:24px;color:#999;">
              No students found.
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
              <td>
                <div style="display: flex; gap: 8px;">
                  <button onclick={() => openEditModal(student)} style="background: none; border: none; cursor: pointer; padding: 4px;" title="Edit student">
                    <Icon name="edit" size={14} />
                  </button>
                  <button onclick={() => removeStudent(student.id)} style="background: none; border: none; cursor: pointer; padding: 4px; color: #e53e3e;" title="Delete student">
                    <Icon name="x" size={14} />
                  </button>
                </div>
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

    <!-- Edit Student Modal -->
    {#if showEditModal}
      <div class="modal-overlay" onclick={closeEditModal} aria-hidden="true" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 100;">
        <div class="modal-content" onclick={(e) => e.stopPropagation()} role="dialog" style="background: white; padding: 24px; border-radius: 8px; width: 400px; box-shadow: 0 4px 20px rgba(0,0,0,0.15);">
          <div class="modal-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
            <h3 style="margin: 0; font-size: 1.2rem;">Edit Student Profile</h3>
            <button class="close-btn" onclick={closeEditModal} style="background: none; border: none; font-size: 1.5rem; cursor: pointer;">&times;</button>
          </div>
          <form onsubmit={updateStudent} class="modal-form" style="display: flex; flex-direction: column; gap: 16px;">
            <div class="form-group" style="display: flex; flex-direction: column; gap: 6px;">
              <label for="edit-student-name" style="font-weight: 600; font-size: 0.85rem; color: #4a5568;">Full Name</label>
              <input type="text" id="edit-student-name" bind:value={editName} style="padding: 8px; border: 1px solid #cbd5e0; border-radius: 4px;" required />
            </div>
            <div class="form-group" style="display: flex; flex-direction: column; gap: 6px;">
              <label for="edit-student-email" style="font-weight: 600; font-size: 0.85rem; color: #4a5568;">Email Address</label>
              <input type="email" id="edit-student-email" bind:value={editEmail} style="padding: 8px; border: 1px solid #cbd5e0; border-radius: 4px;" required />
            </div>
            <div class="modal-actions" style="display: flex; justify-content: flex-end; gap: 12px; margin-top: 8px;">
              <button type="button" class="cancel-btn" onclick={closeEditModal} style="padding: 8px 16px; border: 1px solid #cbd5e0; border-radius: 4px; background: white; cursor: pointer;">Cancel</button>
              <button type="submit" class="submit-btn" style="padding: 8px 16px; border: none; border-radius: 4px; background: #e53e3e; color: white; cursor: pointer; font-weight: 600;">Save Changes</button>
            </div>
          </form>
        </div>
      </div>
    {/if}

    <!-- Add Student Modal -->
    {#if showAddModal}
      <div class="modal-overlay" onclick={closeAddModal} aria-hidden="true" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 100;">
        <div class="modal-content" onclick={(e) => e.stopPropagation()} role="dialog" style="background: white; padding: 24px; border-radius: 8px; width: 400px; box-shadow: 0 4px 20px rgba(0,0,0,0.15);">
          <div class="modal-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
            <h3 style="margin: 0; font-size: 1.2rem;">Add New Student</h3>
            <button class="close-btn" onclick={closeAddModal} style="background: none; border: none; font-size: 1.5rem; cursor: pointer;">&times;</button>
          </div>
          <form onsubmit={addStudent} class="modal-form" style="display: flex; flex-direction: column; gap: 16px;">
            <div class="form-group" style="display: flex; flex-direction: column; gap: 6px;">
              <label for="new-student-name" style="font-weight: 600; font-size: 0.85rem; color: #4a5568;">Full Name</label>
              <input type="text" id="new-student-name" bind:value={newStudentName} placeholder="John Doe" style="padding: 8px; border: 1px solid #cbd5e0; border-radius: 4px;" required />
            </div>
            <div class="form-group" style="display: flex; flex-direction: column; gap: 6px;">
              <label for="new-student-email" style="font-weight: 600; font-size: 0.85rem; color: #4a5568;">Email Address</label>
              <input type="email" id="new-student-email" bind:value={newStudentEmail} placeholder="john@example.com" style="padding: 8px; border: 1px solid #cbd5e0; border-radius: 4px;" required />
            </div>
            <div class="form-group" style="display: flex; flex-direction: column; gap: 6px;">
              <label for="new-student-course" style="font-weight: 600; font-size: 0.85rem; color: #4a5568;">Assign Course</label>
              <select id="new-student-course" bind:value={selectedCourseId} style="padding: 8px; border: 1px solid #cbd5e0; border-radius: 4px; background: white;">
                <option value={null}>None (Create without Course)</option>
                {#each coursesList as course}
                  <option value={course.id}>{course.title}</option>
                {/each}
              </select>
            </div>
            <div class="modal-actions" style="display: flex; justify-content: flex-end; gap: 12px; margin-top: 8px;">
              <button type="button" class="cancel-btn" onclick={closeAddModal} style="padding: 8px 16px; border: 1px solid #cbd5e0; border-radius: 4px; background: white; cursor: pointer;">Cancel</button>
              <button type="submit" class="submit-btn" style="padding: 8px 16px; border: none; border-radius: 4px; background: #e53e3e; color: white; cursor: pointer; font-weight: 600;">Save Student</button>
            </div>
          </form>
        </div>
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
