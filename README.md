<<<<<<< HEAD
# Blue Ember

**NASA Space Apps 2026 — Flame in Freefall · Team Stellar Hub**

Language: **[English](README.md)** | **[Português](README.pt-BR.md)**

Blue Ember ranks NASA Physical Sciences Informatics (**PSI / GEODE**) combustion and fire-safety investigations against mission environments (ISS, Moon, Mars) and user profiles (Ship Engineer, Researcher, Student). The product UI is a chat that turns a natural-language hypothesis into ranked evidence, gaps, and exportable results.

---

## End-to-end flow

```
User (browser :3000)
        │
        │  Vite proxy /api → :5006
        ▼
React chat (profile → home → thread + panels)
        │
        ├── GET  /api/health, /profiles, /environments
        ├── GET  /api/ranking/fire-safety
        ├── GET  /api/gaps
        ├── GET  /api/export?format=csv|json
        └── POST /api/agent/ask  (optional NVIDIA prose)
        ▼
ASP.NET Core 8 Minimal API
        │
        ├── Domain: ScoreCalculator C1–C5 + mock profiles/environments
        ├── Infrastructure: JSON cache + NasaPsiClient (GEODE)
        └── Features: Health, Investigations, Ranking, Gaps, Export, Nasa, Agent
        ▼
NASA PSI GEODE  ←── optional POST /api/nasa/refresh (merge keeps enriched metrics)
```

1. **Boot:** API loads `data/normalized_investigations.json` into memory. If empty, it falls back to GEODE.
2. **Profile:** User picks a mock profile; weights come from `GET /api/profiles`.
3. **Hypothesis:** Chat parses environment/goal (and may call the NVIDIA agent). Ranking + gaps are always from the API.
4. **Panels:** Investigations (C1–C5), evidence strength, gaps (partial-gravity warning on Moon), sources (PSI / DOI).
5. **Export:** CSV or JSON for the current profile + environment.
6. **Freshness:** `GET /api/health` exposes cache age (`dataAgeSeconds`, `lastLoadedAt`, `dataSource`, `cacheStale`). Optional auto-refresh if `Data:CacheTtlMinutes` > 0.

**UI language:** default **en-US**. Toggle **EN | PT** in the chat header (persisted in `localStorage`).

---

## Monorepo layout

| Path | Role |
| --- | --- |
| `blue-ember-frontend/` | Canonical app — React + TypeScript + Vite |
| `blue-ember-backend/` | ASP.NET Core 8 API (Vertical Slice) |
| `blue-ember-backend/data/` | NASA PSI normalized JSON cache |
| `blue-ember-backend/scripts/` | Ingestion / connection utilities |
| `blue-ember-backend/docs/` | Backend reports, agent docs, next-slice TODOs |
| `blue-ember-frontend/docs/` | Frontend track TODOs (T1–T7) |
| `docs/` | Shared docs / visual prototypes |
| `blue-ember-chat.html` | Archival HTML prototype (not the product UI) |

---

## Backend organization

Vertical Slice: each feature owns its endpoints; shared rules live in Domain; I/O lives in Infrastructure.

| Layer | Path | Responsibility |
| --- | --- | --- |
| Composition | `Program.cs` | DI, CORS, Swagger, `Map*Endpoints`, bootstrap |
| Features | `Features/<Name>/` | Health, Investigations, Ranking, Gaps, Export, Nasa, Agent |
| Contracts | `Features/Contracts/` | DTOs shared with Swagger / FE |
| Domain | `Domain/` | Investigations, categories, profiles, environments, `ScoreCalculator` |
| Infrastructure | `Infrastructure/Data/` | `JsonInvestigationStore`, cache age / TTL options |
| Infrastructure | `Infrastructure/NasaPsi/` | GEODE client, normalizer, `NasaRefreshService`, TTL worker |
| Tests | `BlueEmber.Api.Tests/` | Fixed score fixtures (C1–C5) |

**Score (0–10):** `S = w1·C1 + … + w5·C5` — proximity, MOC margin, kinetics, thermal severity, toxicity. Weights depend on profile; optional `w1`…`w5` overrides on ranking.

**Featured filter:** omitting `featured` defaults to fire-safety (~19). `featured=false` returns the full catalog. Shortcut: `GET /api/ranking/fire-safety`.

**Main routes**

| Method | Route | Notes |
| --- | --- | --- |
| GET | `/api/health` | Status + cache age |
| GET | `/api/profiles` | Mock profiles + weights |
| GET | `/api/environments` | ISS / Moon / Mars targets |
| GET | `/api/investigations` | Summary list (featured default) |
| GET | `/api/investigations/{id}` | Full card + PSI / DOI |
| GET | `/api/investigations/compare` | 2–3 IDs |
| GET | `/api/ranking` | Weighted ranking |
| GET | `/api/ranking/fire-safety` | Always featured |
| GET | `/api/gaps` | O₂×pressure coverage + warnings |
| GET | `/api/export` | `format=json\|csv` |
| POST | `/api/nasa/refresh` | Pull GEODE + merge |
| POST | `/api/agent/ask` | Optional NVIDIA (see `docs/AGENT-NVIDIA.md`) |

