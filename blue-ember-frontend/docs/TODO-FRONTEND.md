# To-dos — Frontend Blue Ember (chat → API)

**Objetivo:** o protótipo em `src/chat/` deixar de ser só mock local e consumir a API .NET com contrato estável, pronto para demo do hackathon.  
**Estado atual:** UI/fluxo portados do `blue-ember-chat.html`; score, gaps e ranking ainda são **locais** (`src/chat/data.ts` + `engine.ts`). Só existe `services/health.ts`.  
**Fora desta fatia (hackathon):** auth real, `/ask` no backend, pgvector, Planetary Computer.

**Mapa de IDs (alinhar antes de integrar):**

| UI (protótipo) | API |
| --- | --- |
| `eng` | `ShipEngineer` |
| `pesq` | `Researcher` |
| `est` | `Student` |
| `lua` / `marte` / `iss` | `Moon` / `Mars` / `Iss` |

---

## Como dividir (tracks)

| Track | Foco | Pode paralelizar com |
| --- | --- | --- |
| **T1 — Contrato & client** | types + `fetch` tipado | sozinho (bloqueia T2–T4) |
| **T2 — Perfil & ambiente** | tela de perfil + pesos da API | após T1 |
| **T3 — Ranking & evidência** | painéis Inv / Força | após T1 (+ T2 ideal) |
| **T4 — Gaps & fontes** | painel lacunas + links PSI | após T1 |
| **T5 — Chat → query** | parser → params de ranking/gaps | após T2/T3 |
| **T6 — Demo polish** | export, erros, limpeza, README | após T3/T4 |

Sugestão de donos (preencher):

- T1: ________  
- T2: ________  
- T3: ________  
- T4: ________  
- T5: ________  
- T6: ________  

---

## Prioridade alta (bloqueadores da demo)

### T1 — Contrato HTTP e camada de serviços

- [ ] **Tipos TypeScript espelhando DTOs** (`src/types/api.ts` ou `src/services/contracts.ts`)
  - `ProfileDto`, `EnvironmentDto`, `InvestigationSummary/Detail`
  - `RankingResponse` / `RankingItemDto` (`criteria`, `weights`, `featured`)
  - `GapsResponse` (`partialGravityWarning`, `coverageCells`, `nearTargetInvestigationIds`)
  - `ErrorResponse` `{ error, missing? }`
- [ ] **Client HTTP** (`src/services/`)
  - `getHealth`, `getProfiles`, `getEnvironments`
  - `getInvestigations`, `getInvestigation(id)`, `compareInvestigations(ids)`
  - `getRanking` / `getRankingFireSafety`
  - `getGaps`, `exportRanking` (json/csv)
  - Base: proxy Vite `/api` → `:5006` (já existe)
- [ ] **Mapeamento de IDs** UI ↔ API (tabela acima) num único módulo (`src/chat/adapters.ts`)
- [ ] **Estados de rede** reutilizáveis: `idle | loading | ok | error` + mensagem amigável

**Done quando:** dá para chamar ranking fire-safety no DevTools/console tipado e tipar a resposta sem `any`.

---

### T2 — Perfil e ambientes reais

- [ ] Carregar `GET /api/profiles` na tela de perfil (labels + barras de peso da API)
- [ ] Remover pesos hardcoded de `WEIGHTS` **como fonte de verdade** (podem ficar só como fallback offline)
- [ ] Carregar `GET /api/environments` (alvos O₂ / pressão / fluxo)
- [ ] Persistência: gravar no `localStorage` os IDs **canônicos da API** (`ShipEngineer`, `Moon`, …)
- [ ] Indicador de API no header (reusar ideia do `HomePage` health: online/offline)

**Done quando:** trocar perfil muda o ranking que a API devolve (mesmo sem chat perfeito).

---

### T3 — Ranking e força da evidência na UI

- [ ] Painel **Investigações**: popular com `GET /api/ranking/fire-safety?profile=&environment=`
  - Nota / critérios C1–C5 da API (`c1Proximidade` … `c5Toxicidade`)
  - Links PSI / DOI do summary
