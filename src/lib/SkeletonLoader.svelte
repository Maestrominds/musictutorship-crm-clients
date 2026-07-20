<script lang="ts">
  interface Props {
    type?: 'table' | 'cards' | 'dashboard' | 'list';
    rows?: number;
    cols?: number;
  }
  let { type = 'table', rows = 6, cols = 5 }: Props = $props();
</script>

{#if type === 'table'}
  <div class="skeleton-wrap">
    <!-- Header bar skeleton -->
    <div class="sk-header-row">
      <div>
        <div class="sk-block sk-title"></div>
        <div class="sk-block sk-subtitle"></div>
      </div>
      <div class="sk-block sk-btn-stub"></div>
    </div>

    <!-- Filter/Tab bar skeleton -->
    <div class="sk-filter-bar">
      {#each Array(3) as _}
        <div class="sk-block sk-tab"></div>
      {/each}
      <div style="flex:1"></div>
      <div class="sk-block sk-input"></div>
      <div class="sk-block sk-input"></div>
    </div>

    <!-- Table skeleton -->
    <div class="sk-card">
      <!-- Table head -->
      <div class="sk-table-head">
        {#each Array(cols) as _}
          <div class="sk-block sk-th"></div>
        {/each}
      </div>

      <!-- Table rows -->
      {#each Array(rows) as _, i}
        <div class="sk-table-row" style="animation-delay: {i * 60}ms">
          <!-- First cell with avatar -->
          <div class="sk-user-cell">
            <div class="sk-block sk-avatar"></div>
            <div>
              <div class="sk-block sk-name"></div>
              <div class="sk-block sk-email"></div>
            </div>
          </div>
          {#each Array(cols - 1) as _}
            <div class="sk-block sk-cell"></div>
          {/each}
        </div>
      {/each}
    </div>
  </div>

{:else if type === 'cards'}
  <div class="sk-cards-grid">
    {#each Array(rows) as _, i}
      <div class="sk-card sk-stat-card" style="animation-delay: {i * 80}ms">
        <div class="sk-stat-top">
          <div class="sk-block sk-icon-box"></div>
          <div class="sk-block sk-trend-pill"></div>
        </div>
        <div class="sk-block sk-big-num"></div>
        <div class="sk-block sk-label"></div>
      </div>
    {/each}
  </div>

{:else if type === 'dashboard'}
  <div class="sk-wrap">
    <!-- Stats row -->
    <div class="sk-stats-row">
      {#each Array(4) as _, i}
        <div class="sk-card sk-stat-card" style="animation-delay: {i * 80}ms">
          <div class="sk-stat-top">
            <div class="sk-block sk-icon-box"></div>
            <div class="sk-block sk-trend-pill"></div>
          </div>
          <div class="sk-block sk-big-num"></div>
          <div class="sk-block sk-label"></div>
        </div>
      {/each}
    </div>

    <!-- Two-column grid -->
    <div class="sk-two-col">
      {#each Array(2) as _}
        <div class="sk-card sk-panel">
          <div class="sk-block sk-panel-title"></div>
          {#each Array(4) as _, i}
            <div class="sk-list-item" style="animation-delay: {i * 70}ms">
              <div class="sk-block sk-avatar"></div>
              <div style="flex:1">
                <div class="sk-block sk-name"></div>
                <div class="sk-block sk-email"></div>
              </div>
              <div class="sk-block sk-badge"></div>
            </div>
          {/each}
        </div>
      {/each}
    </div>
  </div>

{:else if type === 'list'}
  <div class="sk-wrap">
    <div class="sk-header-row">
      <div>
        <div class="sk-block sk-title"></div>
        <div class="sk-block sk-subtitle"></div>
      </div>
    </div>
    <div class="sk-card">
      {#each Array(rows) as _, i}
        <div class="sk-list-item" style="animation-delay: {i * 60}ms">
          <div class="sk-block sk-avatar"></div>
          <div style="flex:1">
            <div class="sk-block sk-name"></div>
            <div class="sk-block sk-email"></div>
          </div>
          <div class="sk-block sk-badge"></div>
          <div class="sk-block sk-cell"></div>
        </div>
      {/each}
    </div>
  </div>
{/if}

<style>
  /* Base shimmer keyframe */
  @keyframes shimmer {
    0%   { background-position: -600px 0; }
    100% { background-position: 600px 0; }
  }

  .sk-block {
    background: linear-gradient(90deg,
      #f0f4f8 25%,
      #e2e8f0 50%,
      #f0f4f8 75%
    );
    background-size: 600px 100%;
    animation: shimmer 1.4s ease-in-out infinite;
    border-radius: 6px;
  }

  /* Layout wrappers */
  .sk-wrap, .skeleton-wrap {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  /* Header row */
  .sk-header-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 16px;
  }
  .sk-title  { width: 200px; height: 28px; margin-bottom: 8px; }
  .sk-subtitle { width: 280px; height: 16px; }
  .sk-btn-stub { width: 100px; height: 38px; border-radius: 8px; }

  /* Filter/tab bar */
  .sk-filter-bar {
    background: #fff;
    border: 1px solid #edf2f7;
    border-radius: 10px;
    padding: 14px 16px;
    display: flex;
    align-items: center;
    gap: 10px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.04);
  }
  .sk-tab   { width: 64px; height: 32px; border-radius: 6px; }
  .sk-input { width: 140px; height: 34px; border-radius: 6px; }

  /* Card wrapper */
  .sk-card {
    background: #fff;
    border: 1px solid #edf2f7;
    border-radius: 10px;
    overflow: hidden;
    box-shadow: 0 1px 3px rgba(0,0,0,0.04);
  }

  /* Table head */
  .sk-table-head {
    display: flex;
    gap: 16px;
    padding: 14px 20px;
    border-bottom: 1px solid #edf2f7;
    background: #fafbfc;
  }
  .sk-th { height: 12px; flex: 1; border-radius: 4px; }

  /* Table rows */
  .sk-table-row {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 16px 20px;
    border-bottom: 1px solid #edf2f7;
  }
  .sk-table-row:last-child { border-bottom: none; }

  .sk-user-cell {
    display: flex;
    align-items: center;
    gap: 10px;
    flex: 1.4;
  }

  .sk-avatar  { width: 36px; height: 36px; border-radius: 50%; flex-shrink: 0; }
  .sk-name    { width: 100px; height: 13px; margin-bottom: 6px; }
  .sk-email   { width: 130px; height: 11px; }
  .sk-cell    { flex: 1; height: 14px; border-radius: 6px; }
  .sk-badge   { width: 64px; height: 22px; border-radius: 999px; }

  /* Stats cards grid */
  .sk-stats-row, .sk-cards-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 20px;
  }

  .sk-stat-card {
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    border-radius: 12px;
  }
  .sk-stat-top {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .sk-icon-box   { width: 40px; height: 40px; border-radius: 8px; }
  .sk-trend-pill { width: 52px; height: 22px; border-radius: 999px; }
  .sk-big-num    { width: 80px; height: 30px; border-radius: 6px; }
  .sk-label      { width: 120px; height: 13px; border-radius: 4px; }

  /* Two column panels */
  .sk-two-col {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
  }

  .sk-panel {
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 14px;
  }
  .sk-panel-title { width: 160px; height: 18px; margin-bottom: 4px; }

  /* List items */
  .sk-list-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 14px 20px;
    border-bottom: 1px solid #edf2f7;
  }
  .sk-list-item:last-child { border-bottom: none; }
</style>
