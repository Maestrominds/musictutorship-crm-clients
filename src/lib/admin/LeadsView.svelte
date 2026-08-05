<script lang="ts">
  import Icon from '$lib/Icon.svelte';
  import { onMount } from 'svelte';
  import { apiGet, apiPost, apiFetch } from '$lib/api';
  import SkeletonLoader from '$lib/SkeletonLoader.svelte';

  interface Lead {
    id: number;
    name: string;
    phone: string;
    email: string;
    course: string;
    status: 'New' | 'In Review' | 'Contacted';
    createdDate: string;
  }

  let leads = $state<Lead[]>([]);
  let isLoading = $state(true);
  let errorMsg = $state('');
  let isSubmitting = $state(false);
  let isActionLoading = $state(false);
  let actionMessage = $state('');

  let selectedLead = $state<Lead | null>(null);

  // Student Modal state
  let showStudentModal = $state(false);

  // Trial Modal state
  let showTrialModal = $state(false);
  let trialDate = $state('');
  let trialTime = $state('');

  let availableCourses = $state<{id: number, title: string}[]>([]);

  void isLoading;

  // Form inputs for adding a lead
  let showAddModal = $state(false);
  let newLeadName = $state('');
  let newLeadEmail = $state('');
  let newLeadPhone = $state('');
  let newLeadCourseId = $state<number | null>(null);
  let submitError = $state('');

  // Filter inputs
  let searchQuery = $state('');
  let filterStatus = $state('All');
  let filterCourse = $state('All');

  // Filtered leads computation
  let filteredLeads = $derived(
    leads.filter(lead => {
      const matchesSearch = lead.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            lead.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            lead.phone.includes(searchQuery);
      
      const matchesStatus = filterStatus === 'All' || lead.status === filterStatus;
      const matchesCourse = filterCourse === 'All' || lead.course === filterCourse;
      
      return matchesSearch && matchesStatus && matchesCourse;
    })
  );

  onMount(async () => {
    try {
      const [leadsData, coursesData] = await Promise.all([
        apiGet<any[]>('/admin/leads').catch(() => []),
        apiGet<any[]>('/admin/courses').catch(() => [])
      ]);
      
      availableCourses = coursesData || [];
      
      leads = (leadsData || []).map(l => ({
        id: l.id,
        name: l.name,
        phone: l.phone || '',
        email: l.email,
        course: l.course || 'Classical Piano',
        status: l.mapped_status || 'New',
        createdDate: l.created_at
          ? new Date(l.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
          : 'N/A'
      }));
    } catch (err) {
      errorMsg = 'Failed to load leads';
    } finally {
      isLoading = false;
    }
  });

  function openModal() {
    showAddModal = true;
  }

  function closeModal() {
    showAddModal = false;
    newLeadName = '';
    newLeadEmail = '';
    newLeadPhone = '';
    newLeadCourse = 'Classical Piano';
    submitError = '';
  }

  async function addLead(e: SubmitEvent) {
    e.preventDefault();
    if (!newLeadName || !newLeadEmail) return;

    isSubmitting = true;
    isActionLoading = true;
    actionMessage = 'Creating lead...';
    submitError = '';
    try {
      await apiPost('/leads', { name: newLeadName, email: newLeadEmail });
      // Optimistically add to local list
      const newLead: Lead = {
        id: Date.now(),
        name: newLeadName,
        phone: newLeadPhone,
        email: newLeadEmail,
        course: availableCourses.find(c => c.id === newLeadCourseId)?.title || 'Unknown',
        status: 'New',
        createdDate: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      };
      leads = [newLead, ...leads];
      closeModal();
    } catch (err) {
      submitError = err instanceof Error ? err.message : 'Failed to add lead';
    } finally {
      isSubmitting = false;
      isActionLoading = false;
    }
  }

  function getInitials(name: string) {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 1);
  }

  function openStudentModal(lead: Lead) {
    selectedLead = lead;
    showStudentModal = true;
  }

  function openTrialModal(lead: Lead) {
    selectedLead = lead;
    trialDate = '';
    trialTime = '';
    showTrialModal = true;
  }

  function closeTrialModal() {
    showTrialModal = false;
    selectedLead = null;
  }

  function closeStudentModal() {
    showStudentModal = false;
    selectedLead = null;
  }

  async function convertToStudent(e: SubmitEvent) {
    e.preventDefault();
    if (!selectedLead) return;

    isActionLoading = true;
    actionMessage = 'Converting lead to student...';
    try {
      const res = await apiPost<any>(`/admin/leads/${selectedLead.id}/convert`, {});
      
      if (res && res.password) {
        alert(`Student created successfully!\n\nEmail: ${selectedLead.email}\nTemporary Password: ${res.password}\n\nPlease share these credentials with the student.`);
      } else {
        alert('Student created successfully!');
      }

      // Optimistically mark as Contacted
      const idx = leads.findIndex(l => l.id === selectedLead!.id);
      if (idx !== -1) leads[idx].status = 'Contacted';
      closeStudentModal();
      if (typeof window !== 'undefined') {
        localStorage.setItem('adminActiveSubView', 'students');
        window.location.reload();
      }
    } catch (err) {
      alert('Failed to convert lead: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      isActionLoading = false;
    }
  }

  async function bookTrial(e: SubmitEvent) {
    e.preventDefault();
    if (!selectedLead || !trialDate || !trialTime) return;

    isActionLoading = true;
    actionMessage = 'Booking trial...';
    try {
      // Ensure time is in HH:MM:SS format for the backend
      const formattedTime = trialTime.split(':').length === 2 ? `${trialTime}:00` : trialTime;

      await apiPost('/admin/trials', {
        lead_id: selectedLead.id,
        date: trialDate,
        time: formattedTime
      });

      const idx = leads.findIndex(l => l.id === selectedLead!.id);
      if (idx !== -1) leads[idx].status = 'In Review';
      closeTrialModal();
      alert('Trial booked successfully!');
    } catch (err) {
      alert('Failed to book trial: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      isActionLoading = false;
    }
  }
</script>

<div class="leads-view">
  {#if isActionLoading}
    <div class="action-loading-overlay">
      <div class="spinner"></div>
      <div>{actionMessage}</div>
    </div>
  {/if}
  <!-- Leads Management Header -->
  <div class="leads-header-row">
    <div class="header-text">
      <h2>Leads Management</h2>
      <p>Track and nurture potential students for your academy.</p>
    </div>
    <button class="add-lead-btn" onclick={openModal}>
      <span class="btn-icon"><Icon name="plus" size={14} /></span> Add New Lead
    </button>
  </div>

  {#if isLoading}
    <SkeletonLoader type="table" rows={6} cols={5} />
  {:else}
    <!-- Filter and Search Bar -->
    <div class="filter-bar-card">
      <div class="search-input-wrapper">
        <span class="search-icon"><Icon name="search" size={15} /></span>
        <input 
          type="text" 
          placeholder="Search leads by name, email or phone..." 
          bind:value={searchQuery}
        />
      </div>

      <div class="dropdowns-group">
        <div class="select-wrapper">
          <label for="status-filter">Status:</label>
          <select id="status-filter" bind:value={filterStatus}>
            <option value="All">All</option>
            <option value="New">New</option>
            <option value="In Review">In Review</option>
            <option value="Contacted">Contacted</option>
          </select>
        </div>

        <div class="select-wrapper">
          <label for="course-filter">Course:</label>
          <select id="course-filter" bind:value={filterCourse}>
            <option value="All">All</option>
            <option value="Classical Piano">Classical Piano</option>
            <option value="Vocal Mastery">Vocal Mastery</option>
            <option value="Guitar Theory">Guitar Theory</option>
          </select>
        </div>

        <div class="layout-toggle-group">
          <button class="toggle-icon-btn active" title="List View">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <button class="toggle-icon-btn" title="Kanban Board">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M4 4h6v16H4zm10 0h6v16h-6z" />
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Table Card -->
    <div class="table-card">
      <table class="leads-table">
        <thead>
          <tr>
            <th>NAME</th>
            <th>CONTACT INFO</th>
            <th>COURSE INTERESTED</th>
            <th>STATUS</th>
            <th>CREATED DATE</th>
            <th>ACTIONS</th>
          </tr>
        </thead>
        <tbody>
          {#if filteredLeads.length === 0}
            <tr>
              <td colspan="6" class="empty-row">No leads found matching your criteria.</td>
            </tr>
          {:else}
            {#each filteredLeads as lead}
              <tr>
                <td>
                  <div class="name-cell-inner">
                    <div class="avatar-circle">{getInitials(lead.name)}</div>
                    <span class="name-text">{lead.name}</span>
                  </div>
                </td>
                <td>
                  <div class="contact-cell-inner">
                    <div class="phone-text">{lead.phone}</div>
                    <div class="email-text">{lead.email}</div>
                  </div>
                </td>
                <td class="course-text">{lead.course}</td>
                <td>
                  <span class="status-badge" class:new={lead.status === 'New'} class:in-review={lead.status === 'In Review'} class:contacted={lead.status === 'Contacted'}>
                    {lead.status}
                  </span>
                </td>
                <td class="date-text">{lead.createdDate}</td>
                <td>
                  <div style="display: flex; gap: 8px; align-items: center;">
                    <button 
                      class="move-to-student-btn"
                      style="background-color: transparent; border: 1px solid #cbd5e0; color: #4a5568; padding: 6px 12px; border-radius: 6px; font-size: 0.75rem; font-weight: 600; display: flex; align-items: center; gap: 4px; cursor: pointer;"
                      onclick={() => openTrialModal(lead)}
                    >
                      <Icon name="calendar" size={14} /> Book Trial
                    </button>
                    <button 
                      class="move-to-student-btn"
                      style="background-color: transparent; border: 1px solid #cbd5e0; color: #4a5568; padding: 6px 12px; border-radius: 6px; font-size: 0.75rem; font-weight: 600; display: flex; align-items: center; gap: 4px; cursor: pointer;"
                      onclick={() => openStudentModal(lead)}
                    >
                      <Icon name="user-plus" size={14} /> Convert
                    </button>
                  </div>
                </td>
              </tr>
            {/each}
          {/if}
        </tbody>
      </table>

      <div class="table-footer">
        <span class="results-count">Showing 1 to {filteredLeads.length} of {leads.length} leads</span>
        <div class="pagination">
          <button class="pag-btn prev">◀</button>
          <button class="pag-btn active">1</button>
          <button class="pag-btn">2</button>
          <button class="pag-btn">3</button>
          <button class="pag-btn">4</button>
          <span class="dots">...</span>
          <button class="pag-btn">9</button>
          <button class="pag-btn next">▶</button>
        </div>
      </div>
    </div>

    <!-- Bottom Stats Grid -->
    <div class="leads-stats-grid">
      <div class="lead-stat-card">
        <div class="stat-main">
          <div class="value">{leads.length}</div>
          <span class="trend positive">↗ All-time</span>
        </div>
        <div class="label">TOTAL LEADS</div>
      </div>
      
      <div class="lead-stat-card">
        <div class="stat-main">
          <div class="value">{leads.filter(l => l.status === 'New' || l.status === 'In Review').length}</div>
          <span class="trend neutral">In review: {leads.filter(l => l.status === 'In Review').length}</span>
        </div>
        <div class="label">ACTIVE PIPELINE</div>
      </div>

      <div class="lead-stat-card">
        <div class="stat-main">
          <div class="value">{leads.length ? ((leads.filter(l => l.status === 'Contacted').length / leads.length) * 100).toFixed(1) : 0}%</div>
          <span class="trend positive">Converted: {leads.filter(l => l.status === 'Contacted').length}</span>
        </div>
        <div class="label">CONV. RATE</div>
      </div>

      <div class="lead-stat-card">
        <div class="stat-main">
          <div class="value">{leads.filter(l => l.status === 'New').length}</div>
          <span class="trend positive">Action needed</span>
        </div>
        <div class="label">NEW LEADS</div>
      </div>
    </div>
  {/if}

  <!-- Add Lead Modal Overlay -->
  {#if showAddModal}
    <div class="modal-overlay" onclick={closeModal} aria-hidden="true">
      <div class="modal-content" onclick={(e) => e.stopPropagation()} role="dialog">
        <div class="modal-header">
          <h3>Add New Lead</h3>
          <button class="close-btn" onclick={closeModal}>&times;</button>
        </div>
        <form onsubmit={addLead} class="modal-form">
          <div class="form-group">
            <label for="lead-name">Full Name</label>
            <input type="text" id="lead-name" bind:value={newLeadName} placeholder="Alice Schmidt" required />
          </div>
          <div class="form-group">
            <label for="lead-email">Email Address</label>
            <input type="email" id="lead-email" bind:value={newLeadEmail} placeholder="alice@example.com" required />
          </div>
          <div class="form-group">
            <label for="lead-phone">Phone Number</label>
            <input type="text" id="lead-phone" bind:value={newLeadPhone} placeholder="+1 (555) 012-3456" required />
          </div>
          <div class="form-group">
            <label for="lead-course">Course Interested</label>
            <select id="lead-course" bind:value={newLeadCourseId}>
              <option value={null}>-- Select a Course --</option>
              {#each availableCourses as course}
                <option value={course.id}>{course.title}</option>
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
            <button type="submit" class="submit-btn">Save Lead</button>
          </div>
        </form>
      </div>
    </div>
  {/if}


  <!-- Create Student Modal -->
  {#if showStudentModal}
    <div class="modal-overlay" onclick={closeStudentModal} aria-hidden="true">
      <div class="modal-content" onclick={(e) => e.stopPropagation()} role="dialog">
        <div class="modal-header">
          <h3>Convert</h3>
          <button class="close-btn" onclick={closeStudentModal}>&times;</button>
        </div>
        <form onsubmit={convertToStudent} class="modal-form">
          <p style="margin-bottom: 15px; color: var(--text-muted); font-size: 0.9rem;">
            Are you sure you want to convert <strong>{selectedLead?.name}</strong> into a student? This will automatically create an account for them.
          </p>
          <div class="modal-actions">
            <button type="button" class="cancel-btn" onclick={closeStudentModal}>Cancel</button>
            <button type="submit" class="submit-btn" disabled={isActionLoading}>
              {isActionLoading ? 'Converting...' : 'Convert to Student'}
            </button>
          </div>
        </form>
      </div>
    </div>
  {/if}

  <!-- Book Trial Modal -->
  {#if showTrialModal}
    <div class="modal-overlay" onclick={closeTrialModal} aria-hidden="true">
      <div class="modal-content" onclick={(e) => e.stopPropagation()} role="dialog">
        <div class="modal-header">
          <h3>Book Trial</h3>
          <button class="close-btn" onclick={closeTrialModal}>&times;</button>
        </div>
        <form onsubmit={bookTrial} class="modal-form">
          <p style="margin-bottom: 15px; color: var(--text-muted); font-size: 0.9rem;">
            Schedule a trial class for <strong>{selectedLead?.name}</strong>.
          </p>
          <div class="form-group">
            <label for="trial-date">Date</label>
            <input type="date" id="trial-date" bind:value={trialDate} required />
          </div>
          <div class="form-group">
            <label for="trial-time">Time</label>
            <input type="time" id="trial-time" bind:value={trialTime} required />
          </div>
          <div class="modal-actions">
            <button type="button" class="cancel-btn" onclick={closeTrialModal}>Cancel</button>
            <button type="submit" class="submit-btn" disabled={isActionLoading}>
              {isActionLoading ? 'Booking...' : 'Book Trial'}
            </button>
          </div>
        </form>
      </div>
    </div>
  {/if}
</div>

<style>
  .leads-view {
    display: flex;
    flex-direction: column;
    gap: 24px;
  }

  .leads-header-row {
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

  .add-lead-btn {
    background-color: var(--primary);
    color: white;
    border: none;
    border-radius: var(--radius-md);
    padding: 12px 20px;
    font-weight: 600;
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(229, 62, 62, 0.2);
    display: flex;
    align-items: center;
    gap: 8px;
    transition: all 0.2s;
  }

  .add-lead-btn:hover {
    background-color: var(--primary-hover);
    box-shadow: 0 6px 16px rgba(229, 62, 62, 0.3);
  }

  /* Filter bar */
  .filter-bar-card {
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

  .search-input-wrapper {
    display: flex;
    align-items: center;
    gap: 10px;
    background-color: #f1f4f9;
    padding: 10px 16px;
    border-radius: var(--radius-md);
    flex-grow: 1;
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

  .dropdowns-group {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .select-wrapper {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 0.85rem;
    color: var(--text-muted);
    font-weight: 600;
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
  }

  .icon-filter-btn {
    border: 1px solid var(--border-color);
    background: transparent;
    padding: 8px;
    border-radius: var(--radius-sm);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--text-muted);
  }

  .icon-filter-btn:hover {
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

  .leads-table {
    width: 100%;
    border-collapse: collapse;
    text-align: left;
  }

  .leads-table th {
    font-size: 0.75rem;
    font-weight: 700;
    color: var(--text-muted);
    padding: 14px 20px;
    border-bottom: 1px solid var(--border-color);
    background-color: #fafbfc;
  }

  .leads-table td {
    padding: 16px 20px;
    font-size: 0.9rem;
    border-bottom: 1px solid var(--border-color);
    vertical-align: middle;
  }

  .name-cell-inner {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .avatar-circle {
    width: 34px;
    height: 34px;
    border-radius: 50%;
    background-color: #fed7d7;
    color: #c53030;
    font-weight: 700;
    font-size: 0.8rem;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .name-text {
    font-weight: 700;
    color: var(--text-main);
  }

  .contact-cell-inner {
    display: flex;
    flex-direction: column;
  }

  .phone-text {
    font-weight: 600;
    color: var(--text-main);
  }

  .email-text {
    font-size: 0.8rem;
    color: var(--text-muted);
  }

  .course-text {
    font-weight: 500;
    color: var(--text-main);
  }

  .status-badge {
    padding: 4px 10px;
    border-radius: var(--radius-full);
    font-size: 0.75rem;
    font-weight: 700;
    display: inline-block;
  }

  .status-badge.new {
    background-color: #ebf8ff;
    color: #2b6cb0;
  }

  .status-badge.in-review {
    background-color: #fefcbf;
    color: #b7791f;
  }

  .status-badge.contacted {
    background-color: #e6fffa;
    color: #006857;
  }

  .action-menu-btn {
    border: none;
    background: transparent;
    color: var(--text-muted);
    font-size: 1.1rem;
    cursor: pointer;
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

  /* Bottom Stats Grid */
  .leads-stats-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 20px;
    margin-top: 8px;
  }

  .lead-stat-card {
    background-color: var(--bg-card);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-md);
    padding: 20px;
    box-shadow: var(--shadow-sm);
  }

  .stat-main {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    margin-bottom: 6px;
  }

  .stat-main .value {
    font-size: 1.6rem;
    font-weight: 700;
    color: var(--text-main);
  }

  .stat-main .trend {
    font-size: 0.75rem;
    font-weight: 700;
  }

  .stat-main .trend.positive {
    color: #38a169;
  }

  .stat-main .trend.neutral {
    color: #3182ce;
  }

  .lead-stat-card .label {
    font-size: 0.75rem;
    color: var(--text-muted);
    font-weight: 700;
    letter-spacing: 0.5px;
  }

  /* Modal Styles */
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
    animation: modalSlideUp 0.3s ease-out;
  }

  @keyframes modalSlideUp {
    from { transform: translateY(20px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
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

  .modal-form .form-group {
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

  .modal-actions .submit-btn:hover {
    background-color: var(--primary-hover);
  }

  @media (max-width: 1024px) {
    .filter-bar-card {
      flex-direction: column;
      align-items: stretch;
    }
    .dropdowns-group {
      justify-content: space-between;
    }
    .leads-stats-grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  .move-to-trials-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 12px;
    border-radius: var(--radius-md);
    font-size: 0.8rem;
    font-weight: 600;
    border: 1px solid var(--primary);
    background-color: transparent;
    color: var(--primary);
    cursor: pointer;
    transition: all 0.2s;
  }
  .move-to-trials-btn:hover {
    background-color: var(--primary);
    color: white;
  }
</style>
