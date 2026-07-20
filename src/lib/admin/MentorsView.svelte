<script lang="ts">
  import Icon from '$lib/Icon.svelte';
  import { onMount } from 'svelte';
  import { apiGet, apiFetch, apiPost } from '$lib/api';
  import type { Mentor } from '../dataStore';
  import SkeletonLoader from '$lib/SkeletonLoader.svelte';

  let mentors = $state<Mentor[]>([]);
  let isLoading = $state(true);

  onMount(async () => {
    try {
      const data = await apiGet<any[]>('/admin/mentors');
      mentors = (data || []).map(m => ({
        id: m.id,
        name: m.name,
        role: 'mentor',
        email: m.email
      }));
    } catch {
      mentors = []; // Not yet available — show empty state
    } finally {
      isLoading = false;
    }
  });

  let showModal = $state(false);

  // View Mode state
  let viewMode = $state<'table' | 'grid'>('table');
  let activeDropdownId = $state<number | null>(null);

  // View Modal state
  let showViewModal = $state(false);
  let selectedMentor = $state<Mentor | null>(null);

  // Form states
  let newName = $state('');
  let newEmail = $state('');

  let isActionLoading = $state(false);
  let actionMessage = $state('');

  // Edit states
  let showEditModal = $state(false);
  let editMentorId = $state<number | null>(null);
  let editName = $state('');
  let editEmail = $state('');

  function openModal() {
    showModal = true;
  }

  function closeModal() {
    showModal = false;
    newName = '';
    newEmail = '';
  }

  function openEditModal(mentor: Mentor) {
    editMentorId = mentor.id;
    editName = mentor.name;
    editEmail = mentor.email;
    showEditModal = true;
  }
  function closeEditModal() { showEditModal = false; editMentorId = null; }

  function openViewModal(mentor: Mentor) {
    selectedMentor = mentor;
    showViewModal = true;
  }
  function closeViewModal() { showViewModal = false; selectedMentor = null; }

  function toggleDropdown(id: number, event: MouseEvent) {
    event.stopPropagation();
    activeDropdownId = activeDropdownId === id ? null : id;
  }

  if (typeof window !== 'undefined') {
    window.addEventListener('click', () => {
      activeDropdownId = null;
    });
  }

  async function addMentor(e: SubmitEvent) {
    e.preventDefault();
    if (!newName || !newEmail) return;
    isActionLoading = true;
    actionMessage = 'Creating mentor...';

    try {
      const res = await apiPost<any>('/admin/users', {
        name: newName,
        email: newEmail,
        role: 'mentor'
      });
      const userId = res.id || Date.now();

      const newMentor: Mentor = {
        id: userId,
        name: newName,
        role: 'mentor',
        email: newEmail
      };

      mentors = [...mentors, newMentor];
      closeModal();
    } catch (err) {
      alert('Failed to save mentor: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      isActionLoading = false;
    }
  }

  async function updateMentor(e: SubmitEvent) {
    e.preventDefault();
    if (!editMentorId || !editName || !editEmail) return;
    isActionLoading = true;
    actionMessage = 'Saving changes...';
    try {
      await apiFetch(`/admin/users/${editMentorId}`, {
        method: 'PUT',
        body: JSON.stringify({ name: editName, email: editEmail })
      });
    } catch (err) {
      console.warn('Backend update failed, updating locally:', err);
    }
    
    mentors = mentors.map(m => m.id === editMentorId ? { 
      ...m, 
      name: editName, 
      email: editEmail
    } : m);
    closeEditModal();
    isActionLoading = false;
  }

  async function deleteMentor(id: number) {
    if (!confirm('Are you sure you want to delete this mentor?')) return;
    isActionLoading = true;
    actionMessage = 'Deleting mentor...';
    try {
      await apiFetch(`/admin/users/${id}`, { method: 'DELETE' });
      mentors = mentors.filter(m => m.id !== id);
    } catch (err) {
      alert('Failed to delete mentor: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      isActionLoading = false;
    }
  }

  function getInitials(name: string) {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 1);
  }
</script>

<div class="mentors-view">
  {#if isActionLoading}
    <div class="action-loading-overlay">
      <div class="spinner"></div>
      <div>{actionMessage}</div>
    </div>
  {/if}

  <div class="header-row">
    <div class="header-text">
      <h2>Mentors Management</h2>
      <p>Manage your academy instructors.</p>
    </div>
    <div class="header-actions">
      <div class="toggle-group">
        <button class="toggle-btn" class:active={viewMode === 'table'} onclick={() => viewMode = 'table'}>Table</button>
        <button class="toggle-btn" class:active={viewMode === 'grid'} onclick={() => viewMode = 'grid'}>Grid</button>
      </div>
      <button class="add-mentor-btn" onclick={openModal}>
        <span><Icon name="plus" size={14} /></span> Add Mentor
      </button>
    </div>
  </div>

  {#if isLoading}
    <SkeletonLoader type="table" rows={6} cols={3} />
  {:else}
  {#if viewMode === 'table'}
    <div class="table-card">
      <table class="mentors-table">
        <thead>
          <tr>
            <th>MENTOR NAME</th>
            <th>EMAIL</th>
            <th style="text-align: right;">ACTIONS</th>
          </tr>
        </thead>
        <tbody>
          {#if mentors.length === 0}
            <tr>
              <td colspan="3" class="empty-row">No mentors found.</td>
            </tr>
          {:else}
            {#each mentors as mentor}
              <tr>
                <td>
                  <div class="user-cell">
                    <div class="avatar-circle">{getInitials(mentor.name)}</div>
                    <div class="user-details">
                      <span class="name">{mentor.name}</span>
                      <span class="role">{mentor.role}</span>
                    </div>
                  </div>
                </td>
                <td>
                  <div class="email">{mentor.email}</div>
                </td>
                <td style="text-align: right;">
                  <button onclick={() => openEditModal(mentor)} style="background: none; border: none; font-size: 0.9rem; cursor: pointer; padding: 6px; color: var(--text-main); margin-right: 8px;">Edit</button>
                  <button onclick={() => deleteMentor(mentor.id)} style="background: none; border: none; font-size: 0.9rem; cursor: pointer; padding: 6px; color: #e53e3e;">Delete</button>
                </td>
              </tr>
            {/each}
          {/if}
        </tbody>
      </table>

      <div class="table-footer">
        <span class="results-count">Total: {mentors.length} mentors</span>
      </div>
    </div>
  {:else}
    <div class="mentors-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px;">
      {#each mentors as mentor}
        <div class="mentor-card" style="background: white; border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 20px; box-shadow: var(--shadow-sm); display: flex; flex-direction: column; gap: 14px;">
          <div style="display: flex; justify-content: space-between; align-items: flex-start;">
            <div style="display: flex; gap: 12px; align-items: center;">
              <div class="avatar-circle" style="width: 44px; height: 44px; font-size: 1rem;">{getInitials(mentor.name)}</div>
              <div>
                <h4 style="margin: 0; font-weight: 700; font-size: 1rem; color: var(--text-main);">{mentor.name}</h4>
                <span style="font-size: 0.75rem; color: var(--text-muted);">{mentor.role}</span>
              </div>
            </div>
            <!-- Actions Dropdown -->
            <div class="dropdown-wrapper" style="position: relative;">
              <button onclick={(e) => toggleDropdown(mentor.id, e)} style="background: none; border: none; font-size: 1.2rem; cursor: pointer; padding: 4px; color: var(--text-main);">•••</button>
              {#if activeDropdownId === mentor.id}
                <div class="dropdown-menu" style="position: absolute; right: 0; top: 24px; background: white; border: 1px solid var(--border-color); border-radius: 4px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); display: flex; flex-direction: column; z-index: 10; width: 120px;">
                  <button onclick={() => openViewModal(mentor)} style="padding: 8px 12px; background: none; border: none; text-align: left; cursor: pointer; font-size: 0.85rem;">View Details</button>
                  <button onclick={() => openEditModal(mentor)} style="padding: 8px 12px; background: none; border: none; text-align: left; cursor: pointer; font-size: 0.85rem;">Edit</button>
                  <button onclick={() => deleteMentor(mentor.id)} style="padding: 8px 12px; background: none; border: none; text-align: left; cursor: pointer; font-size: 0.85rem; color: #e53e3e;">Delete</button>
                </div>
              {/if}
            </div>
          </div>
          
          <div style="display: flex; flex-direction: column; gap: 6px; font-size: 0.85rem; color: var(--text-muted);">
            <div><strong>Email:</strong> {mentor.email}</div>
          </div>
        </div>
      {/each}
    </div>
  {/if}
  {/if}

  <!-- Create Modal Overlay -->
  {#if showModal}
    <div class="modal-overlay" onclick={closeModal} aria-hidden="true">
      <div class="modal-content" onclick={(e) => e.stopPropagation()} role="dialog">
        <div class="modal-header">
          <h3>Add New Mentor</h3>
          <button class="close-btn" onclick={closeModal}>&times;</button>
        </div>
        <form onsubmit={addMentor} class="modal-form">
          <div class="form-group">
            <label for="mentor-name">Full Name</label>
            <input type="text" id="mentor-name" bind:value={newName} placeholder="Jonathan Doe" required />
          </div>
          <div class="form-group">
            <label for="mentor-email">Email Address</label>
            <input type="email" id="mentor-email" bind:value={newEmail} placeholder="mentor@academy.com" required />
          </div>
          <div class="modal-actions">
            <button type="button" class="cancel-btn" onclick={closeModal}>Cancel</button>
            <button type="submit" class="submit-btn">Save Mentor</button>
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
          <h3>Edit Mentor Profile</h3>
          <button class="close-btn" onclick={closeEditModal}>&times;</button>
        </div>
        <form onsubmit={updateMentor} class="modal-form">
          <div class="form-group">
            <label for="edit-mentor-name">Full Name</label>
            <input type="text" id="edit-mentor-name" bind:value={editName} required />
          </div>
          <div class="form-group">
            <label for="edit-mentor-email">Email Address</label>
            <input type="email" id="edit-mentor-email" bind:value={editEmail} required />
          </div>
          <div class="modal-actions">
            <button type="button" class="cancel-btn" onclick={closeEditModal}>Cancel</button>
            <button type="submit" class="submit-btn">Save Changes</button>
          </div>
        </form>
      </div>
    </div>
  {/if}

  <!-- View Mentor Details Modal -->
  {#if showViewModal && selectedMentor}
    <div class="modal-overlay" onclick={closeViewModal} aria-hidden="true">
      <div class="modal-content" onclick={(e) => e.stopPropagation()} role="dialog" style="padding: 24px; max-width: 480px; width: 100%;">
        <div class="modal-header" style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border-color); padding-bottom: 12px; margin-bottom: 16px;">
          <h3 style="margin: 0; font-size: 1.25rem;">Mentor Details</h3>
          <button class="close-btn" onclick={closeViewModal}>&times;</button>
        </div>
        <div style="display: flex; flex-direction: column; gap: 14px; font-size: 0.95rem;">
          <div style="display: flex; align-items: center; gap: 14px; margin-bottom: 10px;">
            <div class="avatar-circle" style="width: 50px; height: 50px; font-size: 1.2rem; background: #ebf8ff; color: #2b6cb0;">{getInitials(selectedMentor.name)}</div>
            <div>
              <h4 style="margin: 0; font-size: 1.15rem; font-weight: 700; color: var(--text-main);">{selectedMentor.name}</h4>
              <span style="font-size: 0.8rem; color: var(--text-muted); font-weight: 600;">{selectedMentor.role}</span>
            </div>
          </div>
          <div style="display: grid; grid-template-columns: 100px 1fr; gap: 10px; line-height: 1.5;">
            <strong style="color: var(--text-muted);">Email:</strong>
            <span>{selectedMentor.email}</span>
          </div>
        </div>
        <div style="display: flex; justify-content: flex-end; margin-top: 24px; border-top: 1px solid var(--border-color); padding-top: 16px;">
          <button onclick={closeViewModal} style="padding: 8px 16px; border: 1px solid var(--border-color); border-radius: 4px; background: white; cursor: pointer; font-weight: 600;">Close</button>
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  .mentors-view {
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
    align-items: center;
  }

  .toggle-group {
    display: flex;
    background-color: #f1f4f9;
    padding: 4px;
    border-radius: var(--radius-md);
    gap: 4px;
  }

  .toggle-btn {
    padding: 6px 12px;
    border: none;
    background: transparent;
    color: var(--text-muted);
    font-size: 0.85rem;
    font-weight: 600;
    border-radius: var(--radius-sm);
    cursor: pointer;
    transition: all 0.2s;
  }

  .toggle-btn.active {
    background-color: white;
    color: var(--text-main);
    box-shadow: var(--shadow-sm);
  }

  .add-mentor-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    background-color: var(--primary);
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: var(--radius-md);
    font-weight: 600;
    font-size: 0.9rem;
    cursor: pointer;
    transition: background-color 0.2s;
  }

  .add-mentor-btn:hover {
    background-color: var(--primary-hover);
  }

  .table-card {
    background-color: var(--bg-card);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-md);
    box-shadow: var(--shadow-sm);
    overflow: hidden;
  }

  .mentors-table {
    width: 100%;
    border-collapse: collapse;
    text-align: left;
  }

  .mentors-table th {
    font-size: 0.75rem;
    font-weight: 700;
    color: var(--text-muted);
    padding: 14px 20px;
    border-bottom: 1px solid var(--border-color);
    background-color: #fafbfc;
  }

  .mentors-table td {
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
    background-color: #faf5ff;
    color: #805ad5;
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

  .user-details .role {
    font-size: 0.75rem;
    color: var(--text-muted);
    font-weight: 500;
  }

  .contact-cell {
    display: flex;
    flex-direction: column;
  }

  .contact-cell .email {
    font-weight: 600;
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

  /* Modal styling */
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

  .modal-form input {
    padding: 10px 14px;
    border: 1px solid var(--border-color);
    border-radius: var(--radius-md);
    background-color: #f8fafc;
    color: var(--text-main);
    outline: none;
    font-size: 0.9rem;
    width: 100%;
  }

  .modal-form input:focus {
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

  /* Loading Overlay */
  .action-loading-overlay {
    position: fixed;
    top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(255,255,255,0.7);
    z-index: 9999;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    font-weight: 600;
    color: var(--primary);
    gap: 10px;
  }
  .spinner {
    width: 30px; height: 30px;
    border: 3px solid rgba(229, 62, 62, 0.3);
    border-top-color: var(--primary);
    border-radius: 50%;
    animation: spin 1s infinite linear;
  }
  @keyframes spin { to { transform: rotate(360deg); } }
</style>
