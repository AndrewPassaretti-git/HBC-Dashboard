/**
 * operations.js — Operations page view + form
 */

const Operations = {

  renderView(container, entry) {
    if (!entry) {
      container.innerHTML = emptyState('No operations data for this week', 'Switch to Enter Data to add operations metrics for the selected week.');
      return;
    }
    const e = entry;
    const onTimeRate = e.jobsCompleted ? (e.jobsOnTime / e.jobsCompleted) : 0;
    const cancelRate = e.jobsScheduled ? (e.cancellations / e.jobsScheduled) : 0;

    container.innerHTML = `
      <div class="page">

        <div class="section">
          <div class="section-title">Jobs</div>
          <div class="cards-grid-4">
            <div class="metric-card">
              <span class="metric-label">Scheduled</span>
              <span class="metric-value">${fmt(e.jobsScheduled)}</span>
            </div>
            <div class="metric-card">
              <span class="metric-label">Completed</span>
              <span class="metric-value">${fmt(e.jobsCompleted)}</span>
            </div>
            <div class="metric-card">
              <span class="metric-label">On Time</span>
              <span class="metric-value">${fmt(e.jobsOnTime)}</span>
            </div>
            <div class="metric-card">
              <span class="metric-label">On-Time Rate</span>
              <span class="metric-value ${onTimeRate >= 0.9 ? 'green' : onTimeRate >= 0.75 ? 'amber' : 'red'}">${fmtPct(onTimeRate)}</span>
            </div>
          </div>
        </div>

        <div class="section mt-24">
          <div class="section-title">Schedule &amp; Capacity</div>
          <div class="two-col">
            <div class="panel">
              <div class="panel-header"><span class="panel-title">Schedule Status</span></div>
              <div class="panel-body">
                ${statRow('Schedule Length', e.scheduleLength != null ? e.scheduleLength + ' days out' : '—')}
                ${statRow('Cancellations', fmt(e.cancellations))}
                ${statRow('Reschedules', fmt(e.reschedules))}
                ${statRow('Cancellation Rate', fmtPct(cancelRate))}
              </div>
            </div>
            <div class="panel">
              <div class="panel-header"><span class="panel-title">Employee Hours</span></div>
              <div class="panel-body">
                ${statRow('Total Hours', e.employeeHours != null ? e.employeeHours + ' hrs' : '—')}
              </div>
            </div>
          </div>
        </div>

        <div class="section mt-24">
          <div class="section-title">Inventory</div>
          <div class="two-col">
            <div class="panel">
              <div class="panel-header"><span class="panel-title">Inventory Levels</span></div>
              <div class="panel-body">
                <div style="display:flex;flex-direction:column;gap:20px">
                  ${inventoryBar('Sodium Hypochlorite (SH)', e.shInventoryPct)}
                  ${inventoryBar('Surfactant', e.surfactantInventoryPct)}
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    `;

    function inventoryBar(name, pct) {
      const p = pct ?? 0;
      const cls = p < 25 ? 'danger' : p < 50 ? 'warn' : 'ok';
      return `
        <div class="progress-wrap">
          <div class="progress-label-row">
            <span class="progress-name">${name}</span>
            <span class="progress-pct ${cls === 'danger' ? 'red' : cls === 'warn' ? 'amber' : 'teal'}">${p}%</span>
          </div>
          <div class="progress-track">
            <div class="progress-fill ${cls}" style="width:${Math.min(p, 100)}%"></div>
          </div>
        </div>
      `;
    }
  },

  renderForm(container, weekStart, existing) {
    const e = existing || {};

    container.innerHTML = `
      <div class="page form-page">

        <div class="form-section">
          <div class="form-section-title">Jobs</div>
          <div class="form-row-3">
            <div class="form-group">
              <label class="form-label">Jobs Scheduled</label>
              <input class="form-input" type="number" id="jobsScheduled" value="${val(e.jobsScheduled)}" placeholder="0">
            </div>
            <div class="form-group">
              <label class="form-label">Jobs Completed</label>
              <input class="form-input" type="number" id="jobsCompleted" value="${val(e.jobsCompleted)}" placeholder="0">
            </div>
            <div class="form-group">
              <label class="form-label">Jobs On Time</label>
              <input class="form-input" type="number" id="jobsOnTime" value="${val(e.jobsOnTime)}" placeholder="0">
            </div>
          </div>

          <div class="live-calcs" id="opsLiveCalcs">
            <div class="live-calc-item">
              <span class="live-calc-label">On-Time Rate</span>
              <span class="live-calc-value" id="liveOnTimeRate">—</span>
            </div>
            <div class="live-calc-item">
              <span class="live-calc-label">Cancellation Rate</span>
              <span class="live-calc-value" id="liveCancelRate">—</span>
            </div>
          </div>
        </div>

        <div class="form-section">
          <div class="form-section-title">Schedule &amp; Capacity</div>
          <div class="form-row-3">
            <div class="form-group">
              <label class="form-label">Schedule Length (days)</label>
              <input class="form-input" type="number" id="scheduleLength" value="${val(e.scheduleLength)}" placeholder="0">
            </div>
            <div class="form-group">
              <label class="form-label">Cancellations</label>
              <input class="form-input" type="number" id="cancellations" value="${val(e.cancellations)}" placeholder="0">
            </div>
            <div class="form-group">
              <label class="form-label">Reschedules</label>
              <input class="form-input" type="number" id="reschedules" value="${val(e.reschedules)}" placeholder="0">
            </div>
          </div>
          <div class="form-row-2">
            <div class="form-group">
              <label class="form-label">Employee Hours</label>
              <input class="form-input" type="number" step="0.5" id="employeeHours" value="${val(e.employeeHours)}" placeholder="0">
            </div>
          </div>
        </div>

        <div class="form-section">
          <div class="form-section-title">Inventory</div>
          <div class="form-row-2">
            <div class="form-group">
              <label class="form-label">SH Inventory (%)</label>
              <input class="form-input" type="number" min="0" max="100" id="shInventoryPct" value="${val(e.shInventoryPct)}" placeholder="0–100">
            </div>
            <div class="form-group">
              <label class="form-label">Surfactant Inventory (%)</label>
              <input class="form-input" type="number" min="0" max="100" id="surfactantInventoryPct" value="${val(e.surfactantInventoryPct)}" placeholder="0–100">
            </div>
          </div>
          <div class="live-calcs" id="invLiveCalcs" style="margin-top:0">
            <div class="live-calc-item">
              <span class="live-calc-label">SH Level</span>
              <span class="live-calc-value" id="liveShPct">—</span>
            </div>
            <div class="live-calc-item">
              <span class="live-calc-label">Surfactant Level</span>
              <span class="live-calc-value" id="liveSurfPct">—</span>
            </div>
          </div>
        </div>

        <div class="btn-row">
          <button class="btn-primary" id="saveOpsBtn">Save Operations Data</button>
          <button class="btn-secondary" id="clearOpsBtn">Clear</button>
          <span class="save-confirm" id="opsConfirm">&#10003; Saved</span>
        </div>
      </div>
    `;

    this.attachFormListeners(container, weekStart, existing);
  },

  attachFormListeners(container, weekStart, existing) {
    const ids = [
      'jobsScheduled','jobsCompleted','jobsOnTime','scheduleLength',
      'cancellations','reschedules','employeeHours','shInventoryPct','surfactantInventoryPct'
    ];

    const updateLive = () => {
      const scheduled = parseFloat(g('jobsScheduled')) || 0;
      const completed = parseFloat(g('jobsCompleted')) || 0;
      const onTime    = parseFloat(g('jobsOnTime')) || 0;
      const cancels   = parseFloat(g('cancellations')) || 0;
      const sh        = parseFloat(g('shInventoryPct'));
      const surf      = parseFloat(g('surfactantInventoryPct'));

      set('liveOnTimeRate', completed ? fmtPct(onTime / completed) : '—');
      set('liveCancelRate', scheduled ? fmtPct(cancels / scheduled) : '—');
      set('liveShPct', !isNaN(sh) ? sh + '%' : '—');
      set('liveSurfPct', !isNaN(surf) ? surf + '%' : '—');
    };

    ids.forEach(id => {
      const el = container.querySelector('#' + id);
      if (el) el.addEventListener('input', updateLive);
    });

    updateLive();

    container.querySelector('#saveOpsBtn').addEventListener('click', () => {
      const weekData = Storage.getWeek(weekStart) || { weekStart, weekEnd: getWeekEnd(weekStart) };
      ids.forEach(id => {
        const el = container.querySelector('#' + id);
        if (!el) return;
        const v = el.value.trim();
        if (v !== '') weekData[id] = parseFloat(v);
        else delete weekData[id];
      });
      Storage.save(weekData);
      showConfirm(container, '#opsConfirm');
    });

    container.querySelector('#clearOpsBtn').addEventListener('click', () => {
      if (!confirm('Clear all operations data for this week?')) return;
      const weekData = Storage.getWeek(weekStart) || { weekStart, weekEnd: getWeekEnd(weekStart) };
      ids.forEach(id => delete weekData[id]);
      Storage.save(weekData);
      Operations.renderForm(container, weekStart, Storage.getWeek(weekStart));
    });
  }

};
