<script lang="ts">
  import Icon from '$lib/Icon.svelte';
  import SkeletonLoader from '$lib/SkeletonLoader.svelte';
  interface StudentPayment {
    id: number;
    courseName: string;
    amount: string;
    date: string;
  }

  import { onMount } from 'svelte';
  import { apiGet } from '$lib/api';

  let paymentsList = $state<StudentPayment[]>([]);
  let isLoading = $state(true);

  // Backend: GET /student/payments returns Payment model { id, student_id, course_id, amount, created_at }
  // Note: no course_title or status field in the Payment model.
  onMount(async () => {
    try {
      const data = await apiGet<any[]>('/student/payments');
      paymentsList = (data || []).map((p: any) => ({
        id: p.id,
        courseName: `Course #${p.course_id}`,
        amount: `$${p.amount}`,
        date: p.created_at ? new Date(p.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'
      }));
    } catch (err) {
      console.error('Failed to load payments:', err);
    } finally {
      isLoading = false;
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
  {#if isLoading}
    <SkeletonLoader type="table" rows={6} cols={3} />
  {:else}
    <div class="stats-row">
      <div class="stat-card">
        <span class="label">TOTAL PAID</span>
        <div class="value">${totalPaid.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
        <span class="trend positive">↗ {paymentCount} payments total</span>
      </div>

      <div class="stat-card">
        <span class="label">PAYMENT COUNT</span>
        <div class="value">{paymentCount}</div>
        <span class="trend">📋 All recorded payments</span>
      </div>

      <div class="stat-card">
        <span class="label">BILLING</span>
        <div class="value">Managed</div>
        <span class="trend"><Icon name="activity" size={12} /> Managed by Admin</span>
      </div>
    </div>

    <div class="table-card">
      <div class="table-card-header">
        <h3>Payment History</h3>
      </div>

      <div class="table-responsive">
        <table class="history-table">
          <thead>
            <tr>
              <th>COURSE</th>
              <th>AMOUNT</th>
              <th>DATE</th>
            </tr>
          </thead>
          <tbody>
            {#each paymentsList as pay}
              <tr>
                <td class="course-cell">
                  <span class="course-icon"><Icon name="music" size={16} /></span>
                  <div class="course-info">
                    <span class="name">{pay.courseName}</span>
                  </div>
                </td>
                <td class="amount-text">{pay.amount}</td>
                <td class="date-text">{pay.date}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>

      <div class="table-footer">
        <span class="results-count">Showing {paymentsList.length} transactions</span>
      </div>
    </div>
  {/if}
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
    font-weight: 700;
    color: var(--text-muted);
    letter-spacing: 0.5px;
  }

  .stat-card .value {
    font-size: 1.8rem;
    font-weight: 700;
    color: var(--text-main);
  }

  .stat-card .trend {
    font-size: 0.8rem;
    color: var(--text-muted);
    font-weight: 500;
  }

  .stat-card .trend.positive {
    color: #38a169;
  }

  /* Table */
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
    padding: 20px 24px;
    border-bottom: 1px solid var(--border-color);
  }

  .table-card-header h3 {
    font-size: 1.1rem;
    font-weight: 700;
    color: var(--text-main);
  }

  .history-table {
    width: 100%;
    border-collapse: collapse;
    text-align: left;
  }

  .history-table th {
    font-size: 0.75rem;
    font-weight: 700;
    color: var(--text-muted);
    padding: 14px 24px;
    border-bottom: 1px solid var(--border-color);
    background-color: #fafbfc;
  }

  .history-table td {
    padding: 16px 24px;
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
    width: 36px;
    height: 36px;
    border-radius: 8px;
    background-color: #ebf8ff;
    color: #3182ce;
    display: flex;
    align-items: center;
    justify-content: center;
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

  .date-text {
    color: var(--text-muted);
    font-weight: 500;
  }

  .table-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 24px;
    background-color: #fafbfc;
  }

  .results-count {
    font-size: 0.85rem;
    color: var(--text-muted);
    font-weight: 500;
  }
</style>
