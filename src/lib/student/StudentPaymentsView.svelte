<script lang="ts">
  import Icon from '$lib/Icon.svelte';
  interface StudentPayment {
    id: number;
    courseName: string;
    amount: string;
    method: string;
    status: 'Paid' | 'Pending';
    date: string;
  }

  import { onMount } from 'svelte';
  import { apiGet } from '$lib/api';

  let paymentsList = $state<StudentPayment[]>([]);

  onMount(async () => {
    try {
      const data = await apiGet<any[]>('/student/payments');
      paymentsList = (data || []).map((p: any) => ({
        id: p.id,
        courseName: p.course_title || 'Course Tuition',
        amount: `$${p.amount}`,
        method: 'Online Payment',
        status: 'Paid',
        date: p.created_at ? new Date(p.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'
      }));
    } catch (err) {
      console.error('Failed to load payments:', err);
    }
  });

  const totalPaid = $derived(
    paymentsList.reduce((sum, p) => sum + parseFloat(p.amount.replace(/[^0-9.]/g, '')), 0)
  );
  const paymentCount = $derived(paymentsList.length);
</script>


<div class="student-payments-view">
  <div class="header-row">
    <div class="header-text">
      <h2>Payments</h2>
      <p>Manage your tuition and view transaction history</p>
    </div>
    <button class="statement-btn">
      <span><Icon name="file" size={14} /></span> Statement
    </button>
  </div>

  <!-- Stats cards -->
  <div class="stats-row">
    <div class="stat-card">
      <span class="label">TOTAL PAID</span>
      <div class="value">${totalPaid.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
      <span class="trend positive">↗ {paymentCount} payments total</span>
    </div>

    <div class="stat-card">
      <span class="label">OUTSTANDING BALANCE</span>
      <div class="value">$0.00</div>
      <span class="trend">⏳ No pending invoices</span>
    </div>

    <div class="stat-card">
      <span class="label">NEXT PAYMENT DATE</span>
      <div class="value">N/A</div>
      <span class="trend"><Icon name="activity" size={12} /> Billing managed by Admin</span>
    </div>
  </div>

  <div class="table-card">
    <div class="table-card-header">
      <h3>Payment History</h3>
      <div class="actions">
        <button class="icon-btn">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M4 6h16M6 12h12M10 18h4" />
          </svg>
        </button>
        <button class="icon-btn">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 5v14M5 12h14" />
          </svg>
        </button>
      </div>
    </div>

    <div class="table-responsive">
      <table class="history-table">
        <thead>
          <tr>
            <th>COURSE NAME</th>
            <th>AMOUNT</th>
            <th>PAYMENT METHOD</th>
            <th>STATUS</th>
            <th>DATE</th>
            <th>ACTION</th>
          </tr>
        </thead>
        <tbody>
          {#each payments as pay}
            <tr>
              <td class="course-cell">
                <span class="course-icon"><Icon name="music" size={16} /></span>
                <div class="course-info">
                  <span class="name">{pay.courseName}</span>
                </div>
              </td>
              <td class="amount-text">{pay.amount}</td>
              <td class="method-text">
                <span class="card-icon"><Icon name="credit-card" size={14} /></span> {pay.method}
              </td>
              <td>
                <span class="status-badge present">{pay.status}</span>
              </td>
              <td class="date-text">{pay.date}</td>
              <td>
                <button class="action-btn">•••</button>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>

    <div class="table-footer">
      <span class="results-count">Showing 1-{payments.length} of 24 transactions</span>
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
  .student-payments-view {
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

  .statement-btn {
    background-color: var(--primary);
    color: white;
    border: none;
    border-radius: var(--radius-md);
    padding: 10px 18px;
    font-weight: 600;
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(229, 62, 62, 0.2);
  }

  /* Stats Row */
  .stats-row {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 20px;
  }

  .stat-card {
    background-color: var(--bg-card);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-md);
    padding: 20px;
    box-shadow: var(--shadow-sm);
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .stat-card .label {
    font-size: 0.75rem;
    color: var(--text-muted);
    font-weight: 700;
    letter-spacing: 0.5px;
  }

  .stat-card .value {
    font-size: 1.6rem;
    font-weight: 700;
    color: var(--text-main);
    margin-top: 4px;
  }

  .stat-card .trend {
    font-size: 0.75rem;
    font-weight: 700;
    margin-top: 4px;
  }

  .stat-card .trend.positive { color: #38a169; }
  .stat-card .trend.warning { color: #dd6b20; }
  .stat-card .trend.negative { color: #e53e3e; }

  /* Table styling */
  .table-card {
    background-color: var(--bg-card);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-md);
    box-shadow: var(--shadow-sm);
    overflow: hidden;
  }

  .table-card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px;
    border-bottom: 1px solid var(--border-color);
  }

  .table-card-header h3 {
    font-size: 0.95rem;
    font-weight: 700;
    color: var(--text-main);
  }

  .actions {
    display: flex;
    gap: 8px;
  }

  .icon-btn {
    border: 1px solid var(--border-color);
    background: transparent;
    padding: 6px 10px;
    border-radius: var(--radius-sm);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--text-muted);
  }

  .table-responsive {
    overflow-x: auto;
  }

  .history-table {
    width: 100%;
    border-collapse: collapse;
    text-align: left;
    min-width: 600px;
  }

  .history-table th {
    font-size: 0.75rem;
    font-weight: 700;
    color: var(--text-muted);
    padding: 14px 20px;
    border-bottom: 1px solid var(--border-color);
    background-color: #fafbfc;
  }

  .history-table td {
    padding: 16px 20px;
    font-size: 0.9rem;
    border-bottom: 1px solid var(--border-color);
    vertical-align: middle;
  }

  .course-cell {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .course-icon {
    width: 32px;
    height: 32px;
    border-radius: var(--radius-sm);
    background-color: #f7fafc;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid var(--border-color);
  }

  .course-info {
    display: flex;
    flex-direction: column;
  }

  .course-info .name {
    font-weight: 700;
    color: var(--text-main);
  }

  .amount-text {
    font-weight: 700;
    color: var(--text-main);
  }

  .method-text {
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

  .status-badge.present { background-color: #c6f6d5; color: #22543d; }

  .date-text {
    font-weight: 500;
    color: var(--text-muted);
  }

  .action-btn {
    border: none;
    background: transparent;
    color: var(--text-muted);
    font-size: 1.15rem;
    cursor: pointer;
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
  }

  .pag-btn.active {
    background-color: var(--primary);
    color: white;
    border-color: var(--primary);
  }

  @media (max-width: 768px) {
    .stats-row { grid-template-columns: 1fr; }
  }
</style>
