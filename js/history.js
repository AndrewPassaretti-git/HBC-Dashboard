/**
 * history.js — History page: table of all weeks + export + delete
 */

const History = {

  render(container) {
    const all = Storage.getAll();

    container.innerHTML = `
      <div class="page">
        <div class="page-header">
          <div>
            <h1 class="page-title">History</h1>
            <p class="page-subtitle">${all.length} week${all.length !== 1 ? 's' : ''} on record</p>
          </div>
          <div class="header-right">
            <button class="btn-export" id="exportCsvBtn">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              Export CSV
            </button>
          </div>
        </div>

        ${all.length === 0 ? this.renderEmpty() : this.renderTable(all)}
      </div>
    `;

    container.querySelector('#exportCsvBtn').addEventListener('click', () => Storage.exportCSV());

    if (all.length > 0) {
      container.querySelectorAll('.history-row').forEach(row => {
        row.addEventListener('click', (e) => {
          if (e.target.closest('.delete-btn')) return;
          const weekStart = row.dataset.week;
          App.navigateToWeek(weekStart);
        });
      });

      container.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const weekStart = btn.dataset.week;
          const label = btn.dataset.label;
          if (confirm(`Delete data for week of ${label}? This cannot be undone.`)) {
            Storage.delete(weekStart);
            History.render(container);
          }
        });
      });
    }
  },

  renderEmpty() {
    return `
      <div class="empty-state">
        <div class="empty-state-icon">📋</div>
        <h3>No weeks recorded yet</h3>
        <p>Enter data for your first week using the Marketing, Operations, or Financial pages.</p>
      </div>
    `;
  },

  renderTable(all) {
    const rows = all.map(raw => {
      const e = computeDerived(raw);
      const label = formatWeekRange(e.weekStart, e.weekEnd);
      return `
        <tr class="history-row" data-week="${e.weekStart}">
          <td>${label}</td>
          <td class="mono-cell">${e.netRevenue != null ? fmtDollar(e.netRevenue) : '—'}</td>
          <td class="mono-cell">${e.grossMargin != null && e.netRevenue ? fmtPct(e.grossMargin) : '—'}</td>
          <td class="mono-cell">${e.quotesSent ? fmtPct(e.closeRate) : '—'}</td>
          <td class="mono-cell">${e.jobsCompleted ? fmtPct(e.onTimeRate) : '—'}</td>
          <td class="mono-cell">${e.pipelineValue != null ? fmtDollar(e.pipelineValue) : '—'}</td>
          <td style="text-align:right">
            <button class="delete-btn" data-week="${e.weekStart}" data-label="${label}">Delete</button>
          </td>
        </tr>
      `;
    }).join('');

    return `
      <div class="panel">
        <div class="history-table-wrap">
          <table class="history-table">
            <thead>
              <tr>
                <th>Week</th>
                <th style="text-align:right">Net Revenue</th>
                <th style="text-align:right">Margin %</th>
                <th style="text-align:right">Close Rate</th>
                <th style="text-align:right">On-Time Rate</th>
                <th style="text-align:right">Pipeline Value</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              ${rows}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

};