Ports: **http://localhost:5006** · Swagger (dev): `/swagger`

---

## Frontend organization

| Path | Role |
| --- | --- |
| `src/App.tsx` | Shell — `I18nProvider` + `ChatApp` |
| `src/chat/` | Screens, panels, session hooks, adapters, parser |
| `src/services/` | Typed HTTP client (`contracts`, `http`, ranking, gaps, export, agent, …) |
| `src/i18n/` | `en-US` / `pt-BR` catalogs |
| `src/components/ui/` | shadcn-style primitives |
| `src/hooks/` | Shared React hooks |
| `vite.config.ts` | Port 3000 + proxy `/api` → `:5006` |

**Chat flow:** Profile → Analyses home (history + example chips) → Chat thread with expandable panels.

**ID map (UI ↔ API)**

| UI | API |
| --- | --- |
| `eng` / `pesq` / `est` | `ShipEngineer` / `Researcher` / `Student` |
| `lua` / `marte` / `iss` | `Moon` / `Mars` / `Iss` |

Canonical API IDs are what we persist in `localStorage`. Mapping lives in `src/chat/adapters.ts`.

**Tracks (status):** T1–T6 done (typed client → API-backed chat → export/polish). Optional **T7:** main ranking screen, dedicated detail, comparer, 2D gap map, spinoffs — see `blue-ember-frontend/docs/TODO-FRONTEND.md`.

---

## Prerequisites

- Node.js 20+
- .NET SDK 8
- (Optional) NVIDIA API key for agent prose — `Nvidia` section in backend `appsettings` / user secrets; see `blue-ember-backend/docs/AGENT-NVIDIA.md`

---

## Run locally

### 1. Backend (`:5006`)

```bash
cd blue-ember-backend
dotnet run --launch-profile http
```

### 2. Frontend (`:3000`)

```bash
cd blue-ember-frontend
npm install
npm run dev
```

Open http://localhost:3000 — CORS allows that origin; the Vite proxy forwards `/api` to the API.

### Useful scripts

| Where | Command | Use |
| --- | --- | --- |
| Frontend | `npm run dev` | Dev server |
| Frontend | `npm run build` | Typecheck + production build |
| Frontend | `npm test` | Vitest |
| Backend | `dotnet build BlueEmber.sln` | Compile |
| Backend | `dotnet test BlueEmber.sln` | Score tests |

### Cache TTL (optional)

In `blue-ember-backend/appsettings.json`:

```json
"Data": {
  "CacheTtlMinutes": 0,
  "CacheRefreshCheckMinutes": 15
}
```

Set `CacheTtlMinutes` > 0 to enable background GEODE refresh when data is stale.

---

## Demo smoke checklist

| # | Action | Expected |
| --- | --- | --- |
| 1 | BE `:5006` + FE `:3000` | Health ok in header |
| 2 | Language EN / PT | UI strings switch; survives reload |
| 3 | Pick Ship Engineer | Weights match API |
| 4 | Chip e.g. “Safe fabric on the Moon?” | Bubble with real PSI tops |
| 5 | Investigations panel | C1–C5 from API |
| 6 | Gaps (Moon) | Partial-gravity warning |
| 7 | Switch environment to ISS | Ranking / gaps change |
| 8 | Export CSV | HTTP 200 download |
| 9 | API off | Clear error, no blank screen |

---

## Docs

| Doc | Content |
| --- | --- |
| [`blue-ember-backend/docs/RELATORIO-BACKEND-MVP.md`](blue-ember-backend/docs/RELATORIO-BACKEND-MVP.md) | Backend MVP report + HTTP contracts |
| [`blue-ember-backend/docs/TODO-PROXIMA-FATIA.md`](blue-ember-backend/docs/TODO-PROXIMA-FATIA.md) | Next backend slice |
| [`blue-ember-backend/docs/AGENT-NVIDIA.md`](blue-ember-backend/docs/AGENT-NVIDIA.md) | Agent setup |
| [`blue-ember-frontend/docs/TODO-FRONTEND.md`](blue-ember-frontend/docs/TODO-FRONTEND.md) | Frontend tracks T1–T7 |
| [`blue-ember-frontend/README.md`](blue-ember-frontend/README.md) | Frontend-only run notes |

---

*Updated 15/11/2026 — reflects API + chat integration (T1–T6), cache age/TTL, and optional NVIDIA agent.*
=======
# Blue Ember

**NASA Space Apps 2026 — Flame in Freefall · Team Stellar Hub**

