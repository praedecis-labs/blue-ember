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

- [ ] **Real DOIs (data validity)** — reported 15/11 by Luan
  - Today the DOIs come from the hand-written `ENRICHMENT` block in `scripts/normalize_nasa_data.py`, built as `10.25923/nasa.psi-<n>`. They **do not exist**: e.g. `https://doi.org/10.25923/nasa.psi-99` returns "DOI Not Found".
  - Real PSI DOIs use the prefix `10.60555`. Example: SAFFIRE-II (PSI-99) = `10.60555/2chp-m469`, which resolves to the official page `https://psi.nasa.gov/physci/repo/data/investigations/PSI-99` (the DOI is shown under the title).
  - Fix: take the DOI from the PSI/GEODE data for each investigation (or leave `doi` empty when unknown) instead of generating it.
  - Frontend workaround (branch `feat/design-system`): DOIs are hidden in the Sources and Investigations panels (`SHOW_DOI = false` in `src/chat/components/detail-panels/types.ts`); only the real PSI link is shown. Flip it to `true` once the backend sends real DOIs.
  - Same block also hand-writes O₂/pressure ranges and C2–C5 metrics (e.g. SAFFIRE-II at 21–34% O₂, while the tests ran near 21–22%). Mark measured vs estimated fields, or use `null` = "no data".

---

- [ ] **Broken PSI links (`nasa_psi_url`)**: reported 15/11 by Luan
  - `scripts/normalize_nasa_data.py` (around line 282) builds `https://psi.nasa.gov/physci/repo/investigations/<PSI-n>`. That address opens the PSI **404 page**.
  - The working address has `/data/`: `https://psi.nasa.gov/physci/repo/data/investigations/<PSI-n>` (checked 15/11 for the 19 featured fire-safety investigations).
  - Fix: add `/data/` in the normalizer and regenerate `data/normalized_investigations.json`.
  - Frontend workaround (already on `main`): `src/chat/domain/psi-url.ts` builds the link from the id, so the screen is correct even before the backend fix.

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
