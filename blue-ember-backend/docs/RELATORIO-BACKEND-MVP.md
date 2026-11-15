# Implementation report — Blue Ember Backend (MVP)

**Date:** 14/11/2026  
**Project:** Blue Ember · NASA Space Apps 2026 · Flame in Freefall  
**Team:** Stellar Hub  
**Documentation base:** Notion [Stellar Hub](https://app.notion.com/p/guraburieuru/Stellar-Hub-4187d339a47981df9daae02450da8c67) (Architecture, Data and access, Information Model, Ranking, Screens, Metrics Doc)

---

## 1. Executive summary

The **ASP.NET Core 8 public API** (Minimal API, Vertical Slice) was implemented to:

1. Consume the **official NASA PSI database (GEODE)** + local JSON cache.
2. Expose investigations, ranking, gaps, and export for the React dashboard.
3. Treat **user profiles as mock** (no user database, no OAuth/JWT).

**Out of scope (intentional):** Python worker, PostgreSQL/pgvector, `/ask` endpoint, real authentication, S3 `nasa-psi` ingestion, React screens.

---

## 2. Before × after

| Aspect | Before | After |
| --- | --- | --- |
| Endpoints | Only `GET /api/health` | Health + Investigations + Ranking + Profiles + Environments + Gaps + Export + NASA refresh |
| NASA data | Orphan TS client at root + JSON in `data/` | Backend reads JSON on boot; fallback and refresh via GEODE; root Vite prototype removed |
| Profiles | None | Mock enum: Student / Researcher / ShipEngineer |
| Score | None | C1–C5 with weights per profile |
| User persistence | — | **Not created** (confirmed decision) |

---

## 3. Applied architecture

```
NASA PSI GEODE  ──HttpClient──►  BlueEmber.Api (.NET 8)
                                      ▲
normalized_investigations.json ───────┘  (boot + offline)
                                      │
                                      ▼
                              React (localhost:3000)
```

- **Future contract:** `IInvestigationRepository` allows swapping JSON/GEODE for Postgres without changing HTTP routes.
- **CORS:** `http://localhost:3000`
- **Port:** `http://localhost:5006` (Swagger at `/swagger`)

---

## 4. Folder structure created

```
blue-ember-backend/
├── Program.cs                          # DI, middleware, Map*Endpoints, bootstrap
├── appsettings.json                    # NasaPsi + Data paths
├── BlueEmber.Api.http                  # smoke requests
├── Domain/
│   ├── Investigations/Investigation.cs
│   ├── Categories/CategoryMapper.cs
│   ├── Profiles/UserProfile.cs         # mock + weights
│   ├── Environments/MissionEnvironment.cs
│   └── Scoring/ScoreCalculator.cs
├── Infrastructure/
│   ├── NasaPsi/
│   │   ├── NasaPsiOptions.cs
│   │   ├── NasaPsiClient.cs
│   │   └── InvestigationNormalizer.cs
│   └── Data/
│       ├── DataOptions.cs
│       ├── IInvestigationRepository.cs
│       └── JsonInvestigationStore.cs
└── Features/
    ├── Contracts/                      # typed DTOs (Swagger / FE)
    ├── Health/
    ├── Investigations/
    ├── Ranking/
    ├── Gaps/
    ├── Export/
    └── Nasa/
```


---

## 5. NASA configuration

In `appsettings.json`:

```json
"NasaPsi": {
  "BaseUrl": "https://psi.nasa.gov/geode-py/ws/repo/search",
  "DefaultQuery": "combustion",
  "DefaultResearchArea": "Combustion Science",
  "DefaultSize": 150,
  "TimeoutSeconds": 30
},
"Data": {
  "NormalizedInvestigationsPath": "data/normalized_investigations.json"
}
```

**Boot:** loads JSON → if empty, tries GEODE.  
**Refresh:** `POST /api/nasa/refresh` fetches GEODE, merges with enriched metrics from cache and, in Development, rewrites JSON.

---

## 6. Profiles (mock — no user database)

| Id | Label | Weights (w1…w5) |
| --- | --- | --- |
| `Student` | Student | 0.20 uniform |
| `Researcher` | Researcher | C1=0.35; rest ≈0.1625 |
| `ShipEngineer` | Ship engineer | C2=0.25, C3=0.25, C1=0.20, C4=0.15, C5=0.15 |

Usage: query `?profile=ShipEngineer` (or override `w1`…`w5`).  
List: `GET /api/profiles`.

---

## 7. Mission environments

| Id | O2 target | Pressure | Use |
| --- | --- | --- | --- |
| `Iss` | 21% | 101.3 kPa | Station |
| `Moon` | 30% | 70.3 kPa | Lunar base (Notion) |
| `Mars` | 30% | ~70 kPa | Martian base (MVP) |

List: `GET /api/environments`.

---

## 8. Score (C1–C5)

```
S = w1·C1 + w2·C2 + w3·C3 + w4·C4 + w5·C5   → ~0–10 scale on API
```

Stable JSON (camelCase) — type these names in FE:

| Criterion | Field in `criteria` | Investigation fields |
| --- | --- | --- |
| C1 | `c1Proximidade` | `o2Range`, `pressureKpa`, `flowSpeedCms` |
| C2 | `c2MargemMoc` | `mocPercent` |
| C3 | `c3Cinetica` | `flameSpreadRateMms` |
| C4 | `c4SeveridadeTermica` | `hrrKw` |
| C5 | `c5Toxicidade` | `coPpm` |

Weights: `weights.w1`…`w5`. Total score: `score` (0–10).  
Categories: `prevencao` / `deteccao` / `supressao` / `outro`.

**Export CSV:** short columns `c1`…`c5` map to the same criteria (`c1` ↔ `c1Proximidade`, …).

---

## 9. Delivered HTTP contracts

Typed DTOs in `Features/Contracts/` + schemas in Swagger (Dev). Contract errors: `{ error, missing? }`.

| Method | Route | Purpose |
| --- | --- | --- |
| GET | `/api/health` | Service status |
| GET | `/api/profiles` | Mock profiles + weights |
| GET | `/api/environments` | Environments + targets |
| GET | `/api/investigations` | Summary list (default fire-safety; `featured=false` = all) |
| GET | `/api/investigations/{id}` | Full card + PSI / DOI URL |
| GET | `/api/investigations/compare` | Compare 2–3 cards |
| GET | `/api/ranking` | Ranking + C1–C5 `criteria` (default fire-safety) |
| GET | `/api/ranking/fire-safety` | Explicit featured ranking shortcut |
| GET | `/api/gaps` | O2×P grid + partial gravity warning |
| GET | `/api/export` | Export JSON (named criteria) or CSV (same featured default) |
| POST | `/api/nasa/refresh` | Sync GEODE → memory (+ disk in Dev) |

### Query params (required / optional / default)

| Route | Params |
| --- | --- |
| `GET /api/investigations` | **Optional:** `q`, `category`, `featured` (default `true`; `false` = full catalog), `o2Min`, `o2Max`, `pressureMin`, `pressureMax` |
| `GET /api/investigations/{id}` | **Required path:** `id` |
| `GET /api/investigations/compare` | **Required:** `ids` (2 or 3 comma-separated IDs) |
| `GET /api/ranking` | **Optional:** `profile` (default `Student`), `environment` (default `Moon`), `category`, `featured` (default `true`), `w1`…`w5` |
| `GET /api/ranking/fire-safety` | Same params as ranking, always featured |
| `GET /api/gaps` | **Optional:** `environment` (default `Moon`); always filters featured fire-safety |
| `GET /api/export` | **Optional:** `format` (default `json`; `csv` → download), `profile` (default `Student`), `environment` (default `Moon`), `category`, `featured` (default `true`; no `w*` override) |

### Main JSON shapes

- **Ranking / export JSON:** `profile`, `environment`, `featured`, `weights`, `count`, `items[]` — ranking item: `rank`, `score`, `criteria`, `investigation` (summary); export item: `id`, `acronym`, `title`, `category`, `score`, `criteria`, `nasaPsiUrl`, `doi`
- **List:** `{ featured, count, items }` (summary); **compare:** `{ count, items }` (detail)
- **Gaps:** `environment`, `targets` (`o2Percent`, `pressureKpa`, `flowCms`), `partialGravityWarning`, `nearTargetInvestigationIds`, `coverageCells[]`, `featuredCount`

---

## 10. Validation (smoke test)

Run against `http://localhost:5006`:

| Test | Result |
| --- | --- |
| Health | `{ status: "ok", service: "BlueEmber.Api" }` |
| Profiles | 3 profiles with correct weights |
| Investigations (no `featured`) | **19** cards (default fire-safety) |
| Ranking Moon + ShipEngineer (no `featured`) | Top: SAFFIRE-II (PSI-99), SAFFIRE-III, SAFFIRE-I |
| Compare | 2 items OK |
| Gaps Moon | 19 featured + partial gravity warning |
| Export CSV | HTTP 200 |
| `POST /api/nasa/refresh` | `refreshed: true`, **133** investigations, 19 featured |

Build: `dotnet build` — 0 errors, 0 warnings.

---

## 11. Data sources used

| File / source | Role |
| --- | --- |
| `blue-ember-backend/data/normalized_investigations.json` | Main cache on boot (~133 cards) |
| `https://psi.nasa.gov/geode-py/ws/repo/search` | Official GEODE source (refresh/fallback) |
| `blue-ember-backend/scripts/normalize_nasa_data.py` | Historical origin of enrichment |
| Notion Stellar Hub | Score, profiles, screens, and architecture requirements |

---

## 12. Explicit decisions

1. **Mock profiles** — no user table, login, or JWT (avoids unnecessary hackathon time).
2. **No Postgres in this slice** — JSON + GEODE; repository interfaced for future migration.
3. **No Python worker / AI `/ask`** — next increment.
4. **Refresh merge** — GEODE updates metadata; enriched metrics from local cache are preserved when `id` already exists.

---

## 13. How to run

```bash
cd blue-ember-backend
dotnet run --launch-profile http
```

- API: http://localhost:5006  
- Swagger: http://localhost:5006/swagger  
- Examples: `BlueEmber.Api.http`

Frontend (already with proxy `/api` → `:5006`):

```bash
cd blue-ember-frontend
npm run dev
```

---

## 14. Suggested next steps (not done)

- Python worker + S3 `nasa-psi` + embeddings / pgvector  
- Postgres persistence behind `IInvestigationRepository`  
- `/ask` endpoint (proxy)  
- React consuming routes (ranking, detail, comparer, gaps, export)  
- Fine-tune weights/normalization with metrics team  

---

*Report generated from the Backend Blue Ember implementation plan in the `blue-ember` repository.*