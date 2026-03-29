/**
 * dashboard.js — Home page render (Tier 1 KPIs + deltas + sparkline)
 */

const Dashboard = {

  render(container) {
    const all = Storage.getAll();
    const latest = all.length ? computeDerived(all[0]) : null;
    const prev   = all.length > 1 ? computeDerived(all[1]) : null;

    const html = `
      <div class="page">
        <div class="page-header">
          <div>
            <h1 class="page-title">Dashboard</h1>
            <p class="page-subtitle" style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
            ${latest ? 'Week of ' + formatWeekRange(latest.weekStart, latest.weekEnd) : 'No data yet — enter your first week to get started'}
            ${latest?.adsPaused ? '<span class="tag amber" style="vertical-align:middle">Ads paused</span>' : ''}
          </p>
          </div>
        </div>

        ${this.renderTier1(latest)}

        <div class="home-bottom">
          ${this.renderDeltaPanel(latest, prev)}
          ${this.renderSparklinePanel(all)}
        </div>
      </div>
    `;
    container.innerHTML = html;

    // Draw sparkline after DOM is ready
    const canvas = container.querySelector('#revenueSparkline');
    if (canvas) {
      const revenueData = all.slice(0, 8).reverse().map(e => e.netRevenue || 0);
      Charts.drawSparkline(canvas, revenueData);
    }
  },

  renderTier1(e) {
    const n = (v, fmt) => e ? fmt(v) : '—';
    return `
      <div class="tier1-grid">
        <div class="metric-card tier1">
          <span class="metric-label">Weekly Net Revenue</span>
          <span class="metric-value">${n(e?.netRevenue, fmtDollar)}</span>
        </div>
        <div class="metric-card tier1">
          <span class="metric-label">Gross Margin</span>
          <span class="metric-value">${n(e?.grossMargin, fmtPct)}</span>
        </div>
        <div class="metric-card tier1">
          <span class="metric-label">Close Rate</span>
          <span class="metric-value">${n(e?.closeRate, fmtPct)}</span>
          ${e ? `<span class="metric-sub">${e.quotesClosed || 0} / ${e.quotesSent || 0} quotes</span>` : ''}
        </div>
        <div class="metric-card tier1">
          <span class="metric-label">On-Time Rate</span>
          <span class="metric-value">${n(e?.onTimeRate, fmtPct)}</span>
          ${e ? `<span class="metric-sub">${e.jobsOnTime || 0} / ${e.jobsCompleted || 0} jobs</span>` : ''}
        </div>
        <div class="metric-card tier1">
          <span class="metric-label">Pipeline Value</span>
          <span class="metric-value">${n(e?.pipelineValue, fmtDollar)}</span>
        </div>
      </div>
    `;
  },

  renderDeltaPanel(curr, prev) {
    const metrics = [
      { label: 'Net Revenue',   curr: curr?.netRevenue,   prev: prev?.netRevenue,   fmt: fmtDollar, higherBetter: true },
      { label: 'Gross Margin',  curr: curr?.grossMargin,  prev: prev?.grossMargin,  fmt: fmtPct,    higherBetter: true },
      { label: 'Close Rate',    curr: curr?.closeRate,    prev: prev?.closeRate,    fmt: fmtPct,    higherBetter: true },
      { label: 'On-Time Rate',  curr: curr?.onTimeRate,   prev: prev?.onTimeRate,   fmt: fmtPct,    higherBetter: true },
      { label: 'Pipeline Value',curr: curr?.pipelineValue,prev: prev?.pipelineValue,fmt: fmtDollar, higherBetter: true },
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
      const diff = m.curr - m.prev;
      const up = diff >= 0;
      const cls = up === m.higherBetter ? 'delta-up' : 'delta-down';
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
          ${prev ? `<span class="muted" style="font-size:11px">vs ${formatWeekShort(prev.weekStart)}</span>` : ''}
        </div>
        <div class="panel-body" style="padding: 8px 20px 12px;">
          ${rows}
        </div>
      </div>
    `;
  },

  renderSparklinePanel(all) {
    const data = all.slice(0, 8).reverse();
    const labels = data.map(e => formatWeekShort(e.weekStart));
    const oldest = labels[0] || '';
    const newest = labels[labels.length - 1] || '';
    const hasData = data.length > 0;

    return `
      <div class="panel sparkline-panel">
        <div class="panel-header">
          <span class="panel-title">Net Revenue — Last 8 Weeks</span>
          ${hasData ? `<span class="mono" style="font-size:12px;color:var(--teal)">${fmtDollar(data[data.length-1]?.netRevenue || 0)}</span>` : ''}
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
