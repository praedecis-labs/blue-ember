# Blue Ember — Frontend

React chat (Vite + TypeScript) that consumes the Blue Ember .NET API.

Default UI locale: **en-US**. Header/sidebar toggle: **EN | PT** (persisted in `localStorage`).

## Prerequisites

- Node.js 20+
- Backend running at `http://localhost:5006` (see monorepo root)

## Run FE + BE together

### 1. Backend (`:5006`)

```bash
cd ../blue-ember-backend
dotnet run --launch-profile http
```

- API: http://localhost:5006  
- Swagger (dev): http://localhost:5006/swagger  
- Health: `GET /api/health`

### 2. Frontend (`:3000`)

```bash
npm install
npm run dev
```

- App: http://localhost:3000  
- Vite proxy: `/api` → `http://localhost:5006` (see `vite.config.ts`)

## Scripts

| Command | Use |
| --- | --- |
| `npm run dev` | Dev server on port 3000 |
| `npm test` | Vitest |
| `npm run build` | Typecheck + build |
| `npm run lint` | Oxlint |

## Smoke checklist (demo)

| # | Action | Expected |
| --- | --- | --- |
| 1 | BE `:5006` + FE `:3000` | Health ok in header |
| 2 | Fresh load | English UI chrome |
| 3 | Toggle PT | Profile/chat strings in Portuguese; survives reload |
| 4 | Pick Ship Engineer | Weights = API ShipEngineer |
| 5 | Example chip “Safe fabric on the Moon?” | Bubble with real PSI tops |
| 6 | Open Investigations | C1–C5 bars from API |
| 7 | Open Gaps (Moon) | Partial-gravity warning |
| 8 | Switch to ISS in the form | Ranking/gaps change |
| 9 | Export CSV | Download 200 |
| 10 | API off | Clear message, no blank screen |

Full list: [`docs/TODO-FRONTEND.md`](docs/TODO-FRONTEND.md).
