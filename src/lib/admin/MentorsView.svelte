<script lang="ts">
  import Icon from '$lib/Icon.svelte';
  import { onMount } from 'svelte';
  import { apiGet } from '$lib/api';
  import type { Mentor } from '../dataStore';

  let mentors = $state<Mentor[]>([]);
  let isLoading = $state(true);

  // NOTE: GET /api/admin/mentors is not yet implemented. See backend_dev_todo.md #4
  onMount(async () => {
    try {
      const data = await apiGet<Mentor[]>('/admin/mentors');
      mentors = data || [];
    } catch {
      mentors = []; // Not yet available — show empty state
    } finally {
      isLoading = false;
    }
  });

  let filterDept = $state('All');
  let filterStatus = $state('All');
  let sortBy = $state('Name');
  let showModal = $state(false);

  // Form states
  let newName = $state('');
  let newRole = $state('Instructor');
  let newSpecialty = $state('Piano / Classical');
  let newEmail = $state('');
  let newPhone = $state('');
  let newStudentCount = $state(0);

  let filteredMentors = $derived(
    mentors.filter(m => {
      const matchDept = filterDept === 'All' || m.specialty.includes(filterDept);
      const matchStatus = filterStatus === 'All' || m.status === filterStatus;
      return matchDept && matchStatus;
    }).sort((a, b) => {
      if (sortBy === 'Name') return a.name.localeCompare(b.name);
      if (sortBy === 'Students') return b.studentCount - a.studentCount;
      return 0;
    })
  );

  function openModal() {
    showModal = true;
  }

  function closeModal() {
    showModal = false;
    newName = '';
    newEmail = '';
    newPhone = '';
    newStudentCount = 0;
  }

  function addMentor(e: SubmitEvent) {
    e.preventDefault();
    if (!newName || !newEmail || !newPhone) return;

    const newMentor: Mentor = {
      id: Date.now(),
      name: newName,
      role: newRole,
      specialty: newSpecialty,
      specialtyTag: newSpecialty,
      email: newEmail,
      phone: newPhone,
      studentCount: newStudentCount,
      status: 'Active'
    };

    mentorsStore.update((list) => [...list, newMentor]);
    closeModal();
  }

  function deleteMentor(id: number) {
    mentorsStore.update((list) => list.filter(m => m.id !== id));
  }

  function getInitials(name: string) {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }
</script>

