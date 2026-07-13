<script lang="ts">
  import Icon from '$lib/Icon.svelte';
  import { onDestroy } from 'svelte';
  import { studentsStore, type Student } from '../dataStore';

  let students: Student[] = $state([]);
  const unsubscribe = studentsStore.subscribe((val) => {
    students = val;
  });

  onDestroy(() => {
    unsubscribe();
  });

  let activeTab = $state<'All' | 'Paid' | 'Pending' | 'Failed'>('All');
  let searchStudentName = $state('');

  let filteredPayments = $derived(
    students.filter(student => {
      const matchTab = activeTab === 'All' || student.paymentStatus === activeTab;
      const matchSearch = student.name.toLowerCase().includes(searchStudentName.toLowerCase());
      return matchTab && matchSearch;
    })
  );

  function getInitials(name: string) {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }
</script>

<div class="payments-view">
  <div class="header-row">
    <div class="header-text">
      <h2>Payments Management</h2>
      <p>Review and manage student tuition and subscription fees.</p>
    </div>
    <div class="header-actions">
      <button class="export-btn">
        <span><Icon name="file" size={14} /></span> Export
      </button>
    </div>
  </div>

  <div class="filter-controls-card">
    <div class="status-tabs">
      <button class="tab-btn" class:active={activeTab === 'All'} onclick={() => activeTab = 'All'}>All</button>
      <button class="tab-btn" class:active={activeTab === 'Paid'} onclick={() => activeTab = 'Paid'}>Paid</button>
      <button class="tab-btn" class:active={activeTab === 'Pending'} onclick={() => activeTab = 'Pending'}>Pending</button>
      <button class="tab-btn" class:active={activeTab === 'Failed'} onclick={() => activeTab = 'Failed'}>Failed</button>
    </div>

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
          <th>AMOUNT</th>
          <th>METHOD</th>
          <th>STATUS</th>
          <th>DATE</th>
          <th>ACTIONS</th>
        </tr>
      </thead>
      <tbody>
        {#if filteredPayments.length === 0}
          <tr>
            <td colspan="6" class="empty-row">No transaction records found.</td>
          </tr>
        {:else}
          {#each filteredPayments as transaction}
            <tr>
              <td>
                <div class="user-cell-inner">
                  <div class="avatar-circle">{getInitials(transaction.name)}</div>
                  <div class="user-details">
                    <span class="name">{transaction.name}</span>
                    <span class="email">{transaction.email}</span>
                  </div>
                </div>
              </td>
              <td>
                <div class="amount-cell-inner">
                  <div class="amount-val">{transaction.amount}</div>
                  <div class="course-sub">{transaction.course}</div>
                </div>
              </td>
              <td class="method-text">
                <span class="card-icon"><Icon name="credit-card" size={14} /></span> {transaction.paymentMethod}
              </td>
              <td>
                <span class="status-badge" class:paid={transaction.paymentStatus === 'Paid'} class:pending={transaction.paymentStatus === 'Pending' || transaction.paymentStatus === 'Overdue'} class:failed={transaction.paymentStatus === 'Failed'}>
                  {transaction.paymentStatus === 'Overdue' ? 'Pending' : transaction.paymentStatus}
                </span>
              </td>
              <td class="date-text">{transaction.paymentDate}</td>
              <td>
                <button class="action-btn">•••</button>
              </td>
            </tr>
          {/each}
        {/if}
      </tbody>
    </table>

    <div class="table-footer">
      <span class="results-count">Showing 1 to {filteredPayments.length} of {students.length} payments</span>
      <div class="pagination">
        <button class="pag-btn prev">◀</button>
        <button class="pag-btn active">1</button>
        <button class="pag-btn">2</button>
        <button class="pag-btn">3</button>
        <span class="pag-dots">...</span>
        <button class="pag-btn">9</button>
        <button class="pag-btn next">▶</button>
      </div>
    </div>
  </div>
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

  /* Filter controls */
  .filter-controls-card {
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

  .status-tabs {
    display: flex;
    gap: 8px;
  }

  .tab-btn {
    border: none;
    background: transparent;
    padding: 8px 16px;
    font-size: 0.85rem;
    font-weight: 700;
    color: var(--text-muted);
    cursor: pointer;
    border-radius: var(--radius-sm);
    transition: all 0.2s;
  }

  .tab-btn.active {
    background-color: var(--primary);
    color: white;
  }

  .filter-inputs {
    display: flex;
    gap: 16px;
    align-items: center;
  }

  .select-wrapper {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .select-wrapper label, .search-input-wrapper label {
    font-size: 0.65rem;
    font-weight: 700;
    color: var(--text-muted);
    letter-spacing: 0.5px;
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

  .search-input-wrapper {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .search-input-wrapper input {
    border: 1px solid var(--border-color);
    padding: 8px 12px;
    border-radius: var(--radius-sm);
    background-color: var(--bg-card);
    color: var(--text-main);
    outline: none;
    font-size: 0.85rem;
    width: 180px;
  }

  .search-input-wrapper input:focus {
    border-color: var(--primary);
  }

  /* Table Card */
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
    background-color: #fed7d7;
    color: #c53030;
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

  .amount-cell-inner {
    display: flex;
    flex-direction: column;
  }

  .amount-val {
    font-weight: 700;
    color: var(--text-main);
  }

  .course-sub {
    font-size: 0.75rem;
    color: var(--text-muted);
  }

  .method-text {
    font-weight: 500;
    color: var(--text-main);
  }

  .card-icon {
    margin-right: 4px;
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

  .status-badge.failed {
    background-color: #fed7d7;
    color: #9b2c2c;
  }

  .date-text {
    font-weight: 500;
    color: var(--text-muted);
  }

  .action-btn {
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

  @media (max-width: 1024px) {
    .filter-controls-card {
      flex-direction: column;
      align-items: stretch;
    }
    .filter-inputs {
      justify-content: space-between;
    }
  }
</style>
