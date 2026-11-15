# To-dos — Frontend Blue Ember (chat → API)

**Goal:** the prototype in `src/chat/` stops being local mock only and consumes the .NET API with a stable contract, ready for hackathon demo.  
**Current state:** UI/flow in React; **T1–T6** done (API in chat + demo export/polish). Next optional: T7 screens beyond chat.  
**Out of this slice (hackathon):** real auth, pgvector, Planetary Computer.  
**Agent:** `POST /api/agent/ask` (NVIDIA → Gemini fallback + tools) — see `blue-ember-backend/docs/AGENT-NVIDIA.md`; chat uses agent prose with fallback to templates.

**ID map (align before integrating):**

| UI (prototype) | API |
| --- | --- |
| `eng` | `ShipEngineer` |
| `pesq` | `Researcher` |
| `est` | `Student` |
| `lua` / `marte` / `iss` | `Moon` / `Mars` / `Iss` |

---

## Visual prototypes (Notion · Stellar Hub)

Source: [Screens and differentiators](https://app.notion.com/p/4187d339a47981c2b28cc13bb0b38c90) and [Visual Prototype v1 — Blue Ember Chat](https://app.notion.com/p/Prot-tipo-Visual-v1-Chat-Blue-Ember-4197d339a479817d9bc0e8ef2fe8b56f) pages.

### Done — Visual Prototype v1 (chat)

- [x] Interactive standalone HTML (fictional data) — hypothesis flow in natural language
- [x] 3 screens: **Profile** → **Home** (history + chips) → **Chat** (verdict + panels)
- [x] Profiles with visual C₁–C₅ weights (engineer / researcher / student)
- [x] Expandable panels: conditions, investigations, evidence, gaps, follow-ups
- [x] Design system: navy `#1B2B85`, blue `#0050D8`, sky `#2491FF`, yellow `#E7F434`, Fira Sans
- [x] Ported to React in `src/chat/`
- [x] Documented in Notion (Stellar Hub) + file in repo

**Reference files**

| Where | Path / link |
| --- | --- |
| Repo | `docs/prototipos/blue-ember-chat-v1.html` |
| Repo (root copy) | `blue-ember-chat.html` |
| Notion | [Visual Prototype v1](https://app.notion.com/p/Prot-tipo-Visual-v1-Chat-Blue-Ember-4197d339a479817d9bc0e8ef2fe8b56f) |
| Scope | Tag “FICTITIOUS DATA · prototype” — real names/PSI/DOI; notes and AI text fictional |

### Not yet designed / not implemented (Screens and differentiators)

These screens are in the Notion UI backlog; v1 **only** implements the chat flow (before the main ranking screen).

| # | Screen | Status | Notes |
| --- | --- | --- | --- |
| 1 | **Ranking** with filters and weights (main screen) | [ ] | Wireframe in Notion; not in chat v1 |
| 2 | **Investigation detail** (card, conditions, insights, sources) | [ ] | Partially covered by chat panels; dedicated screen missing |
| 3 | **Side-by-side comparer** (2–3 investigations) | [ ] | Listed differentiator; API `compare` later |
| 4 | **Gap map** (O₂ × pressure vs lunar environment) | [ ] | Chat gaps panel ≠ 2D map |
| 5 | **Terrestrial applications** (spinoffs per investigation) | [ ] | Static data OK; own section |

**Differentiators to preserve in the UI (Notion):**

- Explicit warning of missing partial-gravity data
- Export CSV / JSON
- Traceability: each insight points to source (PSI / DOI)

---

## How to split (tracks)

| Track | Focus | Can parallelize with |
| --- | --- | --- |
| **T1 — Contract & client** | types + typed `fetch` | alone (blocks T2–T4) |
| **T2 — Profile & environment** | profile screen + API weights | after T1 |
| **T3 — Ranking & evidence** | Inv / Strength panels | after T1 (+ T2 ideal) |
| **T4 — Gaps & sources** | gaps panel + PSI links | after T1 |
| **T5 — Chat → query** | parser → ranking/gaps params | after T2/T3 |
| **T6 — Demo polish** | export, errors, cleanup, README | after T3/T4 |
| **T7 — Screens beyond chat** | main ranking, detail, map, spinoffs | after T3/T4 (or post-demo) |

Suggested owners (fill in):

- T1: ________  
- T2: ________  
- T3: ________  
- T4: ________  
- T5: ________  
- T6: ________  
- T7: ________  

---

## High priority (demo blockers)

### T1 — HTTP contract and service layer

- [x] **TypeScript types mirroring DTOs** (`src/services/shared/contracts.ts`)
  - `ProfileDto`, `EnvironmentDto`, `InvestigationSummary/Detail`
  - `RankingResponse` / `RankingItemDto` (`criteria`, `weights`, `featured`)
  - `GapsResponse` (`partialGravityWarning`, `coverageCells`, `nearTargetInvestigationIds`)
  - `ErrorResponse` `{ error, missing? }`
- [x] **HTTP client** (`src/services/`)
  - `getHealth`, `getProfiles`, `getEnvironments`
  - `getInvestigations`, `getInvestigation(id)`, `compareInvestigations(ids)`
  - `getRanking` / `getRankingFireSafety`
  - `getGaps`, `exportRanking` (json/csv)
  - Base: Vite proxy `/api` → `:5006` (already exists)
- [x] **ID mapping** UI ↔ API (`src/chat/domain/adapters.ts`)
- [x] **Reusable network states**: `idle | loading | ok | error` + friendly message (`src/services/shared/request-state.ts`)
  - Data hooks left for T2; health still uses `use-api-health.ts`

**Done when:** you can call fire-safety ranking in DevTools/console typed and type the response without `any`. ✅ (14/11/2026)

---

### T2 — Real profile and environments

- [x] Load `GET /api/profiles` on profile screen (labels + weight bars from API)
- [x] Remove hardcoded `WEIGHTS` **as source of truth** (may remain offline fallback only)
- [x] Load `GET /api/environments` (O₂ / pressure / flow targets)
- [x] Persistence: save **canonical API IDs** in `localStorage` (`ShipEngineer`, `Moon`, …)
- [x] API indicator in header (reuse `HomePage` health idea: online/offline)

**Done when:** changing profile changes the ranking the API returns (even without perfect chat). ✅ (15/11/2026)

---

### T3 — Ranking and evidence strength in the UI

- [x] **Investigations** panel: populate with `GET /api/ranking/fire-safety?profile=&environment=`
  - Score / C1–C5 criteria from API (`c1Proximidade` … `c5Toxicidade`)
  - PSI links from summary (`nasaPsiUrl`; DOI omitted — summary does not include it)
- [x] **Evidence strength** panel: derive from ranking + gaps (do not invent fictional %)
- [x] Remove / isolate local score in `engine.ts` so it does not contradict the API
- [x] Loading skeleton / empty / error in panel

**Done when:** chat response shows top investigations **matching** Swagger for the same profile+environment. ✅ (15/11/2026)

---

### T4 — Gaps and sources

- [x] **What still needs testing** panel: consume `GET /api/gaps?environment=`
  - Use `partialGravityWarning` and cells / near targets
- [x] **Sources** panel: official links from returned IDs (PSI URL + DOI)
- [x] Keep honest disclaimer: “UI synthesis; score from API”

**Done when:** Moon environment shows partial-gravity alert from backend. ✅ (15/11/2026)

---

## Medium priority (closes chat flow)

### T5 — Chat: from text to API params

- [x] Keep local **parser** (useful for hackathon; BE has no `/ask`)
- [x] Map parsed hypothesis → `environment` + relevant filters (`category` via goal; O₂/pressure only when API accepts — today only in investigations)
- [x] Flow: message → call ranking + gaps → build AI bubble with panels
- [x] Follow-ups (“What if on the ISS?”) → new API call, not just local re-score
- [x] **Adjust conditions** form → triggers new ranking/gaps
- [x] History (`localStorage`): store `profile`, `environment`, text, top IDs from API

**Done when:** a chip example “Safe fabric on the Moon?” produces a bubble fed by the API. ✅ (15/11/2026)

---

### T6 — Demo polish and cleanup

- [x] **Export**: button calling `GET /api/export?format=csv|json` with current profile/environment
- [x] Header tag: replace “FICTITIOUS DATA” with something like “Score via API · local synthesis” when T3 ok
- [x] Remove or archive `pages/HomePage*` if unused — N/A (`App` → `ChatApp`; home = `AnalysesHome`; `ShadcnDemo` not mounted)
- [x] Handle API 400 (invalid ranges) in composer / form
- [x] Frontend `README`: how to run FE+BE together, ports 3000/5006
- [x] Manual smoke checklist (below)

**Done when:** 5-minute demo runs without opening Swagger. ✅ (15/11/2026)

---

## Low priority / later (T7 — beyond chat)

Aligned with [Screens and differentiators](https://app.notion.com/p/4187d339a47981c2b28cc13bb0b38c90) and [Next steps](https://app.notion.com/p/4187d339a47981788c76ec96609afc2d) (“Design screens in Figma” still open).

- [ ] **Main ranking** screen (category / O₂ / pressure filters + weight sliders) — Notion wireframe
- [ ] Dedicated **Detail** screen for investigation
- [ ] **Comparer** screen (2–3 IDs) with `GET /api/investigations/compare`
- [ ] O₂ × pressure **gap map** (2D visual; not just list in panel)
- [ ] **Spinoffs / terrestrial applications** section per investigation
- [ ] Catalog browse (`featured=false`) outside chat
- [ ] Unit tests for parser + ID adapter
- [ ] Future `/ask` endpoint (only when BE exists)

---

## Suggested order (if only 1–2 people)

1. **T1** contracts + client  
2. **T2** profile/environment  
3. **T3** ranking in panels  
4. **T4** gaps  
5. **T5** wire chat to calls  
6. **T6** export + demo polish  
7. **T7** screens beyond chat (if time remains)

If **3+ people:** T1 alone → then T2 ∥ T3 ∥ T4 → T5 integrates → T6 closes → T7 optional.

---

## Smoke checklist (demo day)

| # | Action | Expected |
| --- | --- | --- |
| 1 | BE `:5006` + FE `:3000` | Health ok in header |
| 2 | Choose Engineer | Weights = API ShipEngineer |
| 3 | Chip “Safe fabric on the Moon?” | Bubble with real top PSIs |
| 4 | Open Investigations | C1–C5 bars from API |
| 5 | Open Gaps (Moon) | Partial gravity warning |
| 6 | Switch to ISS in form | Ranking/gaps change |
| 7 | Export CSV | Download 200 |
| 8 | API off | Clear message, no white screen |

---

## References

- Notion Stellar Hub: [Screens and differentiators](https://app.notion.com/p/4187d339a47981c2b28cc13bb0b38c90) · [Visual Prototype v1](https://app.notion.com/p/Prot-tipo-Visual-v1-Chat-Blue-Ember-4197d339a479817d9bc0e8ef2fe8b56f) · [Next steps](https://app.notion.com/p/4187d339a47981788c76ec96609afc2d)
- Backend contracts: `blue-ember-backend/docs/RELATORIO-BACKEND-MVP.md` §9  
- Backend next: `blue-ember-backend/docs/TODO-PROXIMA-FATIA.md`  
- Current UI: `src/chat/`  
- Prototype v1: `docs/prototipos/blue-ember-chat-v1.html`

---

*Updated 15/11/2026 — T1–T6 done (CSV/JSON export in header, honest tags, composer errors, FE+BE README). Next optional: T7.*