- [ ] Painel **Força da evidência**: derivar de ranking + gaps (não inventar % fictícios)
- [ ] Remover / isolar o score local de `engine.ts` para não contradizer a API
- [ ] Loading skeleton / empty / erro no painel

**Done quando:** resposta do chat mostra top investigações **iguais** ao Swagger para o mesmo profile+environment.

---

### T4 — Gaps e fontes

- [ ] Painel **O que falta testar**: consumir `GET /api/gaps?environment=`
  - Usar `partialGravityWarning` e células / near targets
- [ ] Painel **Fontes**: links oficiais a partir dos IDs retornados (PSI URL + DOI)
- [ ] Manter disclaimer honesto: “síntese da UI; score da API”

**Done quando:** ambiente Moon mostra alerta de gravidade parcial vindo do backend.

---

## Prioridade média (fecha o fluxo de chat)

### T5 — Chat: do texto aos params da API

- [ ] Manter o **parser** local (útil no hackathon; BE não tem `/ask`)
- [ ] Mapear hipótese parseada → `environment` + filtros relevantes (O₂/pressão quando a API aceitar)
- [ ] Fluxo: mensagem → chama ranking + gaps → monta bolha AI com painéis
- [ ] Follow-ups (“E se fosse na ISS?”) → nova chamada à API, não só re-score local
- [ ] Formulário **Ajustar condições** → dispara novo ranking/gaps
- [ ] Histórico (`localStorage`): guardar `profile`, `environment`, texto, top IDs da API

**Done quando:** um exemplo do chip “Tecido seguro na Lua?” gera bolha alimentada pela API.

---

### T6 — Demo polish e limpeza

- [ ] **Export**: botão que chama `GET /api/export?format=csv|json` com profile/environment atuais
- [ ] Tag do header: trocar “DADOS FICTÍCIOS” por algo como “Score via API · síntese local” quando T3 ok
- [ ] Remover ou arquivar `pages/HomePage*` se não for mais usada
- [ ] Tratar 400 da API (ranges inválidos) no composer / form
- [ ] `README` do frontend: como subir FE+BE juntos, ports 3000/5006
- [ ] Smoke manual checklist (abaixo)

**Done quando:** demo de 5 minutos roda sem abrir Swagger.

---

## Prioridade baixa / depois

- [ ] Tela compare (2–3 IDs) com `GET /api/investigations/compare`
- [ ] Catálogo browse (`featured=false`) fora do chat
- [ ] Testes unitários do parser + adapter de IDs
- [ ] Endpoint futuro `/ask` (só quando o BE existir)
- [ ] Spinoffs / Apollo-Mir como seção narrativa (dados estáticos OK)

---

## Ordem sugerida (se só 1–2 pessoas)

1. **T1** contratos + client  
2. **T2** perfil/ambiente  
3. **T3** ranking nos painéis  
4. **T4** gaps  
5. **T5** ligar o chat às chamadas  
6. **T6** export + polish da demo  

Se forem **3+ pessoas:** T1 sozinho → em seguida T2 ∥ T3 ∥ T4 → T5 integra → T6 fecha.

---

## Checklist smoke (demo day)

| # | Ação | Esperado |
| --- | --- | --- |
| 1 | BE `:5006` + FE `:3000` | Health ok no header |
| 2 | Escolher Engenheiro | Pesos = API ShipEngineer |
| 3 | Chip “Tecido seguro na Lua?” | Bolha com top PSI reais |
| 4 | Abrir Investigações | Barras C1–C5 da API |
| 5 | Abrir Gaps (Moon) | Warning gravidade parcial |
| 6 | Trocar para ISS no form | Ranking/gaps mudam |
| 7 | Export CSV | Download 200 |
| 8 | API off | Mensagem clara, sem tela branca |

---

## Referências

- Backend contratos: `blue-ember-backend/docs/RELATORIO-BACKEND-MVP.md` §9  
- Backend próximos: `blue-ember-backend/docs/TODO-PROXIMA-FATIA.md`  
- UI atual: `src/chat/`  
- Protótipo original: `blue-ember-chat.html`

---

*Atualizar este arquivo quando um track fechar (marcar checkboxes + data).*
