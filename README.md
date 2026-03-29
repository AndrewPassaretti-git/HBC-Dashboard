# HBC Weekly Management Dashboard

A static, single-page dashboard for The House Bath Company — tracking weekly marketing, operations, and financial KPIs. No backend, no build tools. Runs entirely in the browser via `localStorage`.

## Pages

| Page | Description |
|------|-------------|
| **Home** | Tier 1 KPI cards, week-over-week deltas, net revenue sparkline |
| **Marketing** | FB/Google ad metrics, GA4 traffic, pipeline / close rate |
| **Operations** | Job completion, on-time rate, schedule length, inventory levels |
| **Financial** | Revenue, gross margin, P&L, expense breakdown table |
| **History** | Full week log — clickable rows, delete, CSV export |

## Usage

1. Open `index.html` in any modern browser (Chrome, Firefox, Edge, Safari).
2. No server required — all data is stored in `localStorage`.
3. Every Sunday, use each section's **Enter Data** tab to input the week's numbers.
4. Derived metrics (close rate, margins, etc.) calculate live as you type.
5. Use **History → Export CSV** to back up your data.

## GitHub Pages Deployment

This project is fully static — no build step, no server dependencies.

```bash
# 1. Initialize the repo (if not done)
git init
git add .
git commit -m "Initial HBC Dashboard"

# 2. Create a GitHub repository and push
git remote add origin https://github.com/YOUR_USERNAME/hbc-dashboard.git
git branch -M main
git push -u origin main

# 3. Enable GitHub Pages
#    → GitHub repo → Settings → Pages → Source: Deploy from branch → main / root
#    → Your dashboard will be live at: https://YOUR_USERNAME.github.io/hbc-dashboard/
```

## Data Model

All data is stored in `localStorage` under the key `hbc_weekly_data` as a JSON array sorted newest-first. Each entry is keyed by `weekStart` (ISO date, Monday). No data leaves the browser.

## File Structure

```
/index.html         — App shell + sidebar navigation
/css/styles.css     — Full design system (dark navy theme)
/js/app.js          — Router, state, week utilities, number formatting
/js/storage.js      — localStorage CRUD + CSV export
/js/charts.js       — Canvas sparkline renderer
/js/dashboard.js    — Home page (Tier 1 KPIs + deltas + sparkline)
/js/marketing.js    — Marketing view + entry form
/js/operations.js   — Operations view + entry form
/js/financial.js    — Financial view + entry form
/js/history.js      — History table
```

## Tech Stack

- Vanilla HTML, CSS, JavaScript — zero dependencies, zero build tools
- Google Fonts: DM Sans + DM Mono
- Canvas API for sparklines
- `localStorage` for persistence
