# On-topic hypothesis gate — Implementation Plan

> **For agentic workers:** Execute inline (executing-plans). Checkbox tracking optional for this small change.

**Goal:** Reject off-topic / vague chat messages before Gemini and before history cards.

**Architecture:** Shared rule conceptually on FE + BE: accept only if length ≥ 4 and (`parseHypothesis` yields a signal **or** domain keyword PT/EN). FE blocks in `sendText` before `upsertHistory` / `askAgent`. BE returns 400 on `/api/agent/ask`.

**Tech Stack:** TypeScript (Vite/React), ASP.NET Core Minimal API

**Spec:** Approved short design in chat (15/11/2026) — FE + BE local heuristic, no Gemini classifier.

## Tasks

- [ ] FE: `isOnTopicHypothesis` helper + i18n + gate in `sendText`
- [ ] BE: same gate in `AgentEndpoints` before Gemini
- [ ] Build FE + BE (no unit-test run unless requested)

## Global Constraints

- Do not add off-topic items to `localStorage` history
- API error strings remain English
- UI errors via i18n EN/PT
