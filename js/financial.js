/**
 * financial.js — Financial page view + form
 */

const Financial = {

  renderView(container, entry) {
    if (!entry) {
      container.innerHTML = emptyState('No financial data for this week', 'Switch to Enter Data to add financial metrics for the selected week.');
      return;
    }
    const e = entry;

    const grossMargin = e.netRevenue ? (e.netRevenue - (e.cogs || 0)) / e.netRevenue : 0;
    const expenses = [
      { label: 'COGS',               value: e.cogs             || 0 },
      { label: 'Payroll',            value: e.payroll          || 0 },
      { label: 'Ad Spend',           value: e.adSpendExpense   || 0 },
      { label: 'Vehicle / Fuel',     value: e.vehicleFuel      || 0 },
      { label: 'Supplies / Chemicals',value: e.suppliesChemicals || 0 },
      { label: 'Software / Tools',   value: e.softwareTools    || 0 },
      { label: 'Misc / Other',       value: e.miscOther        || 0 },
    ];
    const totalExpenses = expenses.reduce((s, ex) => s + ex.value, 0);
    const netProfit = (e.netRevenue || 0) - totalExpenses;
    const netMargin = e.netRevenue ? netProfit / e.netRevenue : 0;
    const maxExpense = Math.max(...expenses.map(ex => ex.value), 1);

    container.innerHTML = `
      <div class="page">

        <div class="section">
          <div class="section-title">Revenue</div>
          <div class="cards-grid-3">
            <div class="metric-card">
              <span class="metric-label">Gross Revenue</span>
              <span class="metric-value">${fmtDollar(e.grossRevenue)}</span>
            </div>
            <div class="metric-card">
              <span class="metric-label">Net Revenue</span>
              <span class="metric-value">${fmtDollar(e.netRevenue)}</span>
            </div>
            <div class="metric-card">
              <span class="metric-label">Gross Margin</span>
              <span class="metric-value ${grossMargin >= 0.5 ? 'green' : grossMargin >= 0.3 ? 'amber' : 'red'}">${fmtPct(grossMargin)}</span>
            </div>
          </div>
        </div>

        <div class="section mt-24">
          <div class="section-title">P&amp;L Summary</div>
          <div class="two-col">
            <div class="metric-card">
              <span class="metric-label">Net Profit</span>
              <span class="metric-value ${netProfit >= 0 ? 'green' : 'red'}">${fmtDollar(netProfit)}</span>
            </div>
            <div class="metric-card">
              <span class="metric-label">Net Margin</span>
              <span class="metric-value ${netMargin >= 0.15 ? 'green' : netMargin >= 0 ? 'amber' : 'red'}">${fmtPct(netMargin)}</span>
            </div>
          </div>
        </div>

        <div class="section mt-24">
          <div class="section-title">Expense Breakdown</div>
          <div class="panel">
            <div class="panel-body" style="padding:12px 20px 20px">
              <table class="expense-table">
                <thead>
                  <tr>
                    <th>Expense</th>
                    <th>Amount</th>
                    <th>% of Revenue</th>
                    <th class="expense-bar-cell">Proportion</th>
                  </tr>
                </thead>
                <tbody>
                  ${expenses.map(ex => expenseRow(ex.label, ex.value, e.netRevenue, maxExpense)).join('')}
                </tbody>
                <tfoot>
                  <tr class="expense-total">
                    <td>Total Expenses</td>
                    <td>${fmtDollar(totalExpenses)}</td>
                    <td>${e.netRevenue ? fmtPct(totalExpenses / e.netRevenue) : '—'}</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>

        ${e.notes ? `
        <div class="section mt-24">
          <div class="section-title">Week Notes</div>
          <div class="panel">
            <div class="panel-body">
              <div class="notes-block">${escapeHtml(e.notes)}</div>
            </div>
          </div>
        </div>` : ''}

      </div>
    `;

    function expenseRow(label, value, netRev, maxVal) {
      const pct = netRev && value ? value / netRev : 0;
      const barWidth = maxVal ? Math.round((value / maxVal) * 100) : 0;
      return `
        <tr>
          <td>${label}</td>
          <td>${fmtDollar(value)}</td>
          <td>${netRev ? fmtPct(pct) : '—'}</td>
          <td class="expense-bar-cell">
            <div class="expense-bar-track">
              <div class="expense-bar-fill" style="width:${barWidth}%"></div>
            </div>
          </td>
        </tr>
      `;
    }
  },

  renderForm(container, weekStart, existing) {
    const e = existing || {};

    container.innerHTML = `
      <div class="page form-page">

        <div class="form-section">
          <div class="form-section-title">Revenue</div>
          <div class="form-row-2">
            <div class="form-group">
              <label class="form-label">Gross Revenue ($)</label>
              <input class="form-input" type="number" step="0.01" id="grossRevenue" value="${val(e.grossRevenue)}" placeholder="0.00">
            </div>
            <div class="form-group">
              <label class="form-label">Net Revenue ($) <span style="opacity:.5;font-size:11px">after refunds/discounts</span></label>
              <input class="form-input" type="number" step="0.01" id="netRevenue" value="${val(e.netRevenue)}" placeholder="0.00">
            </div>
          </div>
          <div class="form-row-2">
            <div class="form-group">
              <label class="form-label">COGS ($)</label>
              <input class="form-input" type="number" step="0.01" id="cogs" value="${val(e.cogs)}" placeholder="0.00">
            </div>
          </div>

          <div class="live-calcs">
            <div class="live-calc-item">
              <span class="live-calc-label">Gross Margin</span>
              <span class="live-calc-value" id="liveGrossMargin">—</span>
            </div>
          </div>
        </div>

        <div class="form-section">
          <div class="form-section-title">Expenses</div>
          <div class="form-row-2">
            <div class="form-group">
              <label class="form-label">Payroll ($)</label>
              <input class="form-input" type="number" step="0.01" id="payroll" value="${val(e.payroll)}" placeholder="0.00">
            </div>
            <div class="form-group">
              <label class="form-label">Ad Spend ($)</label>
              <input class="form-input" type="number" step="0.01" id="adSpendExpense" value="${val(e.adSpendExpense)}" placeholder="0.00">
            </div>
          </div>
          <div class="form-row-2">
            <div class="form-group">
              <label class="form-label">Vehicle / Fuel ($)</label>
              <input class="form-input" type="number" step="0.01" id="vehicleFuel" value="${val(e.vehicleFuel)}" placeholder="0.00">
            </div>
            <div class="form-group">
              <label class="form-label">Supplies / Chemicals ($)</label>
              <input class="form-input" type="number" step="0.01" id="suppliesChemicals" value="${val(e.suppliesChemicals)}" placeholder="0.00">
            </div>
          </div>
          <div class="form-row-2">
            <div class="form-group">
              <label class="form-label">Software / Tools ($)</label>
              <input class="form-input" type="number" step="0.01" id="softwareTools" value="${val(e.softwareTools)}" placeholder="0.00">
            </div>
            <div class="form-group">
              <label class="form-label">Misc / Other ($)</label>
              <input class="form-input" type="number" step="0.01" id="miscOther" value="${val(e.miscOther)}" placeholder="0.00">
            </div>
          </div>

          <div class="live-calcs">
            <div class="live-calc-item">
              <span class="live-calc-label">Total Expenses</span>
              <span class="live-calc-value" id="liveTotalExpenses">—</span>
            </div>
            <div class="live-calc-item">
              <span class="live-calc-label">Net Profit</span>
              <span class="live-calc-value" id="liveNetProfit">—</span>
            </div>
            <div class="live-calc-item">
              <span class="live-calc-label">Net Margin</span>
              <span class="live-calc-value" id="liveNetMargin">—</span>
            </div>
          </div>
        </div>

        <div class="form-section">
          <div class="form-section-title">Notes</div>
          <div class="form-group">
            <label class="form-label">Weekly Notes</label>
            <textarea class="form-input" id="notes" rows="4" placeholder="Any notable events, context, or commentary for this week...">${e.notes || ''}</textarea>
          </div>
        </div>

        <div class="btn-row">
          <button class="btn-primary" id="saveFinBtn">Save Financial Data</button>
          <button class="btn-secondary" id="clearFinBtn">Clear</button>
          <span class="save-confirm" id="finConfirm">&#10003; Saved</span>
        </div>
      </div>
    `;

    this.attachFormListeners(container, weekStart, existing);
  },

  attachFormListeners(container, weekStart, existing) {
    const ids = [
      'grossRevenue','netRevenue','cogs','payroll','adSpendExpense',
      'vehicleFuel','suppliesChemicals','softwareTools','miscOther','notes'
    ];

    const updateLive = () => {
      const netRev  = parseFloat(g('netRevenue'))       || 0;
      const cogs    = parseFloat(g('cogs'))             || 0;
      const payroll = parseFloat(g('payroll'))          || 0;
      const adSpend = parseFloat(g('adSpendExpense'))   || 0;
      const fuel    = parseFloat(g('vehicleFuel'))      || 0;
      const suppl   = parseFloat(g('suppliesChemicals'))|| 0;
      const sw      = parseFloat(g('softwareTools'))    || 0;
      const misc    = parseFloat(g('miscOther'))        || 0;

      const gm = netRev ? (netRev - cogs) / netRev : 0;
      const totalExp = cogs + payroll + adSpend + fuel + suppl + sw + misc;
      const netProfit = netRev - totalExp;
      const netMargin = netRev ? netProfit / netRev : 0;

      set('liveGrossMargin', netRev ? fmtPct(gm) : '—');
      set('liveTotalExpenses', fmtDollar(totalExp));
      set('liveNetProfit', fmtDollar(netProfit));
      set('liveNetMargin', netRev ? fmtPct(netMargin) : '—');
    };

    ids.forEach(id => {
      const el = container.querySelector('#' + id);
      if (el) el.addEventListener('input', updateLive);
    });

    updateLive();

    container.querySelector('#saveFinBtn').addEventListener('click', () => {
      const weekData = Storage.getWeek(weekStart) || { weekStart, weekEnd: getWeekEnd(weekStart) };
      ids.forEach(id => {
        const el = container.querySelector('#' + id);
        if (!el) return;
        const v = el.value.trim();
        if (id === 'notes') {
          weekData[id] = v;
        } else {
          if (v !== '') weekData[id] = parseFloat(v);
          else delete weekData[id];
        }
      });
      Storage.save(weekData);
      showConfirm(container, '#finConfirm');
    });

    container.querySelector('#clearFinBtn').addEventListener('click', () => {
      if (!confirm('Clear all financial data for this week?')) return;
      const weekData = Storage.getWeek(weekStart) || { weekStart, weekEnd: getWeekEnd(weekStart) };
      ids.forEach(id => delete weekData[id]);
      Storage.save(weekData);
      Financial.renderForm(container, weekStart, Storage.getWeek(weekStart));
    });
  }

};

function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
