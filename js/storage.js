/**
 * storage.js — localStorage CRUD + CSV export for HBC Dashboard
 */

const STORAGE_KEY = 'hbc_weekly_data';

const Storage = {

  getAll() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      console.error('Storage.getAll error:', e);
      return [];
    }
  },

  getWeek(weekStart) {
    return this.getAll().find(e => e.weekStart === weekStart) || null;
  },

  getRecent(n = 8) {
    return this.getAll().slice(0, n);
  },

  // Returns the most recent entry whose weekStart is strictly before the given weekStart.
  // Entries are stored sorted descending, so the first match is the immediately prior week.
  getPriorWeek(weekStart) {
    return this.getAll().find(e => e.weekStart < weekStart) || null;
  },

  save(entry) {
    const all = this.getAll();
    const idx = all.findIndex(e => e.weekStart === entry.weekStart);
    const toSave = { ...entry, savedAt: Date.now() };
    if (idx >= 0) {
      all[idx] = toSave;
    } else {
      all.push(toSave);
    }
    // Sort descending by weekStart
    all.sort((a, b) => b.weekStart.localeCompare(a.weekStart));
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
      return true;
    } catch (e) {
      console.error('Storage.save error:', e);
      return false;
    }
  },

  delete(weekStart) {
    const all = this.getAll().filter(e => e.weekStart !== weekStart);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  },

  exportCSV() {
    const all = this.getAll();
    if (!all.length) {
      alert('No data to export.');
      return;
    }

    const allKeys = new Set();
    all.forEach(e => Object.keys(e).forEach(k => allKeys.add(k)));
    const headers = Array.from(allKeys);

    const escape = val => {
      if (val === null || val === undefined) return '';
      const str = String(val);
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return '"' + str.replace(/"/g, '""') + '"';
      }
      return str;
    };

    const rows = [
      headers.join(','),
      ...all.map(e => headers.map(h => escape(e[h])).join(','))
    ];

    const csv = rows.join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hbc_dashboard_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

};
