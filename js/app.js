/**
 * app.js — Router, state management, week utilities, formatting
 */

// ── Week Utilities ─────────────────────────────────────────────────────────────

function getCurrentWeekStart() {
  const now = new Date();
  const day = now.getDay(); // 0=Sun, 1=Mon...
  const diff = (day === 0) ? -6 : 1 - day; // shift to Monday
  const mon = new Date(now);
  mon.setDate(now.getDate() + diff);
  return toISODate(mon);
}

function getWeekEnd(weekStart) {
  const d = new Date(weekStart + 'T00:00:00');
  d.setDate(d.getDate() + 6);
  return toISODate(d);
}

function toISODate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function formatWeekRange(weekStart, weekEnd) {
  if (!weekStart) return '—';
  const start = new Date(weekStart + 'T00:00:00');
  const end   = weekEnd ? new Date(weekEnd + 'T00:00:00') : new Date(weekStart + 'T00:00:00');
  end.setDate(end.getDate());

  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const sm = months[start.getMonth()];
  const em = months[end.getMonth()];
  const sy = start.getFullYear();
  const ey = end.getFullYear();

  if (sy === ey) {
    if (sm === em) {
      return `${sm} ${start.getDate()} – ${end.getDate()}, ${sy}`;
    }
    return `${sm} ${start.getDate()} – ${em} ${end.getDate()}, ${sy}`;
  }
  return `${sm} ${start.getDate()}, ${sy} – ${em} ${end.getDate()}, ${ey}`;
}