Language: **[English](README.md)** | **[Português](README.pt-BR.md)**

Blue Ember ranks NASA Physical Sciences Informatics (**PSI / GEODE**) combustion and fire-safety investigations against mission environments (ISS, Moon, Mars) and user profiles (Ship Engineer, Researcher, Student). The product UI is a chat that turns a natural-language hypothesis into ranked evidence, gaps, and exportable results.

---

## End-to-end flow

```
User (browser :3000)
        │
        │  Vite proxy /api → :5006
        ▼
React chat (profile → home → thread + panels)
        │
        ├── GET  /api/health, /profiles, /environments
        ├── GET  /api/ranking/fire-safety
        ├── GET  /api/gaps
        ├── GET  /api/export?format=csv|json
        └── POST /api/agent/ask  (optional Gemini prose)
        ▼
ASP.NET Core 8 Minimal API
        │
        ├── Domain: ScoreCalculator C1–C5 + mock profiles/environments
        ├── Infrastructure: JSON cache + NasaPsiClient (GEODE)
        └── Features: Health, Investigations, Ranking, Gaps, Export, Nasa, Agent
        ▼
NASA PSI GEODE  ←── optional POST /api/nasa/refresh (merge keeps enriched metrics)
```

1. **Boot:** API loads `data/normalized_investigations.json` into memory. If empty, it falls back to GEODE.
2. **Profile:** User picks a mock profile; weights come from `GET /api/profiles`.
3. **Hypothesis:** Chat parses environment/goal (and may call the Gemini agent). Ranking + gaps are always from the API.
4. **Panels:** Investigations (C1–C5), evidence strength, gaps (partial-gravity warning on Moon), sources (PSI / DOI).
5. **Export:** CSV or JSON for the current profile + environment.
6. **Freshness:** `GET /api/health` exposes cache age (`dataAgeSeconds`, `lastLoadedAt`, `dataSource`, `cacheStale`). Optional auto-refresh if `Data:CacheTtlMinutes` > 0.

**UI language:** default **en-US**. Toggle **EN | PT** in the chat header (persisted in `localStorage`).

---

## Monorepo layout

| Path | Role |
| --- | --- |
| `blue-ember-frontend/` | Canonical app — React + TypeScript + Vite |
| `blue-ember-backend/` | ASP.NET Core 8 API (Vertical Slice) |
| `blue-ember-backend/data/` | NASA PSI normalized JSON cache |
| `blue-ember-backend/scripts/` | Ingestion / connection utilities |
| `blue-ember-backend/docs/` | Backend reports, agent docs, next-slice TODOs |
| `blue-ember-frontend/docs/` | Frontend track TODOs (T1–T7) |
| `docs/` | Shared docs / visual prototypes |
| `blue-ember-chat.html` | Archival HTML prototype (not the product UI) |

---

## Backend organization

Vertical Slice: each feature owns its endpoints; shared rules live in Domain; I/O lives in Infrastructure.

| Layer | Path | Responsibility |
| --- | --- | --- |
| Composition | `Program.cs` | DI, CORS, Swagger, `Map*Endpoints`, bootstrap |
| Features | `Features/<Name>/` | Health, Investigations, Ranking, Gaps, Export, Nasa, Agent |
| Contracts | `Features/Contracts/` | DTOs shared with Swagger / FE |
| Domain | `Domain/` | Investigations, categories, profiles, environments, `ScoreCalculator` |
| Infrastructure | `Infrastructure/Data/` | `JsonInvestigationStore`, cache age / TTL options |
| Infrastructure | `Infrastructure/NasaPsi/` | GEODE client, normalizer, `NasaRefreshService`, TTL worker |
| Tests | `BlueEmber.Api.Tests/` | Fixed score fixtures (C1–C5) |

**Score (0–10):** `S = w1·C1 + … + w5·C5` — proximity, MOC margin, kinetics, thermal severity, toxicity. Weights depend on profile; optional `w1`…`w5` overrides on ranking.

**Featured filter:** omitting `featured` defaults to fire-safety (~19). `featured=false` returns the full catalog. Shortcut: `GET /api/ranking/fire-safety`.

**Main routes**

| Method | Route | Notes |
| --- | --- | --- |
| GET | `/api/health` | Status + cache age |
| GET | `/api/profiles` | Mock profiles + weights |
| GET | `/api/environments` | ISS / Moon / Mars targets |
| GET | `/api/investigations` | Summary list (featured default) |
| GET | `/api/investigations/{id}` | Full card + PSI / DOI |
| GET | `/api/investigations/compare` | 2–3 IDs |
| GET | `/api/ranking` | Weighted ranking |
| GET | `/api/ranking/fire-safety` | Always featured |
| GET | `/api/gaps` | O₂×pressure coverage + warnings |
| GET | `/api/export` | `format=json\|csv` |
| POST | `/api/nasa/refresh` | Pull GEODE + merge |
| POST | `/api/agent/ask` | Optional Gemini (see `docs/AGENT-GEMINI.md`) |

