/**
 * marketing.js — Marketing page view + form
 */

// Ad-specific field IDs — used for disabling when ads are paused
const AD_FIELD_IDS = [
  'fbImpressions','fbClicks','fbSpend','fbLeads','fbCostPerLead','fbAvgCPC',
  'googleImpressions','googleClicks','googleCost','googleCTR','googleAvgCPC',
  'googleConversions','googleConversionRate',
];

const Marketing = {

  renderView(container, entry) {
    if (!entry) {
      container.innerHTML = emptyState('No marketing data for this week', 'Switch to Enter Data to add marketing metrics for the selected week.');
      return;
    }
    const e = entry;

    container.innerHTML = `
      <div class="page">
        ${adPerformancePanel(e)}
        <div class="mt-24"></div>
        ${ga4Panel(e)}
        <div class="mt-24"></div>
        ${pipelinePanel(e)}
        <div class="mt-24"></div>
        ${attributionPanel(e)}
      </div>
    `;

    function adPerformancePanel(e) {
      if (e.adsPaused) {
        return `
          <div class="section">
            <div class="section-title" style="display:flex;align-items:center;gap:8px">
              Ad Performance
              <span class="tag amber">Ads paused</span>
            </div>
            <div class="two-col">
              <div class="panel">
                <div class="panel-header">
                  <span class="panel-title">Facebook / Meta</span>
                  <span class="tag amber" style="font-size:10px">Paused</span>
                </div>
                <div class="panel-body">
                  <div class="muted" style="font-size:13px;padding:8px 0">No ad data recorded — ads were paused this week.</div>
                </div>
              </div>
              <div class="panel">
                <div class="panel-header">
                  <span class="panel-title">Google Ads</span>
                  <span class="tag amber" style="font-size:10px">Paused</span>
                </div>
                <div class="panel-body">
                  <div class="muted" style="font-size:13px;padding:8px 0">No ad data recorded — ads were paused this week.</div>
                </div>
              </div>
            </div>
          </div>
        `;
      }

      const fbCTR = e.fbImpressions ? ((e.fbClicks / e.fbImpressions) * 100).toFixed(2) + '%' : '—';
      return `
        <div class="section">
          <div class="section-title">Ad Performance</div>
          <div class="two-col">
            <div class="panel">
              <div class="panel-header">
                <span class="panel-title">Facebook / Meta</span>
                ${e.fbSpend ? `<span class="tag teal">${fmtDollar(e.fbSpend)} spend</span>` : ''}
              </div>
              <div class="panel-body">
                ${statRow('Impressions', fmt(e.fbImpressions))}
                ${statRow('Clicks', fmt(e.fbClicks))}
                ${statRow('CTR', fbCTR)}
                ${statRow('Avg CPC', fmtDollar(e.fbAvgCPC))}
                ${statRow('Leads', fmt(e.fbLeads))}
                ${statRow('Cost Per Lead', fmtDollar(e.fbCostPerLead))}
              </div>
            </div>
            <div class="panel">
              <div class="panel-header">
                <span class="panel-title">Google Ads</span>
                ${e.googleCost ? `<span class="tag teal">${fmtDollar(e.googleCost)} spend</span>` : ''}
              </div>
              <div class="panel-body">
                ${statRow('Impressions', fmt(e.googleImpressions))}
                ${statRow('Clicks', fmt(e.googleClicks))}
                ${statRow('CTR', e.googleCTR != null ? fmtPct(e.googleCTR / 100) : '—')}
                ${statRow('Avg CPC', fmtDollar(e.googleAvgCPC))}
                ${statRow('Conversions', fmt(e.googleConversions))}
                ${statRow('Conv. Rate', e.googleConversionRate != null ? fmtPct(e.googleConversionRate / 100) : '—')}
              </div>
            </div>
          </div>
        </div>
      `;
    }

    function ga4Panel(e) {
      const total = e.totalUsers || 0;
      const direct = e.usersDirects || 0;
      const organic = e.usersOrganic || 0;
      const referral = e.usersReferral || 0;
      const pct = v => total ? Math.round((v / total) * 100) : 0;

      return `
        <div class="section">
          <div class="section-title">GA4 Traffic</div>
          <div class="panel">
            <div class="panel-header">
              <span class="panel-title">Website Users</span>
              ${total ? `<span class="mono" style="font-size:13px">${fmt(total)} total</span>` : ''}
            </div>
            <div class="panel-body">
              <div class="traffic-bars">
                ${trafficRow('Direct', direct, pct(direct), 'direct')}
                ${trafficRow('Organic Search', organic, pct(organic), 'organic')}
                ${trafficRow('Referral', referral, pct(referral), 'referral')}
              </div>
            </div>
          </div>
        </div>
      `;
    }

    function trafficRow(name, count, pct, type) {
      return `
        <div class="traffic-row">
          <div class="traffic-label-row">
            <span class="traffic-name">${name}</span>
            <div class="traffic-nums">
              <span class="traffic-count">${fmt(count)}</span>
              <span class="traffic-pct">${pct}%</span>
            </div>
          </div>
          <div class="traffic-track">
            <div class="traffic-fill ${type}" style="width:${pct}%"></div>
          </div>
        </div>
      `;
    }

    function pipelinePanel(e) {
      const closeRate = e.quotesSent ? e.quotesClosed / e.quotesSent : 0;
      // Do not show ad spend-derived cost-per-close when ads were paused
      const totalSpend = e.adsPaused ? null : (e.fbSpend || 0) + (e.googleCost || 0);
      const costPerClose = (!e.adsPaused && e.quotesClosed && totalSpend) ? totalSpend / e.quotesClosed : null;

      return `
        <div class="section">
          <div class="section-title">Pipeline</div>
          <div class="panel">
            <div class="panel-header">
              <span class="panel-title">Quotes &amp; Close Rate</span>
              <span class="tag ${closeRate >= 0.5 ? 'green' : closeRate >= 0.3 ? 'amber' : 'red'}">${fmtPct(closeRate)} close rate</span>
            </div>
            <div class="panel-body">
              <div class="cards-grid-4" style="margin-bottom:16px">
                <div class="metric-card">
                  <span class="metric-label">Quotes Sent</span>
                  <span class="metric-value" style="font-size:24px">${fmt(e.quotesSent)}</span>
                </div>
                <div class="metric-card">
                  <span class="metric-label">Quotes Closed</span>
                  <span class="metric-value" style="font-size:24px">${fmt(e.quotesClosed)}</span>
                </div>
                <div class="metric-card">
                  <span class="metric-label">$ Value Sent</span>
                  <span class="metric-value" style="font-size:24px">${fmtDollar(e.dollarValueQuotesSent)}</span>
                </div>
                <div class="metric-card">
                  <span class="metric-label">Pipeline Value</span>
                  <span class="metric-value" style="font-size:24px">${fmtDollar(e.pipelineValue)}</span>
                </div>
              </div>
              <div class="two-col">
                ${statPanel('Total Ad Spend', e.adsPaused ? '—' : fmtDollar(totalSpend), e.adsPaused ? 'Ads paused' : '')}
                ${statPanel('Cost Per Close', costPerClose != null ? fmtDollar(costPerClose) : '—', e.adsPaused ? 'Ads paused' : '')}
              </div>
            </div>
          </div>
        </div>
      `;
    }

    function attributionPanel(e) {
      return `
        <div class="section">
          <div class="section-title">Lead Source Attribution</div>
          <div class="panel">
            <div class="panel-body">
              <div class="${e.leadSourceAttribution ? 'attribution-text' : 'notes-block empty'}">
                ${e.leadSourceAttribution || 'No attribution data entered.'}
              </div>
            </div>
          </div>
        </div>
      `;
    }

    function statPanel(label, value, sub) {
      return `
        <div class="metric-card">
          <span class="metric-label">${label}</span>
          <span class="metric-value" style="font-size:20px">${value}</span>
          ${sub ? `<span class="metric-sub muted">${sub}</span>` : ''}
        </div>
      `;
    }
  },

  renderForm(container, weekStart, existing) {
    const e = existing || {};
    const paused = !!e.adsPaused;

    container.innerHTML = `
      <div class="page form-page">

        <div style="margin-bottom:24px;padding:14px 18px;background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-card);display:flex;align-items:center;gap:14px">
          <label style="display:flex;align-items:center;gap:10px;cursor:pointer;user-select:none;margin:0">
            <input type="checkbox" id="adsPaused" ${paused ? 'checked' : ''}
              style="width:16px;height:16px;accent-color:#f59e0b;cursor:pointer;flex-shrink:0">
            <span style="font-size:14px;font-weight:500;color:var(--text)">Ads paused this week</span>
          </label>
          <span style="font-size:12px;color:var(--text-muted)">Greys out all FB &amp; Google ad fields and excludes this week from ad averages</span>
        </div>

        <div class="form-section">
          <div class="form-section-title">Facebook / Meta Ads</div>
          <div id="fbAdFields">
            <div class="form-row-3">
              <div class="form-group">
                <label class="form-label">Impressions</label>
                <input class="form-input" type="number" id="fbImpressions" value="${val(e.fbImpressions)}" placeholder="0">
              </div>
              <div class="form-group">
                <label class="form-label">Clicks</label>
                <input class="form-input" type="number" id="fbClicks" value="${val(e.fbClicks)}" placeholder="0">
              </div>
              <div class="form-group">
                <label class="form-label">Spend ($)</label>
                <input class="form-input" type="number" step="0.01" id="fbSpend" value="${val(e.fbSpend)}" placeholder="0.00">
              </div>
            </div>
            <div class="form-row-3">
              <div class="form-group">
                <label class="form-label">Leads</label>
                <input class="form-input" type="number" id="fbLeads" value="${val(e.fbLeads)}" placeholder="0">
              </div>
              <div class="form-group">
                <label class="form-label">Cost Per Lead ($)</label>
                <input class="form-input" type="number" step="0.01" id="fbCostPerLead" value="${val(e.fbCostPerLead)}" placeholder="0.00">
              </div>
              <div class="form-group">
                <label class="form-label">Avg CPC ($)</label>
                <input class="form-input" type="number" step="0.01" id="fbAvgCPC" value="${val(e.fbAvgCPC)}" placeholder="0.00">
              </div>
            </div>
          </div>
        </div>

        <div class="form-section">
          <div class="form-section-title">Google Ads</div>
          <div id="googleAdFields">
            <div class="form-row-3">
              <div class="form-group">
                <label class="form-label">Impressions</label>
                <input class="form-input" type="number" id="googleImpressions" value="${val(e.googleImpressions)}" placeholder="0">
              </div>
              <div class="form-group">
                <label class="form-label">Clicks</label>
                <input class="form-input" type="number" id="googleClicks" value="${val(e.googleClicks)}" placeholder="0">
              </div>
              <div class="form-group">
                <label class="form-label">Cost ($)</label>
                <input class="form-input" type="number" step="0.01" id="googleCost" value="${val(e.googleCost)}" placeholder="0.00">
              </div>
            </div>
            <div class="form-row-3">
              <div class="form-group">
                <label class="form-label">CTR (%)</label>
                <input class="form-input" type="number" step="0.01" id="googleCTR" value="${val(e.googleCTR)}" placeholder="0.00">
              </div>
              <div class="form-group">
                <label class="form-label">Avg CPC ($)</label>
                <input class="form-input" type="number" step="0.01" id="googleAvgCPC" value="${val(e.googleAvgCPC)}" placeholder="0.00">
              </div>
              <div class="form-group">
                <label class="form-label">Conversions</label>
                <input class="form-input" type="number" id="googleConversions" value="${val(e.googleConversions)}" placeholder="0">
              </div>
            </div>
            <div class="form-row-2">
              <div class="form-group">
                <label class="form-label">Conversion Rate (%)</label>
                <input class="form-input" type="number" step="0.01" id="googleConversionRate" value="${val(e.googleConversionRate)}" placeholder="0.00">
              </div>
            </div>
          </div>
        </div>

        <div class="form-section">
          <div class="form-section-title">GA4 Traffic</div>
          <div class="form-row-2">
            <div class="form-group">
              <label class="form-label">Total Users</label>
              <input class="form-input" type="number" id="totalUsers" value="${val(e.totalUsers)}" placeholder="0">
            </div>
          </div>
          <div class="form-row-3">
            <div class="form-group">
              <label class="form-label">Direct</label>
              <input class="form-input" type="number" id="usersDirects" value="${val(e.usersDirects)}" placeholder="0">
            </div>
            <div class="form-group">
              <label class="form-label">Organic</label>
              <input class="form-input" type="number" id="usersOrganic" value="${val(e.usersOrganic)}" placeholder="0">
            </div>
            <div class="form-group">
              <label class="form-label">Referral</label>
              <input class="form-input" type="number" id="usersReferral" value="${val(e.usersReferral)}" placeholder="0">
            </div>
          </div>
          <div class="form-row">
            <div class="form-group full">
              <label class="form-label">Lead Source Attribution (free text, e.g. "Google 60%, Facebook 20%")</label>
              <input class="form-input" type="text" id="leadSourceAttribution" value="${e.leadSourceAttribution || ''}" placeholder="e.g. Google 60%, Facebook 20%, Organic 20%">
            </div>
          </div>
        </div>

        <div class="form-section">
          <div class="form-section-title">Pipeline</div>
          <div class="form-row-2">
            <div class="form-group">
              <label class="form-label">Quotes Sent</label>
              <input class="form-input" type="number" id="quotesSent" value="${val(e.quotesSent)}" placeholder="0">
            </div>
            <div class="form-group">
              <label class="form-label">Quotes Closed</label>
              <input class="form-input" type="number" id="quotesClosed" value="${val(e.quotesClosed)}" placeholder="0">
            </div>
          </div>
          <div class="form-row-2">
            <div class="form-group">
              <label class="form-label">$ Value of Quotes Sent</label>
              <input class="form-input" type="number" step="0.01" id="dollarValueQuotesSent" value="${val(e.dollarValueQuotesSent)}" placeholder="0.00">
            </div>
            <div class="form-group">
              <label class="form-label">Pipeline Value ($)</label>
              <input class="form-input" type="number" step="0.01" id="pipelineValue" value="${val(e.pipelineValue)}" placeholder="0.00">
            </div>
          </div>

          <div class="live-calcs" id="mktLiveCalcs">
            <div class="live-calc-item">
              <span class="live-calc-label">Close Rate</span>
              <span class="live-calc-value" id="liveCloseRate">—</span>
            </div>
            <div class="live-calc-item">
              <span class="live-calc-label">Total Ad Spend</span>
              <span class="live-calc-value" id="liveTotalSpend">—</span>
            </div>
            <div class="live-calc-item">
              <span class="live-calc-label">Cost Per Close</span>
              <span class="live-calc-value" id="liveCostPerClose">—</span>
            </div>
          </div>
        </div>

        <div class="btn-row">
          <button class="btn-primary" id="saveMktBtn">Save Marketing Data</button>
          <button class="btn-secondary" id="clearMktBtn">Clear</button>
          <span class="save-confirm" id="mktConfirm">&#10003; Saved</span>
        </div>
      </div>
    `;

    this.attachFormListeners(container, weekStart, existing);
  },

  attachFormListeners(container, weekStart, existing) {
    const nonAdIds = [
      'totalUsers','usersDirects','usersOrganic','usersReferral',
      'leadSourceAttribution','quotesSent','quotesClosed',
      'dollarValueQuotesSent','pipelineValue',
    ];
    const allIds = [...AD_FIELD_IDS, ...nonAdIds];

    // ── Pause toggle ──────────────────────────────────────────
    const pauseChk = container.querySelector('#adsPaused');

    const applyPausedState = (paused) => {
      AD_FIELD_IDS.forEach(id => {
        const el = container.querySelector('#' + id);
        if (!el) return;
        el.disabled = paused;
        el.style.opacity = paused ? '0.35' : '';
        el.style.cursor  = paused ? 'not-allowed' : '';
      });
      // Update live calcs immediately when toggling
      updateLive();
    };

    pauseChk.addEventListener('change', () => applyPausedState(pauseChk.checked));

    // ── Live calculations ─────────────────────────────────────
    const updateLive = () => {
      const paused = pauseChk.checked;
      const sent   = parseFloat(g('quotesSent'))  || 0;
      const closed = parseFloat(g('quotesClosed')) || 0;
      const closeRate = sent ? closed / sent : 0;

      set('liveCloseRate', sent ? fmtPct(closeRate) : '—');

      if (paused) {
        set('liveTotalSpend',  'Paused');
        set('liveCostPerClose','—');
      } else {
        const fbSpend   = parseFloat(g('fbSpend'))    || 0;
        const gCost     = parseFloat(g('googleCost')) || 0;
        const totalSpend = fbSpend + gCost;
        const costPerClose = closed ? totalSpend / closed : 0;
        set('liveTotalSpend',  fmtDollar(totalSpend));
        set('liveCostPerClose', closed ? fmtDollar(costPerClose) : '—');
      }
    };

    allIds.forEach(id => {
      const el = container.querySelector('#' + id);
      if (el) el.addEventListener('input', updateLive);
    });

    // Apply initial state
    applyPausedState(pauseChk.checked);

    // ── Save ──────────────────────────────────────────────────
    container.querySelector('#saveMktBtn').addEventListener('click', () => {
      const weekData = Storage.getWeek(weekStart) || { weekStart, weekEnd: getWeekEnd(weekStart) };
      const paused = pauseChk.checked;

      weekData.adsPaused = paused;

      allIds.forEach(id => {
        const el = container.querySelector('#' + id);
        if (!el) return;
        // If ads paused, do not persist values from disabled ad fields
        if (paused && AD_FIELD_IDS.includes(id)) {
          delete weekData[id];
          return;
        }
        const v = el.value.trim();
        weekData[id] = (el.type === 'number' && v !== '') ? parseFloat(v) : (el.type === 'text' ? v : undefined);
        if (weekData[id] === undefined) delete weekData[id];
      });

      Storage.save(weekData);
      showConfirm(container, '#mktConfirm');
    });

    // ── Clear ─────────────────────────────────────────────────
    container.querySelector('#clearMktBtn').addEventListener('click', () => {
      if (!confirm('Clear all marketing data for this week?')) return;
      const weekData = Storage.getWeek(weekStart) || { weekStart, weekEnd: getWeekEnd(weekStart) };
      [...allIds, 'adsPaused'].forEach(id => delete weekData[id]);
      Storage.save(weekData);
      Marketing.renderForm(container, weekStart, Storage.getWeek(weekStart));
    });
  }

};

// ── Shared helpers ──────────────────────────────────────────
function statRow(label, value) {
  return `<div class="stat-row"><span class="stat-label">${label}</span><span class="stat-value">${value ?? '—'}</span></div>`;
}

function emptyState(title, desc) {
  return `
    <div class="page">
      <div class="empty-state">
        <div class="empty-state-icon">📊</div>
        <h3>${title}</h3>
        <p>${desc}</p>
      </div>
    </div>
  `;
}

function val(v) {
  return (v != null && v !== '') ? v : '';
}

function g(id) {
  const el = document.getElementById(id);
  return el ? el.value : '';
}

function set(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

function showConfirm(container, selector) {
  const el = container.querySelector(selector);
  if (!el) return;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 2500);
}
