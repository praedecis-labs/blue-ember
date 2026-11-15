# To-dos — next backend slice

**Goal:** make the API ready for the React dashboard to consume without hacks, with score protected by tests.  
**Out of this slice:** Postgres, Python worker, S3, `/ask`, real auth.

---

## High priority

- [x] **Stable FE contract**
  - Review DTOs for `ranking`, detail, `compare`, `gaps`, and `export` in Swagger
  - Align names (`criteria`, `category`, weights) with what the frontend will type
  - Document required/optional query params per route

- [x] **Seed / fire-safety default filter**
  - Default: omit `featured` = fire-safety only (~19); `featured=false` = full catalog
  - Dedicated route: `GET /api/ranking/fire-safety` (always featured)
  - Response includes `featured: true|false` so FE does not guess
  - Applied to ranking, investigations, and export

- [x] **Automated score tests**
  - Cover 3–5 fixed cases (e.g. SAFFIRE-II Moon/ShipEngineer, SAME, FLEX)
  - Ensure C1–C5 changes do not slip through silently
  - Run in local CI (`dotnet test`) before feature commit

---

## Medium priority

- [x] **GEODE cache with TTL / data age**
  - Expose cache age on `/api/health` (`dataAgeSeconds`, `lastLoadedAt`, `dataSource`, `cacheStale`)
  - Optional: light auto-refresh if TTL expires (`Data:CacheTtlMinutes` > 0 + worker)

- [ ] **Expanded query validation**
  - Invalid O2 / pressure ranges → clear 400
  - `ids` for compare (count, PSI-xx format)
  - Consistent error messages for FE

- [ ] **Structured logs on refresh**
  - GEODE latency, returned count, count after merge
  - Failure vs success distinguishable in log

---

## Later (do not start now)

- [ ] Python worker + S3 `nasa-psi` ingestion
- [ ] PostgreSQL / pgvector behind `IInvestigationRepository`
- [ ] `/ask` endpoint (AI proxy)
- [ ] Real auth (JWT/OAuth) — mock profiles remain sufficient for hackathon

---

## Suggested order for next commit

1. FE contract + (if needed) fine DTO adjustments  
2. Fire-safety default / dedicated route  
3. `ScoreCalculator` tests  
4. Validation + logs + cache age (if time remains)

---

*Current MVP reference: [RELATORIO-BACKEND-MVP.md](./RELATORIO-BACKEND-MVP.md)*