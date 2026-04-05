/**
 * dashboard.js — Home page render (Tier 1 trailing-avg KPIs + deltas + sparkline)
 */

// Module-level trailing period — persists across re-renders within a session.
let trailingPeriod = 8;

const Dashboard = {

  render(container) {
    const all    = Storage.getAll();
    const latest = all.length     ? all[0] : null;
    const prev   = all.length > 1 ? all[1] : null;

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
          ${this.renderDeltaPanel(latest, prev)}
          ${this.renderSparklinePanel(all)}
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

    // Draw sparkline after DOM is ready
    const canvas = container.querySelector('#revenueSparkline');
    if (canvas) {
      const revenueData = all.slice(0, 8).reverse().map(e => e.grossRevenue || 0);
      Charts.drawSparkline(canvas, revenueData);
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

    // 2. Net Margin — trailing avg, computed per-entry
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

    // 5. Current Pipeline — latest week's quotesAwaitingValue (not an average)
    const currentPipeline = latest?.quotesAwaitingValue ?? null;

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
      </div>
    `;
  },

  // ── Week-over-week delta panel ──────────────────────────────
  // Compares the most recent completed week against the prior week.
  renderDeltaPanel(rawCurr, rawPrev) {
    // Compute our own derived values using the new field names
    const derive = (e) => {
      if (!e) return null;
      const rev = e.grossRevenue || 0;
      const totalExp = (e.payroll || 0) + (e.derekGP || 0) + (e.adSpendExpense || 0) +
                       (e.vehicleFuel || 0) + (e.suppliesChemicals || 0) + (e.miscOther || 0);
      const netProfit = rev - totalExp;
      return {
        revenue:      e.grossRevenue,
        netMargin:    rev ? netProfit / rev : 0,
        closeRate:    (e.quotesSentCount || 0) > 0
                        ? (e.quotesConvertedCount || 0) / e.quotesSentCount : 0,
        onTimeRate:   (e.jobsCompleted || 0) > 0
                        ? (e.jobsOnTime || 0) / e.jobsCompleted : 0,
        pipeline:     e.quotesAwaitingValue,
      };
    };

    const curr = derive(rawCurr);
    const prev = derive(rawPrev);

    const metrics = [
      { label: 'Revenue',      curr: curr?.revenue,    prev: prev?.revenue,    fmt: fmtDollar, higherBetter: true },
      { label: 'Net Margin',   curr: curr?.netMargin,  prev: prev?.netMargin,  fmt: fmtPct,    higherBetter: true },
      { label: 'Close Rate',   curr: curr?.closeRate,  prev: prev?.closeRate,  fmt: fmtPct,    higherBetter: true },
      { label: 'On-Time Rate', curr: curr?.onTimeRate, prev: prev?.onTimeRate, fmt: fmtPct,    higherBetter: true },
      { label: 'Pipeline',     curr: curr?.pipeline,   prev: prev?.pipeline,   fmt: fmtDollar, higherBetter: true },
    ];

    const rows = metrics.map(m => {
      if (m.curr == null) {
        return `
          <div class="delta-item">
            <span class="delta-name">${m.label}</span>
            <div class="delta-right">
              <span class="delta-val muted">—</span>
            </div>
          </div>`;
      }
      if (m.prev == null) {
        return `
          <div class="delta-item">
            <span class="delta-name">${m.label}</span>
            <div class="delta-right">
              <span class="delta-val">${m.fmt(m.curr)}</span>
              <span class="delta-neutral muted" style="font-size:11px">new</span>
            </div>
          </div>`;
      }
      const diff  = m.curr - m.prev;
      const up    = diff >= 0;
      const cls   = up === m.higherBetter ? 'delta-up' : 'delta-down';
      const arrow = up ? '▲' : '▼';
      const diffLabel = m.fmt === fmtDollar
        ? (up ? '+' : '') + fmtDollar(diff)
        : (up ? '+' : '') + fmtPct(diff);
      return `
        <div class="delta-item">
          <span class="delta-name">${m.label}</span>
          <div class="delta-right">
            <span class="delta-val">${m.fmt(m.curr)}</span>
            <span class="${cls} delta-arrow">${arrow}</span>
            <span class="${cls} delta-val" style="font-size:11.5px">${diffLabel}</span>
          </div>
        </div>`;
    }).join('');

    return `
      <div class="panel">
        <div class="panel-header">
          <span class="panel-title">Week-over-Week</span>
          ${rawPrev ? `<span class="muted" style="font-size:11px">vs ${formatWeekShort(rawPrev.weekStart)}</span>` : ''}
        </div>
        <div class="panel-body" style="padding: 8px 20px 12px;">
          ${rows}
        </div>
      </div>
    `;
  },

  // ── Sparkline panel (last 8 weeks of revenue) ───────────────
  renderSparklinePanel(all) {
    const data   = all.slice(0, 8).reverse();
    const labels = data.map(e => formatWeekShort(e.weekStart));
    const oldest = labels[0]                  || '';
    const newest = labels[labels.length - 1]  || '';
    const hasData = data.length > 0;

    return `
      <div class="panel sparkline-panel">
        <div class="panel-header">
          <span class="panel-title">Revenue — Last 8 Weeks</span>
          ${hasData ? `<span class="mono" style="font-size:12px;color:var(--teal)">${fmtDollar(data[data.length - 1]?.grossRevenue || 0)}</span>` : ''}
        </div>
        <div class="panel-body">
          <div class="sparkline-wrap">
            <canvas id="revenueSparkline"></canvas>
          </div>
          ${hasData ? `<div class="sparkline-footer"><span>${oldest}</span><span>${newest}</span></div>` : ''}
        </div>
      </div>
    `;
  }

};
