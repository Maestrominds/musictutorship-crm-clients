<script lang="ts">
  import Icon from '$lib/Icon.svelte';
  import { onMount } from 'svelte';
  import { apiGet } from '$lib/api';
  import SkeletonLoader from '$lib/SkeletonLoader.svelte';

  interface Trial {
    id: number;
    name: string;
    email: string;
    course: string;
    trial_time: string;
    gmeet_link: string;
    status: string;
  }

  let trials = $state<Trial[]>([]);
  let isLoading = $state(true);
  let errorMsg = $state('');

  onMount(async () => {
    try {
      const data = await apiGet<any[]>('/admin/trials');
      trials = (data || []).map(t => ({
        id: t.id,
        name: t.name,
        email: t.email,
        course: t.course || 'Unknown',
        trial_time: t.trial_time 
          ? new Date(t.trial_time).toLocaleString('en-US', { timeZone: 'UTC', month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
          : 'N/A',
        gmeet_link: t.gmeet_link || '',
        status: t.status || 'in_review'
      }));
    } catch (err) {
      errorMsg = err instanceof Error ? err.message : 'Failed to load trials';
    } finally {
      isLoading = false;
    }
  });
</script>

<div class="trials-view">
  <div class="header-row">
    <div class="header-text">
      <h2>Booked Trials</h2>
      <p>View all leads who have an upcoming trial class booked.</p>
    </div>
  </div>

  {#if isLoading}
    <SkeletonLoader type="table" rows={6} cols={5} />
  {:else if errorMsg}
    <div class="empty-state error"><p>⚠️ {errorMsg}</p></div>
  {:else}
    <div class="table-card">
      <table class="trials-table">
        <thead>
          <tr>
            <th>LEAD NAME</th>
            <th>EMAIL</th>
            <th>COURSE</th>
            <th>TRIAL DATE & TIME</th>
            <th>MEETING LINK</th>
          </tr>
        </thead>
        <tbody>
          {#if trials.length === 0}
            <tr>
              <td colspan="5" class="empty-row">No booked trials found.</td>
            </tr>
          {:else}
            {#each trials as trial}
              <tr>
                <td style="font-weight: 600; color: var(--text-main);">{trial.name}</td>
                <td style="color: var(--text-muted);">{trial.email}</td>
                <td style="font-weight: 500;">{trial.course}</td>
                <td style="color: #dd6b20; font-weight: 600;">{trial.trial_time}</td>
                <td>
                  {#if trial.gmeet_link}
                    <a href={trial.gmeet_link} target="_blank" style="color: #3182ce; text-decoration: underline;">{trial.gmeet_link}</a>
                  {:else}
                    <span style="color: var(--text-muted);">Generating...</span>
                  {/if}
                </td>
              </tr>
            {/each}
          {/if}
        </tbody>
      </table>
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
  }

  .empty-row {
    text-align: center;
    color: var(--text-muted);
    padding: 32px !important;
  }

  .error {
    color: #e53e3e;
    text-align: center;
    padding: 40px;
  }
</style>
