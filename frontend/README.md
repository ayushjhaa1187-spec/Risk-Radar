# Risk Radar Frontend

Vite + React 18 dashboard for the Tier-N Supply Chain Risk Radar. Ships a landing page and a copper-focused dashboard (Peru, Mexico, Vietnam) with mock-data fallback until the backend API is live.

## Quick start
```bash
cd frontend
npm install
npm run dev
```
Open http://localhost:5173.

## Scripts
- `npm run dev` – start dev server
- `npm run build` – production build (uses `base=/Risk-Radar/` for GitHub Pages)
- `npm run preview` – preview production build
- `npm run deploy` – build then publish `dist/` to `gh-pages` branch via `gh-pages`

## Environment
Copy `.env.example` to `.env.local` and set:
- `VITE_API_BASE_URL` – e.g., `https://risk-radar-backend.vercel.app`
- `VITE_API_TIMEOUT` – request timeout (ms)
- Optional: `VITE_BASE_PATH` (override GitHub Pages base path)

## Data sources
- Uses live API when reachable (`/api/dashboard-summary`, `/api/events`, `/api/risks`, `/api/oem-exposure`, `/api/regions`).
- On failure, automatically falls back to `src/data/mock-data.json` (mirrors docs/mock-data).

## Pages
- `/` Landing page – value prop, CTA to dashboard.
- `/dashboard` – heat map, timeline, event feed, risk cards, exposure table, alerts, filters (region, min severity).

## Deployment
- GitHub Pages: see `.github/workflows/frontend-pages.yml` (build + deploy on `main`).
- Vercel backend: frontend consumes the Vercel API via `VITE_API_BASE_URL`.

## Tech
- React 18, Vite, Tailwind CSS, React Router, React Query, Recharts, React-Leaflet, Lucide icons.
- Intentional theme: dark slate base, amber accent (`#ea580c`), Space Grotesk + Manrope typography. No purple.
