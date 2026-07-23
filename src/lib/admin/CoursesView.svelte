<script lang="ts">
  import Icon from '$lib/Icon.svelte';
  import { onMount } from 'svelte';
  import { apiGet, apiPost, apiFetch } from '$lib/api';
  import type { Course, Mentor } from '../dataStore';
  import SkeletonLoader from '$lib/SkeletonLoader.svelte';

  let courses = $state<Course[]>([]);
  let mentorsList = $state<Mentor[]>([]);
  let isLoading = $state(true);
  let isSubmitting = $state(false);

  function formatPrice(val: any): string {
    if (!val) return '0.00';
    if (typeof val === 'object') {
      if ('Int' in val && 'Exp' in val) {
        const exp = val.Exp;
        const intVal = val.Int ? Number(val.Int) : 0;
        return (intVal * Math.pow(10, exp)).toFixed(2);
      }
    }
    const num = Number(val);
    return isNaN(num) ? '0.00' : num.toFixed(2);
  }

  onMount(async () => {
    try {
      const [coursesData, mentorsData] = await Promise.all([
        apiGet<any[]>('/admin/courses'),
        apiGet<any[]>('/admin/mentors')
      ]);
      mentorsList = (mentorsData || []).map(m => ({
        id: m.id,
        name: m.name,
        role: 'mentor',
        email: m.email
      }));
      courses = (coursesData || []).map(c => ({
        id: c.id,
        name: c.title,
        description: c.description,
        price: `$${formatPrice(c.price)}/mo`,
        duration: c.duration,
        mentor_name: c.mentor_name,
        mentor_id: c.mentor_id
      }));
    } catch {
      courses = [];
    } finally {
      isLoading = false;
    }
  });

  let showModal = $state(false);
  let newName = $state('');
  let newDescription = $state('');
  let newPrice = $state('150');
  let newDuration = $state('');
  let newMentorId = $state<number | ''>('');
  let newThumbnailFile = $state<File | null>(null);
  let submitError = $state('');
  let isActionLoading = $state(false);
  let actionMessage = $state('');

  // Edit states
  let showEditModal = $state(false);
  let editCourseId = $state<number | null>(null);
  let editName = $state('');
  let editDescription = $state('');
  let editPrice = $state('150');
  let editDuration = $state('');
  let editMentorId = $state<number | ''>('');

  function openModal() { showModal = true; }
  function closeModal() { showModal = false; newName = ''; newDescription = ''; newDuration = ''; newMentorId = ''; newThumbnailFile = null; submitError = ''; }

  function openEditModal(course: Course) {
    editCourseId = course.id;
    editName = course.name;
    editDescription = course.description;
    editPrice = course.price.replace(/[^0-9.]/g, '');
    editDuration = course.duration || '';
    const foundMentor = mentorsList.find(m => m.name === course.mentor_name);
    editMentorId = course.mentor_id || (foundMentor ? foundMentor.id : '');
    showEditModal = true;
  }
  function closeEditModal() { showEditModal = false; editCourseId = null; submitError = ''; }

  async function createCourse(e: SubmitEvent) {
    e.preventDefault();
    if (!newName || !newDescription) return;
    
    if (newMentorId) {
      const isMentorAlreadyAssigned = courses.some(c => c.mentor_id === Number(newMentorId));
      if (isMentorAlreadyAssigned) {
        submitError = 'This mentor is already assigned to another course. A mentor can only teach one course.';
        return;
      }
    }

    isSubmitting = true;
    isActionLoading = true;
    actionMessage = 'Creating course...';
    submitError = '';
    try {
      let finalThumbnailUrl = '';
      if (newThumbnailFile) {
        actionMessage = 'Uploading thumbnail...';
        try {
          const urlRes = await apiPost<any>('/admin/courses/upload-url', { filename: newThumbnailFile.name });
          if (urlRes.upload_url) {
            await fetch(urlRes.upload_url, {
              method: 'PUT',
              body: newThumbnailFile,
              headers: { 'Content-Type': newThumbnailFile.type }
            });
            finalThumbnailUrl = urlRes.upload_url.split('?')[0];
          }
        } catch (uploadErr) {
          console.warn('Thumbnail upload failed (possibly CORS in dev):', uploadErr);
        }
      }

      actionMessage = 'Creating course...';
      const newCourseRes = await apiPost<any>('/admin/courses', {
        title: newName,
        description: newDescription,
        price: String(newPrice),
        duration: newDuration,
        thumbnail_url: finalThumbnailUrl
      });
      
      const newCourseId = newCourseRes.id || Date.now();

      if (newMentorId) {
        actionMessage = 'Assigning mentor...';
        try {
           await apiPost<any>('/admin/assign', { course_id: newCourseId, user_id: Number(newMentorId) });
        } catch(assignErr) {
           console.warn('Failed to assign mentor:', assignErr);
        }
      }

      const assignedMentor = mentorsList.find(m => m.id === Number(newMentorId));

      courses = [...courses, {
        id: newCourseId,
        name: newName,
        description: newDescription,
        price: `$${newPrice}/mo`,
        duration: newDuration,
        mentor_name: assignedMentor ? assignedMentor.name : undefined,
        mentor_id: newMentorId ? Number(newMentorId) : undefined
      }];
      closeModal();
    } catch (err) {
      submitError = err instanceof Error ? err.message : 'Failed to create course';
    } finally {
      isSubmitting = false;
      isActionLoading = false;
    }
  }

  async function updateCourse(e: SubmitEvent) {
    e.preventDefault();
    if (!editCourseId || !editName || !editDescription) return;

    if (editMentorId) {
      const isMentorAlreadyAssigned = courses.some(c => c.mentor_id === Number(editMentorId) && c.id !== editCourseId);
      if (isMentorAlreadyAssigned) {
        submitError = 'This mentor is already assigned to another course. A mentor can only teach one course.';
        return;
      }
    }

    isSubmitting = true;
    isActionLoading = true;
    actionMessage = 'Saving changes...';
    submitError = '';
    try {
      await apiFetch(`/admin/courses/${editCourseId}`, {
        method: 'PUT',
        body: JSON.stringify({
          title: editName,
          description: editDescription,
          price: String(editPrice),
          duration: editDuration
        })
      });

      if (editMentorId) {
        actionMessage = 'Updating mentor assignment...';
        try {
           await apiPost<any>('/admin/assign', { course_id: editCourseId, user_id: Number(editMentorId) });
        } catch(assignErr) {
           console.warn('Failed to assign mentor:', assignErr);
        }
      }
    } catch (err) {
      console.warn('Backend update failed, updating locally:', err);
    }

    const assignedMentor = mentorsList.find(m => m.id === Number(editMentorId));

    courses = courses.map(c => c.id === editCourseId ? {
      ...c,
      name: editName,
      description: editDescription,
      price: `$${editPrice}/mo`,
      duration: editDuration,
      mentor_name: editMentorId ? (assignedMentor ? assignedMentor.name : c.mentor_name) : c.mentor_name,
      mentor_id: editMentorId ? Number(editMentorId) : c.mentor_id
    } : c);
    closeEditModal();
    isSubmitting = false;
    isActionLoading = false;
  }

  async function removeCourse(id: number) {
    if (!confirm('Are you sure you want to delete this course?')) return;
    isActionLoading = true;
    actionMessage = 'Deleting course...';
    try {
      await apiFetch(`/admin/courses/${id}`, { method: 'DELETE' });
      courses = courses.filter(c => c.id !== id);
    } catch (err) {
      alert('Failed to delete course: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      isActionLoading = false;
    }
  }
</script>

<div class="courses-view">
  {#if isActionLoading}
    <div style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(255,255,255,0.7); z-index: 9999; display: flex; flex-direction: column; align-items: center; justify-content: center; font-weight: 600; color: #e53e3e; gap: 10px;">
      <div style="width: 30px; height: 30px; border: 3px solid rgba(229, 62, 62, 0.3); border-top-color: #e53e3e; border-radius: 50%; animation: spin 1s infinite linear;"></div>
      <div>{actionMessage}</div>
    </div>
  {/if}

  <div class="header-row">
    <div class="header-text">
      <h2>Curriculum & Courses</h2>
      <p>Manage the music programs and courses offered at your academy.</p>
    </div>
  </div>

  {#if isLoading}
    <div class="courses-grid">
      <SkeletonLoader type="card" rows={1} cols={4} />
    </div>
  {:else}
    <div class="courses-grid">
      <!-- Create New Course Card -->
      <button class="create-course-card" onclick={openModal}>
        <div class="plus-icon">+</div>
        <h3>Create New Course</h3>
        <p>Add a new program to your curriculum</p>
      </button>

      <!-- Existing Courses -->
      {#each courses as course}
        <div class="course-card">
          <div class="card-image-placeholder">
            <div class="piano-keys">
              <div class="white-key"></div><div class="white-key"></div><div class="white-key"></div><div class="white-key"></div>
              <div class="black-key k1"></div><div class="black-key k2"></div><div class="black-key k3"></div>
            </div>
          </div>
          <div class="card-body">
            <h3 class="course-title">{course.name}</h3>
            <p class="course-description">{course.description}</p>
            <div class="course-meta">
              <span class="meta-tag price">{course.price}</span>
              {#if course.duration}
                <span class="meta-tag duration" style="background-color: #ebf8ff; color: #2b6cb0; display: flex; align-items: center; gap: 4px;"><Icon name="clock" size={12} /> {course.duration}</span>
              {/if}
              {#if course.mentor_name}
                <span class="meta-tag mentor" style="background-color: #faf5ff; color: #805ad5; display: flex; align-items: center; gap: 4px;"><Icon name="user" size={12} /> {course.mentor_name}</span>
              {/if}
            </div>
            <div class="course-footer">
              <div class="actions">
                <button class="action-btn" title="Edit Course" onclick={() => openEditModal(course)}><Icon name="edit" size={16} /></button>
                <button class="action-btn delete" title="Delete Course" onclick={() => removeCourse(course.id)}><Icon name="trash" size={16} /></button>
              </div>
            </div>
          </div>
        </div>
      {/each}
    </div>
  {/if}

  <!-- Add Modal Overlay -->
  {#if showModal}
    <div class="modal-overlay" onclick={closeModal} aria-hidden="true">
      <div class="modal-content" onclick={(e) => e.stopPropagation()} role="dialog">
        <div class="modal-header">
          <h3>Create New Course</h3>
          <button class="close-btn" onclick={closeModal}>&times;</button>
        </div>
        <form onsubmit={createCourse} class="modal-form">
          <div class="form-group">
            <label for="course-name">Course Title</label>
            <input type="text" id="course-name" bind:value={newName} placeholder="e.g. Violin Intermediate" required />
          </div>
          <div class="form-group">
            <label for="course-desc">Description</label>
            <textarea id="course-desc" bind:value={newDescription} placeholder="Describe the course curriculum..." rows="3" required></textarea>
          </div>
          <div class="form-group">
            <label for="course-thumbnail">Course Thumbnail</label>
            <input type="file" id="course-thumbnail" accept="image/*" onchange={(e) => { newThumbnailFile = e.currentTarget.files?.[0] || null; }} />
          </div>
          <div class="form-group">
            <label for="course-price">Price</label>
            <input type="text" id="course-price" bind:value={newPrice} required />
          </div>
          <div class="form-group">
            <label for="course-duration">Duration</label>
            <input type="text" id="course-duration" bind:value={newDuration} placeholder="e.g. 12 weeks" />
          </div>
          <div class="form-group">
            <label for="course-mentor">Assign Mentor</label>
            <select id="course-mentor" bind:value={newMentorId} class="select-input">
              <option value="">-- No Mentor Assigned --</option>
              {#each mentorsList as mentor}
                <option value={mentor.id}>{mentor.name}</option>
              {/each}
            </select>
          </div>
          {#if submitError}
            <div class="error-message" style="color: #e53e3e; margin-bottom: 12px; font-size: 0.9rem; font-weight: 500;">
              {submitError}
            </div>
          {/if}
          <div class="modal-actions">
            <button type="button" class="cancel-btn" onclick={closeModal}>Cancel</button>
            <button type="submit" class="submit-btn">Save Course</button>
          </div>
        </form>
      </div>
    </div>
  {/if}

  <!-- Edit Modal Overlay -->
  {#if showEditModal}
    <div class="modal-overlay" onclick={closeEditModal} aria-hidden="true">
      <div class="modal-content" onclick={(e) => e.stopPropagation()} role="dialog">
        <div class="modal-header">
          <h3>Edit Course</h3>
          <button class="close-btn" onclick={closeEditModal}>&times;</button>
        </div>
        <form onsubmit={updateCourse} class="modal-form">
          <div class="form-group">
            <label for="edit-course-name">Course Title</label>
            <input type="text" id="edit-course-name" bind:value={editName} required />
          </div>
          <div class="form-group">
            <label for="edit-course-desc">Description</label>
            <textarea id="edit-course-desc" bind:value={editDescription} rows="3" required></textarea>
          </div>
          <div class="form-group">
            <label for="edit-course-price">Price</label>
            <input type="text" id="edit-course-price" bind:value={editPrice} required />
          </div>
          <div class="form-group">
            <label for="edit-course-duration">Duration</label>
            <input type="text" id="edit-course-duration" bind:value={editDuration} placeholder="e.g. 12 weeks" />
          </div>
          <div class="form-group">
            <label for="edit-course-mentor">Assign Mentor</label>
            <select id="edit-course-mentor" bind:value={editMentorId} class="select-input">
              <option value="">-- No Mentor Assigned --</option>
              {#each mentorsList as mentor}
                <option value={mentor.id}>{mentor.name}</option>
              {/each}
            </select>
          </div>
          {#if submitError}
            <div class="error-message" style="color: #e53e3e; margin-bottom: 12px; font-size: 0.9rem; font-weight: 500;">
              {submitError}
            </div>
          {/if}
          <div class="modal-actions">
            <button type="button" class="cancel-btn" onclick={closeEditModal}>Cancel</button>
            <button type="submit" class="submit-btn">Save Changes</button>
          </div>
        </form>
      </div>
    </div>
  {/if}
</div>

<style>
  @keyframes spin { to { transform: rotate(360deg); } }
  
  .courses-view {
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

  .courses-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 24px;
  }

  .course-card {
    background-color: var(--bg-card);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-md);
    overflow: hidden;
    box-shadow: var(--shadow-sm);
    display: flex;
    flex-direction: column;
    transition: transform 0.2s, box-shadow 0.2s;
  }

  .course-card:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-md);
  }

  .card-image-placeholder {
    height: 120px;
    background: linear-gradient(135deg, #1a202c, #2d3748);
    position: relative;
    overflow: hidden;
  }

  /* Piano Keys representation */
  .piano-keys {
    display: flex;
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 60px;
    background-color: #000;
  }

  .white-key {
    flex: 1;
    background-color: #fff;
    border-right: 1px solid #ddd;
    border-radius: 0 0 2px 2px;
  }

  .black-key {
    position: absolute;
    width: 14px;
    height: 36px;
    background-color: #111;
    z-index: 2;
    border-radius: 0 0 2px 2px;
  }

  .k1 { left: 15%; }
  .k2 { left: 35%; }
  .k3 { left: 65%; }

  .card-body {
    padding: 20px;
    display: flex;
    flex-direction: column;
    flex-grow: 1;
  }

  .course-title {
    font-size: 1.05rem;
    font-weight: 700;
    color: var(--text-main);
    margin-bottom: 8px;
  }

  .course-description {
    font-size: 0.85rem;
    color: var(--text-muted);
    line-height: 1.4;
    margin-bottom: 16px;
    flex-grow: 1;
  }

  .course-meta {
    display: flex;
    gap: 8px;
    margin-bottom: 16px;
  }

  .meta-tag {
    font-size: 0.75rem;
    font-weight: 700;
    padding: 4px 8px;
    border-radius: var(--radius-sm);
  }

  .meta-tag.price {
    background-color: #fff5f5;
    color: #e53e3e;
  }

  .course-footer {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    border-top: 1px solid var(--border-color);
    padding-top: 14px;
  }

  .actions {
    display: flex;
    gap: 8px;
  }

  .action-btn {
    border: none;
    background: transparent;
    cursor: pointer;
    font-size: 0.85rem;
    opacity: 0.6;
    transition: opacity 0.2s;
  }

  .action-btn:hover {
    opacity: 1;
  }

  .action-btn.delete {
    color: var(--primary);
  }

  /* Create Course Card */
  .create-course-card {
    border: 2px dashed #cbd5e0;
    background-color: transparent;
    border-radius: var(--radius-md);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 32px 20px;
    cursor: pointer;
    min-height: 240px;
    transition: all 0.2s;
    text-align: center;
  }

  .create-course-card:hover {
    border-color: var(--primary);
    background-color: var(--primary-light);
  }

  .plus-icon {
    font-size: 2.2rem;
    color: var(--text-muted);
    margin-bottom: 12px;
    font-weight: 300;
    transition: color 0.2s;
  }

  .create-course-card:hover .plus-icon {
    color: var(--primary);
  }

  .create-course-card h3 {
    font-size: 0.95rem;
    font-weight: 700;
    color: var(--text-main);
    margin-bottom: 4px;
  }

  .create-course-card p {
    font-size: 0.8rem;
    color: var(--text-muted);
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

  .modal-form input, .modal-form textarea, .modal-form .select-input {
    padding: 10px 14px;
    border: 1px solid var(--border-color);
    border-radius: var(--radius-md);
    background-color: #f8fafc;
    color: var(--text-main);
    outline: none;
    font-size: 0.9rem;
    width: 100%;
    resize: none;
  }

  .modal-form input:focus, .modal-form textarea:focus, .modal-form .select-input:focus {
    border-color: var(--primary);
    background-color: var(--bg-card);
    box-shadow: 0 0 0 3px rgba(229, 62, 62, 0.1);
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