function formatWeekShort(weekStart) {
  if (!weekStart) return '—';
  const d = new Date(weekStart + 'T00:00:00');
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${months[d.getMonth()]} ${d.getDate()}`;
}

function generateWeekOptions(selectedWeek, count = 16) {
  const options = [];
  const current = getCurrentWeekStart();
  let ws = current;

  for (let i = 0; i < count; i++) {
    const we = getWeekEnd(ws);
    const label = formatWeekRange(ws, we);
    const extra = i === 0 ? ' (Current)' : '';
    options.push(`<option value="${ws}"${ws === selectedWeek ? ' selected' : ''}>${label}${extra}</option>`);
    // Move back one week
    const d = new Date(ws + 'T00:00:00');
    d.setDate(d.getDate() - 7);
    ws = toISODate(d);
  }

  return options.join('');
}

// ── Number Formatting ──────────────────────────────────────────────────────────

function fmt(n, decimals = 0) {
  if (n == null || isNaN(n)) return '—';
  return n.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

function fmtDollar(n) {
  if (n == null || isNaN(n)) return '—';
  const abs = Math.abs(n);
  const formatted = abs.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  return (n < 0 ? '-$' : '$') + formatted;
}

function fmtPct(n) {
  if (n == null || isNaN(n)) return '—';
  return (n * 100).toFixed(1) + '%';
}

// ── Derived Calculations ───────────────────────────────────────────────────────

function computeDerived(entry) {
  if (!entry) return null;
  const e = { ...entry };
  e.closeRate       = e.quotesSent  ? (e.quotesClosed  || 0) / e.quotesSent  : 0;
  e.totalAdSpend    = (e.fbSpend    || 0) + (e.googleCost  || 0);
  e.costPerClose    = e.quotesClosed ? e.totalAdSpend / e.quotesClosed : 0;
  e.onTimeRate      = e.jobsCompleted ? (e.jobsOnTime || 0) / e.jobsCompleted : 0;
  e.cancellationRate= e.jobsScheduled ? (e.cancellations || 0) / e.jobsScheduled : 0;
  e.grossMargin     = e.netRevenue  ? ((e.netRevenue - (e.cogs || 0)) / e.netRevenue) : 0;
  const totalExp    = (e.cogs||0)+(e.payroll||0)+(e.adSpendExpense||0)+
                      (e.vehicleFuel||0)+(e.suppliesChemicals||0)+(e.softwareTools||0)+(e.miscOther||0);
  e.netProfit       = (e.netRevenue || 0) - totalExp;
  e.netMargin       = e.netRevenue ? e.netProfit / e.netRevenue : 0;
  return e;
}

// ── App State & Router ─────────────────────────────────────────────────────────

const App = {
  state: {
    page:      'home',
    mode:      'view',
    viewWeek:  null,
    formWeek:  null,
  },

  init() {
    this.state.viewWeek = getCurrentWeekStart();
    this.state.formWeek = getCurrentWeekStart();
    this.updateSidebarWeek();
    this.bindNavLinks();
    this.routeFromHash();
    window.addEventListener('hashchange', () => this.routeFromHash());
  },

  routeFromHash() {
    const hash = location.hash.replace('#', '') || 'home';
    const validPages = ['home', 'marketing', 'operations', 'financial', 'history'];
    const page = validPages.includes(hash) ? hash : 'home';
    this.state.page = page;
    this.updateNavActive();
    this.render();
  },

  navigate(page) {
    location.hash = page;
  },

  navigateToWeek(weekStart) {
    // Navigate to financial page in view mode for that week
    this.state.viewWeek = weekStart;
    this.state.page = 'financial';
    this.state.mode = 'view';
    location.hash = 'financial';
    this.updateNavActive();
    this.render();
  },

  bindNavLinks() {
    document.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const page = link.dataset.page;
        this.state.mode = 'view';
        this.navigate(page);
      });
    });
  },

  updateNavActive() {
    document.querySelectorAll('.nav-link').forEach(link => {
      link.classList.toggle('active', link.dataset.page === this.state.page);
    });
  },

  updateSidebarWeek() {
    const label = document.getElementById('currentWeekLabel');
    if (label) {
      const ws = getCurrentWeekStart();
      const we = getWeekEnd(ws);
      label.textContent = formatWeekRange(ws, we);
    }
  },

  render() {
    const container = document.getElementById('mainContent');
    const page = this.state.page;

    if (page === 'home') {
      Dashboard.render(container);
      return;
    }

    if (page === 'history') {
      History.render(container);
      return;
    }

    // Pages with view/enter modes: marketing, operations, financial
    const mode = this.state.mode;
    const weekStart = mode === 'view' ? this.state.viewWeek : this.state.formWeek;

    // Build page shell with header
    container.innerHTML = `
      <div class="page-shell">
        ${this.renderPageHeader(page, mode, weekStart)}
        <div id="pageContent"></div>
      </div>
    `;

    // Wire up tab switcher
    container.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.state.mode = btn.dataset.mode;
        this.render();
      });
    });

    // Wire up week selector
    const weekSel = container.querySelector('#weekSelectInput');
    if (weekSel) {
      weekSel.addEventListener('change', () => {
        if (mode === 'view') this.state.viewWeek = weekSel.value;
        else this.state.formWeek = weekSel.value;
        this.render();
      });
    }

    const content = container.querySelector('#pageContent');
    const rawEntry = Storage.getWeek(weekStart);
    const entry = rawEntry ? computeDerived(rawEntry) : null;

    if (page === 'marketing') {
      if (mode === 'view') Marketing.renderView(content, entry);
      else Marketing.renderForm(content, weekStart, rawEntry);
    } else if (page === 'operations') {
      if (mode === 'view') Operations.renderView(content, entry);
      else Operations.renderForm(content, weekStart, rawEntry);
    } else if (page === 'financial') {
      if (mode === 'view') Financial.renderView(content, entry);
      else Financial.renderForm(content, weekStart, rawEntry);
    }
  },

  renderPageHeader(page, mode, weekStart) {
    const titles = {
      marketing:  'Marketing',
      operations: 'Operations',
      financial:  'Financial',
    };
    const we = getWeekEnd(weekStart);
    const weekLabel = formatWeekRange(weekStart, we);

    return `
      <div class="page-header" style="padding: 32px 36px 0">
        <div>
          <h1 class="page-title">${titles[page]}</h1>
          <p class="page-subtitle">${weekLabel}</p>
        </div>
        <div class="header-right">
          <div class="tab-switcher">
            <button class="tab-btn ${mode === 'view' ? 'active' : ''}" data-mode="view">View</button>
            <button class="tab-btn ${mode === 'enter' ? 'active' : ''}" data-mode="enter">Enter Data</button>
          </div>
          <div class="week-selector-wrap">
            <label style="font-size:12px;color:var(--text-muted)">Week</label>
            <select class="week-select" id="weekSelectInput">
              ${generateWeekOptions(weekStart)}
            </select>
          </div>
        </div>
      </div>
    `;
  }

};

// ── Boot ───────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => App.init());
