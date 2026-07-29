<script lang="ts">
  import Icon from '$lib/Icon.svelte';
  import { onMount } from 'svelte';
  import { apiGet, apiPost, apiFetch } from '$lib/api';
  import SkeletonLoader from '$lib/SkeletonLoader.svelte';

  interface Trial {
    id: number;
    lead_id: number;
    lead_name: string;
    lead_email: string;
    course: string;
    trial_date: string;
    trial_time: string;
    status: string;
  }

  let trials = $state<Trial[]>([]);
  let isLoading = $state(true);
  let errorMsg = $state('');
  let isActionLoading = $state(false);
  let actionMessage = $state('');

  let searchQuery = $state('');
  let filterStatus = $state('All');

  let filteredTrials = $derived(
    trials.filter(t => {
      const matchSearch = t.lead_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          t.lead_email.toLowerCase().includes(searchQuery.toLowerCase());
      const matchStatus = filterStatus === 'All' || t.status === filterStatus;
      return matchSearch && matchStatus;
    })
  );

  onMount(async () => {
    try {
      const data = await apiGet<any[]>('/admin/trials');
      trials = (data || []).map(t => ({
        id: t.id,
        lead_id: t.lead_id,
        lead_name: t.lead_name || 'Unknown',
        lead_email: t.lead_email || '',
        course: t.course || 'Classical Piano',
        trial_date: t.date || 'N/A',
        trial_time: t.time || 'N/A',
        status: t.status || 'Scheduled'
      }));
    } catch (err) {
      errorMsg = 'Failed to load trials';
    } finally {
      isLoading = false;
    }
  });

  function getInitials(name: string) {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 1);
  }

  async function convertToStudent(trial: Trial) {
    if (!confirm(`Are you sure you want to convert ${trial.lead_name} to a student?`)) return;
    
    isActionLoading = true;
    actionMessage = 'Converting to student...';
    try {
      // Use standard user creation instead of a custom convert endpoint
      await apiPost('/admin/users', { 
        name: trial.lead_name, 
        email: trial.lead_email, 
        role: 'student' 
      });
      
      // Update trial status to Completed
      await apiFetch(`/admin/trials/${trial.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'Completed' })
      });
      trial.status = 'Completed';
      alert(`${trial.lead_name} successfully added as a student!`);
    } catch (err: any) {
      alert('Failed to convert: ' + (err.message || 'Unknown error'));
    } finally {
      isActionLoading = false;
    }
  }

  async function removeTrial(trial: Trial) {
    if (!confirm(`Are you sure you want to remove ${trial.lead_name} from trials?`)) return;
    
    isActionLoading = true;
    actionMessage = 'Removing trial...';
    try {
      await apiFetch(`/admin/trials/${trial.id}`, { method: 'DELETE' });
      trials = trials.filter(t => t.id !== trial.id);
    } catch (err: any) {
      alert('Failed to remove: ' + (err.message || 'Unknown error'));
    } finally {
      isActionLoading = false;
    }
  }
</script>

<div class="trials-view">
  {#if isActionLoading}
    <div class="action-loading-overlay">
      <div class="spinner"></div>
      <div>{actionMessage}</div>
    </div>
  {/if}

  <div class="header-row">
    <div class="header-text">
      <h2>Trials Management</h2>
      <p>Manage upcoming trial classes and convert successful trials to students.</p>
    </div>
  </div>

  {#if isLoading}
    <SkeletonLoader type="table" rows={5} cols={5} />
  {:else}
    <div class="filter-bar-card">
      <div class="search-input-wrapper">
        <span class="search-icon"><Icon name="search" size={15} /></span>
        <input 
          type="text" 
          placeholder="Search trials by name or email..." 
          bind:value={searchQuery}
        />
      </div>

      <div class="dropdowns-group">
        <div class="select-wrapper">
          <label for="status-filter">Status:</label>
          <select id="status-filter" bind:value={filterStatus}>
            <option value="All">All</option>
            <option value="Scheduled">Scheduled</option>
            <option value="Completed">Completed</option>
            <option value="No Show">No Show</option>
          </select>
        </div>
      </div>
    </div>

    <div class="table-card">
      <table class="trials-table">
        <thead>
          <tr>
            <th>PROSPECT NAME</th>
            <th>CONTACT INFO</th>
            <th>COURSE</th>
            <th>SCHEDULE</th>
            <th>STATUS</th>
            <th>ACTIONS</th>
          </tr>
        </thead>
        <tbody>
          {#if filteredTrials.length === 0}
            <tr>
              <td colspan="6" class="empty-row">No trials found matching your criteria.</td>
            </tr>
          {:else}
            {#each filteredTrials as trial}
              <tr>
                <td>
                  <div class="name-cell-inner">
                    <div class="avatar-circle">{getInitials(trial.lead_name)}</div>
                    <span class="name-text">{trial.lead_name}</span>
                  </div>
                </td>
                <td>
                  <div class="contact-cell-inner">
                    <div class="email-text">{trial.lead_email}</div>
                  </div>
                </td>
                <td class="course-text">{trial.course}</td>
                <td>
                  <div class="schedule-cell">
                    <span class="date">{trial.trial_date}</span>
                    <span class="time">{trial.trial_time}</span>
                  </div>
                </td>
                <td>
                  <select 
                    class="status-select {trial.status.toLowerCase().replace(' ', '-')}"
                    value={trial.status} 
                    onchange={async (e) => {
                      const newStatus = (e.target as HTMLSelectElement).value;
                      isActionLoading = true;
                      actionMessage = 'Updating trial status...';
                      try {
                        await apiFetch(`/admin/trials/${trial.id}/status`, {
                          method: 'PATCH',
                          body: JSON.stringify({ status: newStatus })
                        });
                        trial.status = newStatus;
                      } catch (err: any) {
                        alert('Failed to update status: ' + (err.message || 'Unknown error'));
                      } finally {
                        isActionLoading = false;
                      }
                    }}
                  >
                    <option value="Scheduled">Scheduled</option>
                    <option value="Completed">Completed</option>
                    <option value="No Show">No Show</option>
                  </select>
                </td>
                <td>
                  <div style="display: flex; gap: 8px; align-items: center;">
                    <button class="action-btn convert" onclick={() => convertToStudent(trial)}>
                      <Icon name="user-check" size={14} /> Move as Student
                    </button>
                    <button class="action-btn remove" onclick={() => removeTrial(trial)}>
                      <Icon name="trash-2" size={14} /> Remove
                    </button>
                  </div>
                </td>
              </tr>
            {/each}
          {/if}
        </tbody>
      </table>
      
      <div class="table-footer">
        <span class="results-count">Showing {filteredTrials.length} of {trials.length} trials</span>
      </div>
    </div>
  {/if}
</div>

<style>
  .trials-view {
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

  /* Table Card */
  .table-card {
    background-color: var(--bg-card);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-md);
    box-shadow: var(--shadow-sm);
    overflow: hidden;
  }

  .trials-table {
    width: 100%;
    border-collapse: collapse;
    text-align: left;
  }

  .trials-table th {
    font-size: 0.75rem;
    font-weight: 700;
    color: var(--text-muted);
    padding: 14px 20px;
    border-bottom: 1px solid var(--border-color);
    background-color: #fafbfc;
  }

  .trials-table td {
    padding: 16px 20px;
    font-size: 0.9rem;
    border-bottom: 1px solid var(--border-color);
    vertical-align: middle;
    white-space: nowrap;
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
    background-color: #e2e8f0;
    color: #4a5568;
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

  .email-text {
    font-size: 0.85rem;
    color: var(--text-muted);
  }

  .course-text {
    font-weight: 500;
    color: var(--text-main);
  }

  .schedule-cell {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .schedule-cell .date {
    font-weight: 600;
    color: var(--text-main);
  }
  
  .schedule-cell .time {
    font-size: 0.8rem;
    color: var(--text-muted);
  }

  .status-select {
    padding: 6px 12px;
    border-radius: var(--radius-md);
    font-size: 0.75rem;
    font-weight: 700;
    border: 1px solid var(--border-color);
    cursor: pointer;
    outline: none;
    transition: all 0.2s ease;
  }
  .status-select.scheduled { background-color: #ebf8ff; color: #2b6cb0; border-color: #bee3f8; }
  .status-select.completed { background-color: #c6f6d5; color: #22543d; border-color: #c6f6d5; }
  .status-select.no-show { background-color: #fff5f5; color: #c53030; border-color: #fed7d7; }

  .action-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 12px;
    border-radius: var(--radius-md);
    font-size: 0.8rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }
  
  .action-btn.convert {
    background-color: var(--primary);
    color: white;
    border: none;
    box-shadow: 0 2px 4px rgba(229, 62, 62, 0.2);
  }
  .action-btn.convert:hover {
    background-color: var(--primary-hover);
  }

  .action-btn.remove {
    background-color: transparent;
    color: #a0aec0;
    border: 1px solid #e2e8f0;
  }
  .action-btn.remove:hover {
    background-color: #fff5f5;
    color: #e53e3e;
    border-color: #fc8181;
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
