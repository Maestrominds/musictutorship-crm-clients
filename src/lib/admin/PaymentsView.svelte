<script lang="ts">
  import Icon from '$lib/Icon.svelte';
  import { onMount } from 'svelte';
  import { apiGet } from '$lib/api';
  import SkeletonLoader from '$lib/SkeletonLoader.svelte';

  // We define a simple interface for the payment row
  interface Payment {
    id: number;
    name: string;
    course: string;
    amount: string;
    paymentDate: string;
  }

  let payments = $state<Payment[]>([]);
  let isLoading = $state(true);

  // Backend: GET /admin/payments returns GetAdminPaymentsRow { id, student_name, course_title, amount, created_at }
  onMount(async () => {
    try {
      const data = await apiGet<any[]>('/admin/payments');
      payments = (data || []).map(p => ({
        id: p.id,
        name: p.student_name || 'Student',
        course: p.course_title || 'Course Tuition',
        amount: `$${p.amount}`,
        paymentDate: p.created_at ? new Date(p.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'
      }));
    } catch {
      payments = []; // Not yet available — show empty state
    } finally {
      isLoading = false;
    }
  });

  let searchStudentName = $state('');

  let filteredPayments = $derived(
    payments.filter(payment => {
      const matchSearch = payment.name.toLowerCase().includes(searchStudentName.toLowerCase());
      return matchSearch;
    })
  );

  function getInitials(name: string) {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 1);
  }
</script>

<div class="payments-view">
  {#if isLoading}
    <SkeletonLoader type="table" rows={6} cols={3} />
  {:else}

  <div class="header-row">
    <div class="header-text">
      <h2>Payments Management</h2>
      <p>Review student tuition and subscription fees.</p>
    </div>
    <div class="header-actions">
      <button class="export-btn">
        <span><Icon name="file" size={14} /></span> Export
      </button>
    </div>
  </div>

  <div class="filter-controls-card">
    <div class="filter-inputs">
      <div class="select-wrapper">
        <label for="date-range">DATE RANGE</label>
        <select id="date-range">
          <option>Last 30 Days</option>
          <option>Last 6 Months</option>
          <option>This Year</option>
        </select>
      </div>

      <div class="search-input-wrapper">
        <label for="student-search">QUICK SEARCH</label>
        <input 
          type="text" 
          id="student-search"
          placeholder="Student name..." 
          bind:value={searchStudentName} 
        />
      </div>
    </div>
  </div>

  <div class="table-card">
    <table class="payments-table">
      <thead>
        <tr>
          <th>STUDENT NAME</th>
          <th>AMOUNT & COURSE</th>
          <th>DATE</th>
        </tr>
      </thead>
      <tbody>
        {#if filteredPayments.length === 0}
          <tr>
            <td colspan="3" class="empty-row">No transaction records found.</td>
          </tr>
        {:else}
          {#each filteredPayments as transaction}
            <tr>
              <td>
                <div class="user-cell-inner">
                  <div class="avatar-circle">{getInitials(transaction.name)}</div>
                  <div class="user-details">
                    <span class="name">{transaction.name}</span>
                  </div>
                </div>
              </td>
              <td>
                <div class="amount-cell-inner">
                  <div class="amount-val">{transaction.amount}</div>
                  <div class="course-sub">{transaction.course}</div>
                </div>
              </td>
              <td class="date-text">{transaction.paymentDate}</td>
            </tr>
          {/each}
        {/if}
      </tbody>
    </table>

    <div class="table-footer">
      <span class="results-count">Showing {filteredPayments.length} payments</span>
    </div>
  </div>
  {/if}
</div>

<style>
  .payments-view {
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
  }

  .export-btn {
    border: 1px solid var(--border-color);
    background-color: var(--bg-card);
    color: var(--text-main);
    font-weight: 600;
    padding: 8px 16px;
    border-radius: var(--radius-md);
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 8px;
    transition: all 0.2s;
  }

  .export-btn:hover {
    background-color: #f7fafc;
  }

  .filter-controls-card {
    background-color: var(--bg-card);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-md);
    padding: 16px 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    box-shadow: var(--shadow-sm);
  }

  .filter-inputs {
    display: flex;
    gap: 20px;
  }

  .select-wrapper label, .search-input-wrapper label {
    display: block;
    font-size: 0.7rem;
    font-weight: 700;
    color: var(--text-muted);
    margin-bottom: 6px;
  }

  .select-wrapper select, .search-input-wrapper input {
    padding: 10px 14px;
    border: 1px solid var(--border-color);
    border-radius: var(--radius-md);
    font-size: 0.9rem;
    color: var(--text-main);
    background-color: #f8fafc;
    min-width: 180px;
    outline: none;
  }

  .table-card {
    background-color: var(--bg-card);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-md);
    box-shadow: var(--shadow-sm);
    overflow: hidden;
  }

  .payments-table {
    width: 100%;
    border-collapse: collapse;
    text-align: left;
  }

  .payments-table th {
    font-size: 0.75rem;
    font-weight: 700;
    color: var(--text-muted);
    padding: 14px 20px;
    border-bottom: 1px solid var(--border-color);
    background-color: #fafbfc;
  }

  .payments-table td {
    padding: 16px 20px;
    font-size: 0.9rem;
    border-bottom: 1px solid var(--border-color);
    vertical-align: middle;
  }

  .user-cell-inner {
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

  .amount-cell-inner {
    display: flex;
    flex-direction: column;
  }

  .amount-val {
    font-weight: 700;
    color: var(--text-main);
    font-size: 1rem;
  }

  .course-sub {
    font-size: 0.8rem;
    color: var(--text-muted);
    font-weight: 500;
  }

  .date-text {
    font-weight: 500;
    color: var(--text-muted);
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
