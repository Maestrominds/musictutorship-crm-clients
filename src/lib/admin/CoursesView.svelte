<script lang="ts">
  import Icon from '$lib/Icon.svelte';
  import { onMount } from 'svelte';
  import { apiGet, apiPost, apiFetch } from '$lib/api';
  import type { Course } from '../dataStore';

  let courses = $state<Course[]>([]);
  let isLoading = $state(true);

  onMount(async () => {
    try {
      const data = await apiGet<any[]>('/admin/courses');
      courses = (data || []).map(c => ({
        id: c.id,
        name: c.title,
        description: c.description,
        price: `$${c.price}/mo`,
        duration: '',
        mentorName: '',
        isPremium: true
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
  let newDuration = $state('3 Months');
  let newMentor = $state('');
  let isSubmitting = $state(false);
  let submitError = $state('');

  // Edit states
  let showEditModal = $state(false);
  let editCourseId = $state<number | null>(null);
  let editName = $state('');
  let editDescription = $state('');
  let editPrice = $state('150');
  let editDuration = $state('3 Months');
  let editMentor = $state('');

  function openModal() { showModal = true; }
  function closeModal() { showModal = false; newName = ''; newDescription = ''; submitError = ''; }

  function openEditModal(course: Course) {
    editCourseId = course.id;
    editName = course.name;
    editDescription = course.description;
    editPrice = course.price.replace(/[^0-9.]/g, '');
    editDuration = course.duration;
    editMentor = course.mentorName;
    showEditModal = true;
  }
  function closeEditModal() { showEditModal = false; editCourseId = null; submitError = ''; }

  async function createCourse(e: SubmitEvent) {
    e.preventDefault();
    if (!newName || !newDescription) return;
    isSubmitting = true;
    submitError = '';
    try {
      const newCourseRes = await apiPost<any>('/admin/courses', {
        title: newName,
        description: newDescription,
        price: parseFloat(newPrice)
      });
      courses = [...courses, {
        id: newCourseRes.id || Date.now(),
        name: newName,
        description: newDescription,
        price: `$${newPrice}/mo`,
        duration: newDuration,
        mentorName: newMentor,
        isPremium: true
      }];
      closeModal();
    } catch (err) {
      submitError = err instanceof Error ? err.message : 'Failed to create course';
    } finally {
      isSubmitting = false;
    }
  }

  async function updateCourse(e: SubmitEvent) {
    e.preventDefault();
    if (!editCourseId || !editName || !editDescription) return;
    isSubmitting = true;
    submitError = '';
    try {
      await apiFetch(`/admin/courses/${editCourseId}`, {
        method: 'PUT',
        body: JSON.stringify({
          title: editName,
          description: editDescription,
          price: parseFloat(editPrice)
        })
      });
      courses = courses.map(c => c.id === editCourseId ? {
        ...c,
        name: editName,
        description: editDescription,
        price: `$${editPrice}/mo`,
        duration: editDuration,
        mentorName: editMentor
      } : c);
      closeEditModal();
    } catch (err) {
      submitError = err instanceof Error ? err.message : 'Failed to update course';
    } finally {
      isSubmitting = false;
    }
  }

  async function removeCourse(id: number) {
    if (!confirm('Are you sure you want to delete this course?')) return;
    try {
      await apiFetch(`/admin/courses/${id}`, { method: 'DELETE' });
      courses = courses.filter(c => c.id !== id);
    } catch (err) {
      alert('Failed to delete course: ' + (err instanceof Error ? err.message : String(err)));
    }
  }
</script>

<div class="courses-view">
  <div class="header-row">
    <div class="header-text">
      <h2>Courses</h2>
      <p>Manage and monitor your music academy curriculum and mentor assignments.</p>
    </div>
  </div>

  <div class="courses-grid">
    {#each courses as course}
      <div class="course-card">
        <div class="card-image-placeholder">
          <span class="premium-tag">PREMIUM</span>
          <!-- Piano keys representation styled with pure CSS -->
          <div class="piano-keys">
            <div class="white-key"></div>
            <div class="white-key"></div>
            <div class="white-key"></div>
            <div class="white-key"></div>
            <div class="white-key"></div>
            <div class="black-key k1"></div>
            <div class="black-key k2"></div>
            <div class="black-key k3"></div>
          </div>
        </div>
        <div class="card-body">
          <h3 class="course-title">{course.name}</h3>
          <p class="course-description">{course.description}</p>
          
          <div class="course-meta">
            <span class="meta-tag price"><Icon name="dollar" size={12} /> {course.price}</span>
            <span class="meta-tag duration"><Icon name="clock" size={12} /> {course.duration}</span>
          </div>

          <div class="course-footer">
            <div class="mentor-info">
              <div class="mentor-avatar"><Icon name="user" size={16} /></div>
              <div class="mentor-details">
                <span class="label">MENTOR</span>
                <span class="name">{course.mentorName}</span>
              </div>
            </div>
            <div class="actions">
              <button class="action-btn" onclick={() => openEditModal(course)} title="Edit course"><Icon name="edit" size={14} /></button>
              <button class="action-btn delete" onclick={() => removeCourse(course.id)} title="Delete course"><Icon name="x" size={14} /></button>
            </div>
          </div>
        </div>
      </div>
    {/each}

    <!-- Create Course Card -->
    <button class="create-course-card" onclick={openModal}>
      <span class="plus-icon">+</span>
      <h3>Create New Course</h3>
      <p>Launch a new curriculum</p>
    </button>
  </div>

  <!-- Create Modal Overlay -->
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
          <div class="form-row">
            <div class="form-group">
              <label for="course-price">Price</label>
              <input type="text" id="course-price" bind:value={newPrice} required />
            </div>
            <div class="form-group">
              <label for="course-duration">Duration</label>
              <input type="text" id="course-duration" bind:value={newDuration} required />
            </div>
          </div>
          <div class="form-group">
            <label for="course-mentor">Assign Mentor</label>
            <select id="course-mentor" bind:value={newMentor}>
              <option value="Alex Rivers">Alex Rivers</option>
              <option value="Sarah Jenkins">Sarah Jenkins</option>
              <option value="Michael Chen">Michael Chen</option>
              <option value="Emily Watson">Emily Watson</option>
            </select>
          </div>
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
          <div class="form-row">
            <div class="form-group">
              <label for="edit-course-price">Price</label>
              <input type="text" id="edit-course-price" bind:value={editPrice} required />
            </div>
            <div class="form-group">
              <label for="edit-course-duration">Duration</label>
              <input type="text" id="edit-course-duration" bind:value={editDuration} required />
            </div>
          </div>
          <div class="form-group">
            <label for="edit-course-mentor">Assign Mentor</label>
            <select id="edit-course-mentor" bind:value={editMentor}>
              <option value="Alex Rivers">Alex Rivers</option>
              <option value="Sarah Jenkins">Sarah Jenkins</option>
              <option value="Michael Chen">Michael Chen</option>
              <option value="Emily Watson">Emily Watson</option>
            </select>
          </div>
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

  .premium-tag {
    position: absolute;
    top: 12px;
    left: 12px;
    background-color: var(--primary-light);
    color: var(--primary);
    font-size: 0.65rem;
    font-weight: 700;
    padding: 3px 8px;
    border-radius: var(--radius-sm);
    z-index: 5;
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

  .meta-tag.duration {
    background-color: #f7fafc;
    color: #4a5568;
  }

  .course-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-top: 1px solid var(--border-color);
    padding-top: 14px;
  }

  .mentor-info {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .mentor-avatar {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background-color: #edf2f7;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.75rem;
  }

  .mentor-details {
    display: flex;
    flex-direction: column;
  }

  .mentor-details .label {
    font-size: 0.6rem;
    color: var(--text-muted);
    font-weight: 700;
  }

  .mentor-details .name {
    font-size: 0.8rem;
    font-weight: 700;
    color: var(--text-main);
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

  .form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }

  .modal-form label {
    font-size: 0.85rem;
    font-weight: 600;
    color: var(--text-main);
  }

  .modal-form input, .modal-form textarea, .modal-form select {
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

  .modal-form input:focus, .modal-form textarea:focus, .modal-form select:focus {
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
