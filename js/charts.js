/**
 * charts.js — Canvas chart renderers for HBC Dashboard
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
      lineColor   = '#0fb8a0',
      fillColor   = 'rgba(15, 184, 160, 0.12)',
      dotColor    = '#0fb8a0',
      noDataColor = 'rgba(240,244,248,0.15)',
      padding     = 10,
      dotRadius   = 3,
    } = opts;

    const ctx = canvas.getContext('2d');
    const W = canvas.offsetWidth  || canvas.width;
    const H = canvas.offsetHeight || canvas.height;
    canvas.width  = W;
    canvas.height = H;

    ctx.clearRect(0, 0, W, H);

    const validData = data.filter(v => v != null && !isNaN(v));

    if (validData.length < 2) {
      // Draw flat placeholder line
      ctx.strokeStyle = noDataColor;
      ctx.lineWidth   = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(padding, H / 2);
      ctx.lineTo(W - padding, H / 2);
      ctx.stroke();
      ctx.setLineDash([]);
      return;
    }

    const min   = Math.min(...validData);
    const max   = Math.max(...validData);
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
    ctx.lineWidth   = 2;
    ctx.lineJoin    = 'round';
    ctx.lineCap     = 'round';
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
        ctx.lineWidth   = 2;
        ctx.stroke();
      }
    });
  },

  /**
   * Draw a bar chart on a canvas element.
   * Null/missing values render as empty slots (no bar drawn).
   * x-axis labels are drawn below each bar from the `labels` array.
   *
   * @param {HTMLCanvasElement}   canvas
   * @param {(number|null)[]}     data   - values oldest first; null = no data that week
   * @param {string[]}            labels - x-axis label per bar (same order as data)
   * @param {object}              opts
   */
  drawBarChart(canvas, data, labels, opts = {}) {
    const {
      barColor    = '#0fb8a0',
      barAlpha    = 0.8,
      labelColor  = 'rgba(240,244,248,0.45)',
      noDataColor = 'rgba(240,244,248,0.15)',
      labelFont   = '9px "DM Mono", monospace',
      paddingX    = 6,
      paddingTop  = 8,
      labelHeight = 16,
    } = opts;

    const ctx = canvas.getContext('2d');
    const W   = canvas.offsetWidth  || canvas.width;
    const H   = canvas.offsetHeight || canvas.height;
    canvas.width  = W;
    canvas.height = H;

    ctx.clearRect(0, 0, W, H);

    const n = data.length;
    if (!n) return;

    const chartH    = H - labelHeight - paddingTop;
    const validVals = data.filter(v => v != null && !isNaN(v) && v > 0);

    // No usable data — draw placeholder line
    if (!validVals.length) {
      ctx.strokeStyle = noDataColor;
      ctx.lineWidth   = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(paddingX, paddingTop + chartH / 2);
      ctx.lineTo(W - paddingX, paddingTop + chartH / 2);
      ctx.stroke();
      ctx.setLineDash([]);
      return;
    }

    const maxVal = Math.max(...validVals);
    const slotW  = (W - paddingX * 2) / n;
    const barW   = slotW * 0.55;

    data.forEach((v, i) => {
      const slotX  = paddingX + i * slotW;
      const barX   = slotX + (slotW - barW) / 2;
      const hasVal = v != null && !isNaN(v) && v > 0;

      if (hasVal) {
        const barH = (v / maxVal) * chartH;
        const barY = paddingTop + chartH - barH;
        const r    = Math.min(3, barW / 2, barH / 2);

        ctx.globalAlpha = barAlpha;
        ctx.fillStyle   = barColor;
        ctx.beginPath();
        ctx.moveTo(barX + r, barY);
        ctx.lineTo(barX + barW - r, barY);
        ctx.quadraticCurveTo(barX + barW, barY, barX + barW, barY + r);
        ctx.lineTo(barX + barW, barY + barH);
        ctx.lineTo(barX, barY + barH);
        ctx.lineTo(barX, barY + r);
        ctx.quadraticCurveTo(barX, barY, barX + r, barY);
        ctx.closePath();
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      // X-axis label
      if (labels?.[i]) {
        ctx.globalAlpha = 1;
        ctx.fillStyle   = labelColor;
        ctx.font        = labelFont;
        ctx.textAlign   = 'center';
        ctx.fillText(labels[i], slotX + slotW / 2, H - 3);
      }
    });
  }

};
