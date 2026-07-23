<script lang="ts">
  import Icon from '$lib/Icon.svelte';
  import { onMount } from 'svelte';
  import { apiGet, apiFetch, apiPost } from '$lib/api';
  import type { Student, Course } from '../dataStore';
  import SkeletonLoader from '$lib/SkeletonLoader.svelte';

  let students = $state<Student[]>([]);
  let courses = $state<Course[]>([]);
  let isLoading = $state(true);
  
  // Modals state
  let showAddModal = $state(false);
  let showEditModal = $state(false);

  // New Student state
  let newStudentName = $state('');
  let newStudentEmail = $state('');
  let newCourseId = $state<number | null>(null);

  // Edit Student state
  let editStudentId = $state<number | null>(null);
  let editName = $state('');
  let editEmail = $state('');
  let editCourseId = $state<number | null>(null);

  // Action state
  let isActionLoading = $state(false);
  let actionMessage = $state('');

  let searchQuery = $state('');

  // Derived filtered students
  let filteredStudents = $derived(
    students.filter(s => {
      const matchSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          s.email.toLowerCase().includes(searchQuery.toLowerCase());
      return matchSearch;
    })
  );

  onMount(async () => {
    try {
      const [usersData, coursesData] = await Promise.all([
        apiGet<any[]>('/admin/students').catch(() => []),
        apiGet<any[]>('/admin/courses').catch(() => [])
      ]);
      
      courses = (coursesData || []).map(c => ({
        id: c.id,
        name: c.title,
        description: c.description || '',
        price: c.price || ''
      }));

      if (usersData) {
        students = usersData.map(u => ({
          id: u.id,
          name: u.name,
          email: u.email,
          mentor_name: u.mentor_name,
          course_id: u.course_id,
          course_name: u.course_name
        }));
      }
    } catch {
      students = [];
    } finally {
      isLoading = false;
    }
  });

  function openAddModal() {
    showAddModal = true;
  }

  function closeAddModal() {
    showAddModal = false;
    newStudentName = '';
    newStudentEmail = '';
    newCourseId = null;
  }

  function openEditModal(student: Student) {
    editStudentId = student.id;
    editName = student.name;
    editEmail = student.email;
    editCourseId = student.course_id || null;
    showEditModal = true;
  }

  function closeEditModal() {
    showEditModal = false;
    editStudentId = null;
    editCourseId = null;
  }

  async function addStudent(e: SubmitEvent) {
    e.preventDefault();
    if (!newStudentName || !newStudentEmail) return;
    
    isActionLoading = true;
    actionMessage = 'Creating student...';
    try {
      const res = await apiPost<any>('/admin/users', {
        name: newStudentName,
        email: newStudentEmail,
        role: 'student'
      });
      const newId = res.id || Date.now();
      
      let assignedCourseName = undefined;
      if (newCourseId) {
        try {
          await apiPost('/admin/assign', { course_id: newCourseId, user_id: newId });
          assignedCourseName = courses.find(c => c.id === newCourseId)?.name;
        } catch (err) {
          console.warn('Failed to assign course:', err);
        }
      }

      const newStudent: Student = {
        id: newId,
        name: newStudentName,
        email: newStudentEmail,
        course_id: newCourseId || undefined,
        course_name: assignedCourseName
      };
      
      students = [...students, newStudent];
      closeAddModal();
    } catch (err) {
      alert('Failed to save student: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      isActionLoading = false;
    }
  }

  async function updateStudent(e: SubmitEvent) {
    e.preventDefault();
    if (!editStudentId || !editName || !editEmail) return;

    isActionLoading = true;
    actionMessage = 'Saving changes...';
    try {
      await apiFetch(`/admin/users/${editStudentId}`, {
        method: 'PUT',
        body: JSON.stringify({ name: editName, email: editEmail })
      });
      if (editCourseId) {
        await apiPost('/admin/assign', { course_id: editCourseId, user_id: editStudentId });
      }
    } catch (err) {
      console.warn('Backend update failed, updating locally:', err);
    }
    
    let assignedCourseName = courses.find(c => c.id === editCourseId)?.name;
    students = students.map(s => s.id === editStudentId ? { 
      ...s, 
      name: editName, 
      email: editEmail,
      course_id: editCourseId || undefined,
      course_name: assignedCourseName || s.course_name
    } : s);
    closeEditModal();
    isActionLoading = false;
  }

  async function deleteStudent(id: number) {
    if (!confirm('Are you sure you want to delete this student?')) return;
    
    isActionLoading = true;
    actionMessage = 'Deleting student...';
    try {
      await apiFetch(`/admin/users/${id}`, { method: 'DELETE' });
      students = students.filter(s => s.id !== id);
    } catch (err) {
      alert('Failed to delete student: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      isActionLoading = false;
    }
  }

  function getInitials(name: string) {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }
</script>

<div class="students-view">
  {#if isActionLoading}
    <div style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(255,255,255,0.7); z-index: 9999; display: flex; flex-direction: column; align-items: center; justify-content: center; font-weight: 600; color: #e53e3e; gap: 10px;">
      <div style="width: 30px; height: 30px; border: 3px solid rgba(229, 62, 62, 0.3); border-top-color: #e53e3e; border-radius: 50%; animation: spin 1s infinite linear;"></div>
      <div>{actionMessage}</div>
    </div>
  {/if}

  <div class="header-row">
    <div class="header-text">
      <h2>Students Directory</h2>
      <p>Manage enrolled students and their basic profiles.</p>
    </div>
    <button class="export-btn" onclick={openAddModal} style="background: var(--primary); color: white; border: none;">
      <span><Icon name="plus" size={16} /></span> Add Student
    </button>
  </div>

  {#if isLoading}
    <SkeletonLoader type="table" rows={5} cols={3} />
  {:else}
    <div class="filter-card">
      <div class="search-box">
        <Icon name="search" size={16} color="#718096" />
        <input type="text" placeholder="Search by name or email..." bind:value={searchQuery} />
      </div>
    </div>

    <div class="table-card">
      <table class="students-table">
        <thead>
          <tr>
            <th>STUDENT NAME</th>
            <th>EMAIL</th>
            <th>ASSIGNED COURSE</th>
            <th style="text-align: right;">ACTIONS</th>
          </tr>
        </thead>
        <tbody>
          {#if filteredStudents.length === 0}
            <tr>
              <td colspan="4" class="empty-row">No students found matching your search.</td>
            </tr>
          {:else}
            {#each filteredStudents as student}
              <tr>
                <td class="user-cell">
                  <div class="avatar-circle">{getInitials(student.name)}</div>
                  <div class="user-details">
                    <span class="name">{student.name}</span>
                  </div>
                </td>
                <td>
                  <span class="email">{student.email}</span>
                </td>
                <td>
                  <div style="display: flex; flex-direction: column; gap: 4px;">
                    <span style="font-weight: 600; font-size: 0.9rem; color: var(--text-main);">
                      {#if student.course_name}
                        {student.course_name}
                      {:else}
                        <span style="color: var(--text-muted); font-style: italic;">No course assigned</span>
                      {/if}
                    </span>
                    <span class="mentor" style="color: var(--text-muted); font-size: 0.75rem; background: #f7fafc; padding: 2px 6px; border-radius: 4px; display: inline-flex; align-items: center; gap: 4px; width: fit-content;">
                      {#if student.mentor_name}
                        <Icon name="user" size={10} /> Mentor: {student.mentor_name}
                      {:else}
                        No mentor
                      {/if}
                    </span>
                  </div>
                </td>
                <td style="text-align: right; display: flex; justify-content: flex-end; gap: 8px;">
                  <button onclick={() => openEditModal(student)} style="background: #ebf8ff; border: 1px solid #bee3f8; font-size: 0.8rem; font-weight: 600; cursor: pointer; padding: 6px 12px; color: #2b6cb0; border-radius: 6px; transition: all 0.2s;">Edit</button>
                  <button onclick={() => deleteStudent(student.id)} style="background: #fff5f5; border: 1px solid #fed7d7; font-size: 0.8rem; font-weight: 600; cursor: pointer; padding: 6px 12px; color: #e53e3e; border-radius: 6px; transition: all 0.2s;">Delete</button>
                </td>
              </tr>
            {/each}
          {/if}
        </tbody>
      </table>

      <div class="table-footer">
        <span class="results-count">Showing {filteredStudents.length} students</span>
      </div>
    </div>
  {/if}

  <!-- Edit Modal Overlay -->
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
          <div class="form-group" style="display: flex; flex-direction: column; gap: 6px;">
            <label for="edit-course" style="font-weight: 600; font-size: 0.85rem; color: #4a5568;">Assign Course</label>
            <select id="edit-course" bind:value={editCourseId} style="padding: 8px; border: 1px solid #cbd5e0; border-radius: 4px; background: white;">
              <option value={null}>-- Select a Course --</option>
              {#each courses as course}
                <option value={course.id}>{course.name}</option>
              {/each}
            </select>
          </div>
          <div class="modal-actions" style="display: flex; justify-content: flex-end; gap: 12px; margin-top: 8px;">
            <button type="button" class="cancel-btn" onclick={closeEditModal} style="padding: 8px 16px; border: 1px solid #cbd5e0; border-radius: 4px; background: white; cursor: pointer;">Cancel</button>
            <button type="submit" class="submit-btn" style="padding: 8px 16px; border: none; border-radius: 4px; background: #e53e3e; color: white; cursor: pointer; font-weight: 600;">Save Changes</button>
          </div>
        </form>
      </div>
    </div>
  {/if}

  <!-- Add Modal Overlay -->
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
            <label for="new-course" style="font-weight: 600; font-size: 0.85rem; color: #4a5568;">Assign Course</label>
            <select id="new-course" bind:value={newCourseId} style="padding: 8px; border: 1px solid #cbd5e0; border-radius: 4px; background: white;">
              <option value={null}>-- Select a Course --</option>
              {#each courses as course}
                <option value={course.id}>{course.name}</option>
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

<style>
  @keyframes spin { to { transform: rotate(360deg); } }
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
    background-color: var(--primary-hover) !important;
  }

  .filter-card {
    background-color: var(--bg-card);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-md);
    padding: 16px;
    display: flex;
    align-items: center;
    box-shadow: var(--shadow-sm);
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
</style>