<div class="mentors-view">
  <div class="header-row">
    <div class="header-text">
      <h2>Mentors Management</h2>
      <p>Manage your academy instructors, their specialties, and student loads.</p>
    </div>
    <div class="header-actions">
      <div class="toggle-group">
        <button class="toggle-btn active">Table</button>
        <button class="toggle-btn">Grid</button>
      </div>
      <button class="add-mentor-btn" onclick={openModal}>
        <span><Icon name="plus" size={14} /></span> Add Mentor
      </button>
    </div>
  </div>

  <div class="filters-card">
    <div class="filters-group">
      <span class="filters-label"><Icon name="filter" size={14} /> Filters:</span>
      <div class="select-wrapper">
        <select bind:value={filterDept}>
          <option value="All">All Departments</option>
          <option value="Piano">Piano</option>
          <option value="Vocal">Vocal</option>
          <option value="Guitar">Guitar</option>
          <option value="Violin">Violin</option>
          <option value="Drums">Drums</option>
        </select>
      </div>

      <div class="select-wrapper">
        <select bind:value={filterStatus}>
          <option value="All">Status: All</option>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
        </select>
      </div>

      <div class="select-wrapper">
        <select bind:value={sortBy}>
          <option value="Name">Sort By: Name</option>
          <option value="Students">Sort By: Students</option>
        </select>
      </div>
    </div>
    <button class="clear-filters-btn" onclick={() => { filterDept = 'All'; filterStatus = 'All'; sortBy = 'Name'; }}>
      Clear all filters
    </button>
  </div>

  <div class="table-card">
    <table class="mentors-table">
      <thead>
        <tr>
          <th>MENTOR NAME</th>
          <th>SPECIALTY</th>
          <th>CONTACT</th>
          <th>STUDENTS</th>
          <th>STATUS</th>
          <th>ACTIONS</th>
        </tr>
      </thead>
      <tbody>
        {#if filteredMentors.length === 0}
          <tr>
            <td colspan="6" class="empty-row">No mentors found matching your filters.</td>
          </tr>
        {:else}
          {#each filteredMentors as mentor}
            <tr>
              <td class="user-cell">
                <div class="avatar-circle">{getInitials(mentor.name)}</div>
                <div class="user-details">
                  <span class="name">{mentor.name}</span>
                  <span class="role">{mentor.role}</span>
                </div>
              </td>
              <td>
                <span class="specialty-badge">{mentor.specialty}</span>
              </td>
              <td class="contact-cell">
                <div class="email">{mentor.email}</div>
                <div class="phone">{mentor.phone}</div>
              </td>
              <td class="student-count">{mentor.studentCount}</td>
              <td>
                <span class="status-indicator" class:active={mentor.status === 'Active'} class:inactive={mentor.status === 'Inactive'}>
                  {mentor.status}
                </span>
              </td>
              <td>
                <div class="actions-row">
                  <button class="action-icon-btn" title="View details"><Icon name="eye" size={14} /></button>
                  <button class="action-icon-btn" title="Edit mentor"><Icon name="edit" size={14} /></button>
                  <button class="action-icon-btn delete" onclick={() => deleteMentor(mentor.id)} title="Delete mentor"><Icon name="x" size={14} /></button>
                </div>
              </td>
            </tr>
          {/each}
        {/if}
      </tbody>
    </table>

    <div class="table-footer">
      <span class="results-count">Showing 1 to {filteredMentors.length} of {mentors.length} mentors</span>
      <div class="pagination">
        <button class="pag-btn prev">◀</button>
        <button class="pag-btn active">1</button>
        <button class="pag-btn">2</button>
        <button class="pag-btn">3</button>
        <button class="pag-btn next">▶</button>
      </div>
    </div>
  </div>

  <div class="mentors-stats-grid">
    <div class="stat-card">
      <span class="icon"><Icon name="users" size={20} /></span>
      <div class="stat-info">
        <span class="label">TOTAL MENTORS</span>
        <div class="value-row">
          <span class="val">{mentors.filter(m => m.status === 'Active').length} Active</span>
          <span class="sub">+2 this month</span>
        </div>
      </div>
    </div>
    
    <div class="stat-card">
      <span class="icon"><Icon name="trending-up" size={20} /></span>
      <div class="stat-info">
        <span class="label">AVG. STUDENT LOAD</span>
        <div class="value-row">
          <span class="val">18.4 Students</span>
          <span class="sub">Per mentor load</span>
        </div>
      </div>
    </div>
  </div>

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
            <label for="mentor-role">Role</label>
            <select id="mentor-role" bind:value={newRole}>
              <option value="Senior Instructor">Senior Instructor</option>
              <option value="Lead Instructor">Lead Instructor</option>
              <option value="Instructor">Instructor</option>
              <option value="Guest Teacher">Guest Teacher</option>
            </select>
          </div>
          <div class="form-group">
            <label for="mentor-spec">Specialty / Department</label>
            <select id="mentor-spec" bind:value={newSpecialty}>
              <option value="Piano / Classical">Piano / Classical</option>
              <option value="Vocal / Jazz">Vocal / Jazz</option>
              <option value="Electric Guitar">Electric Guitar</option>
              <option value="Violin / Theory">Violin / Theory</option>
              <option value="Drums / Percussion">Drums / Percussion</option>
            </select>
          </div>
          <div class="form-group">
            <label for="mentor-email">Email Address</label>
            <input type="email" id="mentor-email" bind:value={newEmail} placeholder="mentor@academy.com" required />
          </div>
          <div class="form-group">
            <label for="mentor-phone">Phone Number</label>
            <input type="text" id="mentor-phone" bind:value={newPhone} placeholder="+1 (555) 012-3456" required />
          </div>
          <div class="form-group">
            <label for="mentor-students">Initial Student Count</label>
            <input type="number" id="mentor-students" bind:value={newStudentCount} min="0" />
          </div>
          <div class="modal-actions">
            <button type="button" class="cancel-btn" onclick={closeModal}>Cancel</button>
            <button type="submit" class="submit-btn">Save Mentor</button>
          </div>
        </form>
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
  }

  .toggle-btn {
    border: none;
    background: transparent;
    padding: 6px 14px;
    font-size: 0.8rem;
    font-weight: 700;
    color: var(--text-muted);
    cursor: pointer;
    border-radius: var(--radius-sm);
  }

  .toggle-btn.active {
    background-color: var(--bg-card);
    color: var(--text-main);
    box-shadow: var(--shadow-sm);
  }

  .add-mentor-btn {
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
    transition: all 0.2s;
  }

  .add-mentor-btn:hover {
    background-color: var(--primary-hover);
  }

  /* Filters styling */
  .filters-card {
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

  .filters-group {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .filters-label {
    font-size: 0.85rem;
    font-weight: 700;
    color: var(--text-muted);
  }

  .select-wrapper select {
    border: 1px solid var(--border-color);
    padding: 8px 12px;
    border-radius: var(--radius-sm);
    background-color: var(--bg-card);
    color: var(--text-main);
    font-weight: 600;
    outline: none;
    cursor: pointer;
    font-size: 0.85rem;
  }

  .clear-filters-btn {
    border: none;
    background: transparent;
    color: var(--primary);
    font-weight: 700;
    font-size: 0.85rem;
    cursor: pointer;
  }

  /* Table Card styling */
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

  .specialty-badge {
    background-color: #ebf8ff;
    color: #2b6cb0;
    font-size: 0.75rem;
    font-weight: 700;
    padding: 4px 8px;
    border-radius: var(--radius-sm);
  }

  .contact-cell {
    display: flex;
    flex-direction: column;
  }

  .contact-cell .email {
    font-weight: 600;
    color: var(--text-main);
  }

  .contact-cell .phone {
    font-size: 0.8rem;
    color: var(--text-muted);
  }

  .student-count {
    font-weight: 700;
    color: var(--text-main);
  }

  .status-indicator {
    font-size: 0.75rem;
    font-weight: 700;
    padding: 4px 10px;
    border-radius: var(--radius-full);
    display: inline-block;
  }

  .status-indicator.active {
    background-color: #c6f6d5;
    color: #22543d;
  }

  .status-indicator.inactive {
    background-color: #edf2f7;
    color: #4a5568;
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

  /* Stats cards */
  .mentors-stats-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 20px;
  }

  .stat-card {
    background-color: var(--bg-card);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-md);
    padding: 20px;
    box-shadow: var(--shadow-sm);
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .stat-card .icon {
    font-size: 1.8rem;
  }

  .stat-info {
    display: flex;
    flex-direction: column;
  }

  .stat-info .label {
    font-size: 0.75rem;
    color: var(--text-muted);
    font-weight: 700;
    letter-spacing: 0.5px;
  }

  .value-row {
    display: flex;
    align-items: baseline;
    gap: 10px;
  }

  .value-row .val {
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--text-main);
  }

  .value-row .sub {
    font-size: 0.75rem;
    color: #38a169;
    font-weight: 700;
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

  .modal-form input, .modal-form select {
    padding: 10px 14px;
    border: 1px solid var(--border-color);
    border-radius: var(--radius-md);
    background-color: #f8fafc;
    color: var(--text-main);
    outline: none;
    font-size: 0.9rem;
    width: 100%;
  }

  .modal-form input:focus, .modal-form select:focus {
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

  @media (max-width: 768px) {
    .filters-card {
      flex-direction: column;
      align-items: stretch;
    }
    .filters-group {
      flex-wrap: wrap;
    }
    .mentors-stats-grid {
      grid-template-columns: 1fr;
    }
  }
</style>
