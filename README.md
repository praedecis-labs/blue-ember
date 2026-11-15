# Blue Ember

NASA Space Apps 2026 — Flame in Freefall.

Default UI language: **English (en-US)**. Toggle **EN | PT** in the chat header for Portuguese (pt-BR).

## Structure (monorepo)

| Folder | Role |
| --- | --- |
| `blue-ember-frontend/` | React + TypeScript + Vite (canonical app) |
| `blue-ember-backend/` | ASP.NET Core 8 Minimal API (Vertical Slice) |
| `blue-ember-backend/data/` | NASA PSI cache (JSON) |
| `blue-ember-backend/scripts/` | Ingestion/test utilities (Python/Node) |
| `blue-ember-backend/docs/` | Backend reports and docs |

### Backend — Vertical Slice

| Folder | Role |
| --- | --- |
| `Features/<Name>/` | Feature endpoints (Health, Investigations, Ranking, Gaps, Export, Nasa, Agent) |
| `Domain/` | Score, mock profiles, environments, categories |
| `Infrastructure/` | GEODE client + JSON store |
| `Program.cs` | Composition root (DI, middleware, `Map*Endpoints`) |

### Frontend (`blue-ember-frontend/src/`) — layers

| Folder | Role |
| --- | --- |
| `chat/` | Chat app (profile, home, thread, panels) |
| `i18n/` | Locale catalogs (`en-US` / `pt-BR`) and provider |
| `components/` | Reusable UI (shadcn) |
| `hooks/` | React hooks |
| `services/` | Typed HTTP API client |
| `assets/` | Static images and media |
| `App.tsx` | Shell — mounts `ChatApp` inside `I18nProvider` |

## Prerequisites

- Node.js 20+
- .NET SDK 8

## Run

### Backend

```bash
cd blue-ember-backend
dotnet run --launch-profile http
```

- API: http://localhost:5006  
- Swagger (dev): http://localhost:5006/swagger  
- Health: `GET /api/health`  
- Investigations: `GET /api/investigations`, `GET /api/investigations/{id}`, `GET /api/investigations/compare?ids=`  
- Ranking: `GET /api/ranking?profile=ShipEngineer&environment=Moon`  
- Profiles / Environments / Gaps / Export: `/api/profiles`, `/api/environments`, `/api/gaps`, `/api/export`  
- Agent: `POST /api/agent/ask` (optional Gemini key — see backend docs)  
- NASA refresh: `POST /api/nasa/refresh`

### Frontend

```bash
cd blue-ember-frontend
npm install
npm run dev
```

- App: http://localhost:3000  
- CORS allowed for that origin on the backend  
- Vite proxy: `/api` → `http://localhost:5006`

> Archival HTML prototypes (`blue-ember-chat.html`, `docs/prototipos/…`) are Portuguese-era snapshots. The primary product UI is the React app with i18n.
