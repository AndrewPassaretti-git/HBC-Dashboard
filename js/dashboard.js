/**
 * dashboard.js — Home page render (Tier 1 trailing-avg KPIs + forward schedule + charts)
 */

// Module-level trailing period — persists across re-renders within a session.
let trailingPeriod = 8;

const Dashboard = {

  render(container) {
    const all    = Storage.getAll();
    const latest = all.length ? all[0] : null;

    // Forward schedule pulls from the prior completed week (index 1); fall back to index 0
    // if fewer than two entries exist.
    const scheduleSource = all.length > 1 ? all[1] : (all.length === 1 ? all[0] : null);

    // Completed weeks for all charts: skip index 0 (current in-progress week),
    // take up to 8 prior completed weeks, then reverse to oldest-first for display.
    const completed = all.slice(1, 9).reverse();

    const html = `
      <div class="page">
        <div class="page-header">
          <div>
            <h1 class="page-title">Dashboard</h1>
            <p class="page-subtitle" style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
              ${latest
                ? 'Week of ' + formatWeekRange(latest.weekStart, latest.weekEnd)
                : 'No data yet — enter your first week to get started'}
              ${latest?.adsPaused ? '<span class="tag amber" style="vertical-align:middle">Ads paused</span>' : ''}
            </p>
          </div>
          <div style="display:flex;align-items:center;gap:8px">
            <span style="font-size:11px;color:var(--text-muted)">Trailing</span>
            <div class="tab-switcher">
              <button class="tab-btn ${trailingPeriod === 8  ? 'active' : ''}" data-trailing="8">8 Weeks</button>
              <button class="tab-btn ${trailingPeriod === 12 ? 'active' : ''}" data-trailing="12">12 Weeks</button>
            </div>
          </div>
        </div>

        ${this.renderTier1(all, latest)}

        <div class="home-bottom">
          ${this.renderForwardSchedule(scheduleSource)}
          ${this.renderSparklinePanel(completed)}
        </div>
      </div>
    `;
    container.innerHTML = html;

    // Wire trailing-period buttons
    container.querySelectorAll('[data-trailing]').forEach(btn => {
      btn.addEventListener('click', () => {
        trailingPeriod = parseInt(btn.dataset.trailing, 10);
        this.render(container);
      });
    });

    // ── Draw all three charts after DOM is ready ──────────────

    // 1. Revenue sparkline (teal)
    const revCanvas = container.querySelector('#revenueSparkline');
    if (revCanvas) {
      Charts.drawSparkline(revCanvas, completed.map(e => e.grossRevenue || 0));
    }

    // 2. Schedule value bar chart (teal)
    const schedCanvas = container.querySelector('#scheduleValueChart');
    if (schedCanvas) {
      const schedData   = completed.map(e => e.scheduleValue ?? null);
      const schedLabels = completed.map(e => formatWeekShort(e.weekEnd || e.weekStart));
      Charts.drawBarChart(schedCanvas, schedData, schedLabels);
    }

    // 3. Payroll % of revenue sparkline (amber)
    const payrollCanvas = container.querySelector('#payrollPctSparkline');
    if (payrollCanvas) {
      const payrollData = completed.map(e => {
        const rev = e.grossRevenue || 0;
        if (!rev) return null;
        return ((e.payroll || 0) + (e.derekGP || 0)) / rev;
      });
      Charts.drawSparkline(payrollCanvas, payrollData, {
        lineColor: '#f59e0b',
        fillColor: 'rgba(245,158,11,0.12)',
        dotColor:  '#f59e0b',
      });
    }
  },

  // ── Tier 1 KPIs (trailing averages) ────────────────────────
  renderTier1(all, latest) {
    const n     = trailingPeriod;
    const slice = all.slice(0, n);
    const label = `${n}-wk avg`;

    // Helper: average of numeric values from a mapping function (nulls excluded)
    const avg = (arr, fn) => {
      const vals = arr.map(fn).filter(v => v != null && !isNaN(v));
      return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
    };

    // 1. Revenue — trailing avg of grossRevenue
    const revAvg = avg(slice, e => e.grossRevenue ?? null);

    // 2. Net Margin — trailing avg, computed per-entry; skip weeks with no revenue
    const marginAvg = avg(slice, e => {
      const rev = e.grossRevenue || 0;
      if (!rev) return null;
      const totalExp = (e.payroll || 0) + (e.derekGP || 0) + (e.adSpendExpense || 0) +
                       (e.vehicleFuel || 0) + (e.suppliesChemicals || 0) + (e.miscOther || 0);
      return (rev - totalExp) / rev;
    });

    // 3. Close Rate — trailing avg, only weeks where quotesSentCount > 0
    const crAvg = avg(
      slice.filter(e => (e.quotesSentCount || 0) > 0),
      e => (e.quotesConvertedCount || 0) / e.quotesSentCount
    );

    // 4. On-Time Rate — trailing avg, only weeks where jobsCompleted > 0
    const otrAvg = avg(
      slice.filter(e => (e.jobsCompleted || 0) > 0),
      e => (e.jobsOnTime || 0) / e.jobsCompleted
    );

    // 5. Current Pipeline — latest week's quotesAwaitingValue (point-in-time, not averaged)
    const currentPipeline = latest?.quotesAwaitingValue ?? null;

    // 6. Payroll % of revenue — (payroll + derekGP) / grossRevenue per week, then averaged;
    //    skip any week where grossRevenue is zero or missing
    const payrollPctAvg = avg(slice, e => {
      const rev = e.grossRevenue || 0;
      if (!rev) return null;
      return ((e.payroll || 0) + (e.derekGP || 0)) / rev;
    });

    return `
      <div class="tier1-grid">
        <div class="metric-card tier1">
          <span class="metric-label">Revenue <span style="font-size:10px;opacity:.55;font-weight:400">${label}</span></span>
          <span class="metric-value">${revAvg != null ? fmtDollar(revAvg) : '—'}</span>
        </div>
        <div class="metric-card tier1">
          <span class="metric-label">Net Margin <span style="font-size:10px;opacity:.55;font-weight:400">${label}</span></span>
          <span class="metric-value">${marginAvg != null ? fmtPct(marginAvg) : '—'}</span>
        </div>
        <div class="metric-card tier1">
          <span class="metric-label">Close Rate <span style="font-size:10px;opacity:.55;font-weight:400">${label}</span></span>
          <span class="metric-value">${crAvg != null ? fmtPct(crAvg) : '—'}</span>
        </div>
        <div class="metric-card tier1">
          <span class="metric-label">On-Time Rate <span style="font-size:10px;opacity:.55;font-weight:400">${label}</span></span>
          <span class="metric-value">${otrAvg != null ? fmtPct(otrAvg) : '—'}</span>
        </div>
        <div class="metric-card tier1">
          <span class="metric-label">Current Pipeline</span>
          <span class="metric-value">${currentPipeline != null ? fmtDollar(currentPipeline) : '—'}</span>
        </div>
        <div class="metric-card tier1">
          <span class="metric-label">Payroll % of revenue <span style="font-size:10px;opacity:.55;font-weight:400">${label}</span></span>
          <span class="metric-value">${payrollPctAvg != null ? fmtPct(payrollPctAvg) : '—'}</span>
        </div>
      </div>
    `;
  },

  // ── Forward schedule panel ───────────────────────────────────
  // Point-in-time values from the prior completed week entry (index 1).
  renderForwardSchedule(entry) {
    const hasLength = entry?.scheduleLength != null;
    const hasValue  = entry?.scheduleValue  != null;

    // "As of [week end]" date label
    const asOf = entry?.weekEnd
      ? formatWeekRange(entry.weekEnd, entry.weekEnd)
      : null;

    return `
      <div class="panel">
        <div class="panel-header">
          <span class="panel-title">Forward Schedule</span>
          ${asOf ? `<span class="muted" style="font-size:11px">As of ${asOf}</span>` : ''}
        </div>
        <div class="panel-body" style="padding:12px 20px 16px">
          <div class="stat-row">
            <span class="stat-label">Days booked out</span>
            <span class="stat-value mono">${hasLength ? entry.scheduleLength + ' days' : '—'}</span>
          </div>
          <div class="stat-row">
            <span class="stat-label">Value on books</span>
            <span class="stat-value mono">${hasValue ? fmtDollar(entry.scheduleValue) : '—'}</span>
          </div>
        </div>
      </div>
    `;
  },

  // ── Chart panel (revenue sparkline + schedule bar + payroll % sparkline) ──
  // `completed` is already sliced (all.slice(1,9).reverse()) and passed in from render().
  renderSparklinePanel(completed) {
    const hasData = completed.length > 0;

    // Oldest and newest week-end labels for sparkline footers
    const oldest = hasData ? formatWeekShort(completed[0].weekEnd || completed[0].weekStart) : '';
    const newest = hasData ? formatWeekShort(completed[completed.length - 1].weekEnd || completed[completed.length - 1].weekStart) : '';

    // Most-recent completed week values for header annotations
    const latestRev = hasData ? (completed[completed.length - 1].grossRevenue || 0) : null;
    const latestPayrollPct = (() => {
      if (!hasData) return null;
      const e   = completed[completed.length - 1];
      const rev = e.grossRevenue || 0;
      if (!rev) return null;
      return ((e.payroll || 0) + (e.derekGP || 0)) / rev;
    })();

    return `
      <div class="panel sparkline-panel">

        <!-- Revenue sparkline -->
        <div class="panel-header">
          <span class="panel-title">Revenue — last 8 weeks</span>
          ${latestRev != null ? `<span class="mono" style="font-size:12px;color:var(--teal)">${fmtDollar(latestRev)}</span>` : ''}
        </div>
        <div class="panel-body" style="padding-bottom:4px">
          <div class="sparkline-wrap">
            <canvas id="revenueSparkline"></canvas>
          </div>
          ${hasData ? `<div class="sparkline-footer"><span>${oldest}</span><span>${newest}</span></div>` : ''}
        </div>

        <!-- Schedule value bar chart -->
        <div class="panel-header" style="border-top:1px solid var(--border)">
          <span class="panel-title">Schedule value — last 8 weeks</span>
        </div>
        <div class="panel-body" style="padding-top:6px;padding-bottom:4px">
          <div class="sparkline-wrap" style="height:90px">
            <canvas id="scheduleValueChart"></canvas>
          </div>
        </div>

        <!-- Payroll % of revenue sparkline (amber) -->
        <div class="panel-header" style="border-top:1px solid var(--border)">
          <span class="panel-title">Payroll % of revenue — last 8 weeks</span>
          ${latestPayrollPct != null ? `<span class="mono" style="font-size:12px;color:#f59e0b">${fmtPct(latestPayrollPct)}</span>` : ''}
        </div>
        <div class="panel-body" style="padding-top:6px">
          <div class="sparkline-wrap">
            <canvas id="payrollPctSparkline"></canvas>
          </div>
          ${hasData ? `<div class="sparkline-footer"><span>${oldest}</span><span>${newest}</span></div>` : ''}
        </div>

      </div>
    `;
  }

};
