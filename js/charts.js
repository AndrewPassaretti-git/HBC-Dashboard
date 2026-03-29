/**
 * charts.js — Canvas sparkline renderer for HBC Dashboard
 */

const Charts = {

  /**
   * Extract values for an ad-specific field from raw storage entries (oldest first).
   * Returns null for any week where adsPaused === true so those weeks are
   * automatically skipped by drawSparkline's null-filter, keeping ad averages clean.
   * Non-ad fields (revenue, pipeline, GA4) should be extracted directly without this helper.
   *
   * @param {object[]} entries - raw storage entries, oldest first
   * @param {string}   field   - field name to extract (e.g. 'fbSpend', 'googleCost')
   * @returns {(number|null)[]}
   */
  extractAdData(entries, field) {
    return entries.map(e => e.adsPaused ? null : (e[field] ?? null));
  },

  /**
   * Draw a sparkline on a canvas element.
   * Null values in data are excluded from the line (useful for paused-week gaps).
   * @param {HTMLCanvasElement} canvas
   * @param {(number|null)[]} data - array of values (oldest first); null = skip point
   * @param {object} opts
   */
  drawSparkline(canvas, data, opts = {}) {
    const {
      lineColor = '#0fb8a0',
      fillColor = 'rgba(15, 184, 160, 0.12)',
      dotColor = '#0fb8a0',
      noDataColor = 'rgba(240,244,248,0.15)',
      padding = 10,
      dotRadius = 3,
    } = opts;

    const ctx = canvas.getContext('2d');
    const W = canvas.offsetWidth || canvas.width;
    const H = canvas.offsetHeight || canvas.height;
    canvas.width = W;
    canvas.height = H;

    ctx.clearRect(0, 0, W, H);

    const validData = data.filter(v => v != null && !isNaN(v));

    if (validData.length < 2) {
      // Draw flat placeholder line
      ctx.strokeStyle = noDataColor;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(padding, H / 2);
      ctx.lineTo(W - padding, H / 2);
      ctx.stroke();
      ctx.setLineDash([]);
      return;
    }

    const min = Math.min(...validData);
    const max = Math.max(...validData);
    const range = max - min || 1;

    const toX = (i) => padding + (i / (validData.length - 1)) * (W - padding * 2);
    const toY = (v) => H - padding - ((v - min) / range) * (H - padding * 2);

    const points = validData.map((v, i) => ({ x: toX(i), y: toY(v) }));

    // Fill area
    ctx.beginPath();
    ctx.moveTo(points[0].x, H - padding);
    points.forEach(p => ctx.lineTo(p.x, p.y));
    ctx.lineTo(points[points.length - 1].x, H - padding);
    ctx.closePath();
    ctx.fillStyle = fillColor;
    ctx.fill();

    // Line
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    points.forEach((p, i) => {
      if (i === 0) return;
      ctx.lineTo(p.x, p.y);
    });
    ctx.strokeStyle = lineColor;
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.stroke();

    // Dots
    points.forEach((p, i) => {
      const isLast = i === points.length - 1;
      ctx.beginPath();
      ctx.arc(p.x, p.y, isLast ? dotRadius + 1 : dotRadius, 0, Math.PI * 2);
      ctx.fillStyle = isLast ? '#f0f4f8' : dotColor;
      ctx.fill();
      if (isLast) {
        ctx.strokeStyle = dotColor;
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    });
  }

};