Ports: **http://localhost:5006** · Swagger (dev): `/swagger`

---

## Frontend organization

| Path | Role |
| --- | --- |
| `src/App.tsx` | Shell — `I18nProvider` + `ChatApp` |
| `src/chat/components/` | Screens and panels |
| `src/chat/use-cases/` | Session, hydration, export, profiles/environments hooks |
| `src/chat/domain/` | Adapters, engine/parser, storage, evidence/gaps mapping |
| `src/services/api/` | Typed API clients (ranking, gaps, export, agent, …) |
| `src/services/shared/` | `contracts`, `http`, `request-state` |
| `src/i18n/` | `en-US` / `pt-BR` catalogs |
| `src/components/ui/` | shadcn-style primitives |
| `src/hooks/` | Shared React hooks |
| `vite.config.ts` | Port 3000 + proxy `/api` → `:5006` |

**Chat flow:** Profile → Analyses home (history + example chips) → Chat thread with expandable panels.

**ID map (UI ↔ API)**

| UI | API |
| --- | --- |
| `eng` / `pesq` / `est` | `ShipEngineer` / `Researcher` / `Student` |
| `lua` / `marte` / `iss` | `Moon` / `Mars` / `Iss` |

Canonical API IDs are what we persist in `localStorage`. Mapping lives in `src/chat/domain/adapters.ts`.

**Tracks (status):** T1–T6 done (typed client → API-backed chat → export/polish). Optional **T7:** main ranking screen, dedicated detail, comparer, 2D gap map, spinoffs — see `blue-ember-frontend/docs/TODO-FRONTEND.md`.

---

## Prerequisites

- Node.js 20+
- .NET SDK 8
- (Optional) Gemini API key for agent prose — `Gemini` section in backend `appsettings` / user secrets; see `blue-ember-backend/docs/AGENT-GEMINI.md`

---

## Run locally

### 1. Backend (`:5006`)

```bash
cd blue-ember-backend
dotnet run --launch-profile http
```

### 2. Frontend (`:3000`)

```bash
cd blue-ember-frontend
npm install
npm run dev
```

Open http://localhost:3000 — CORS allows that origin; the Vite proxy forwards `/api` to the API.

### Useful scripts

| Where | Command | Use |
| --- | --- | --- |
| Frontend | `npm run dev` | Dev server |
| Frontend | `npm run build` | Typecheck + production build |
| Frontend | `npm test` | Vitest |
| Backend | `dotnet build BlueEmber.sln` | Compile |
| Backend | `dotnet test BlueEmber.sln` | Score tests |

### Cache TTL (optional)

In `blue-ember-backend/appsettings.json`:

```json
"Data": {
  "CacheTtlMinutes": 0,
  "CacheRefreshCheckMinutes": 15
}
```

Set `CacheTtlMinutes` > 0 to enable background GEODE refresh when data is stale.

---

## Demo smoke checklist

| # | Action | Expected |
| --- | --- | --- |
| 1 | BE `:5006` + FE `:3000` | Health ok in header |
| 2 | Language EN / PT | UI strings switch; survives reload |
| 3 | Pick Ship Engineer | Weights match API |
| 4 | Chip e.g. “Safe fabric on the Moon?” | Bubble with real PSI tops |
| 5 | Investigations panel | C1–C5 from API |
| 6 | Gaps (Moon) | Partial-gravity warning |
| 7 | Switch environment to ISS | Ranking / gaps change |
| 8 | Export CSV | HTTP 200 download |
| 9 | API off | Clear error, no blank screen |

---

## Docs

| Doc | Content |
| --- | --- |
| [`blue-ember-backend/docs/RELATORIO-BACKEND-MVP.md`](blue-ember-backend/docs/RELATORIO-BACKEND-MVP.md) | Backend MVP report + HTTP contracts |
| [`blue-ember-backend/docs/TODO-PROXIMA-FATIA.md`](blue-ember-backend/docs/TODO-PROXIMA-FATIA.md) | Next backend slice |
| [`blue-ember-backend/docs/AGENT-GEMINI.md`](blue-ember-backend/docs/AGENT-GEMINI.md) | Agent setup |
| [`blue-ember-frontend/docs/TODO-FRONTEND.md`](blue-ember-frontend/docs/TODO-FRONTEND.md) | Frontend tracks T1–T7 |
| [`blue-ember-frontend/README.md`](blue-ember-frontend/README.md) | Frontend-only run notes |

---

*Updated 15/11/2026 — reflects API + chat integration (T1–T6), cache age/TTL, and optional Gemini agent.*
>>>>>>> origin/main
