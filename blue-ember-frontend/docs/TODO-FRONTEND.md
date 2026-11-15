# To-dos — Frontend Blue Ember (chat → API)

**Objetivo:** o protótipo em `src/chat/` deixar de ser só mock local e consumir a API .NET com contrato estável, pronto para demo do hackathon.  
**Estado atual:** UI/fluxo em React; **T1+T2+T3** fechados (client HTTP + perfil/ambientes + ranking fire-safety / evidência via API). Painel Gaps ainda usa copy local (`localGaps`) até T4; chat→params finos fica em T5.  
**Fora desta fatia (hackathon):** auth real, `/ask` no backend, pgvector, Planetary Computer.

**Mapa de IDs (alinhar antes de integrar):**

| UI (protótipo) | API |
| --- | --- |
| `eng` | `ShipEngineer` |
| `pesq` | `Researcher` |
| `est` | `Student` |
| `lua` / `marte` / `iss` | `Moon` / `Mars` / `Iss` |

---

## Protótipos visuais (Notion · Stellar Hub)

Fonte: páginas [Telas e diferenciais](https://app.notion.com/p/4187d339a47981c2b28cc13bb0b38c90) e [Protótipo Visual v1 — Chat Blue Ember](https://app.notion.com/p/Prot-tipo-Visual-v1-Chat-Blue-Ember-4197d339a479817d9bc0e8ef2fe8b56f).

### Feito — Protótipo Visual v1 (chat)

- [x] HTML standalone interativo (dados fictícios) — fluxo de hipótese em linguagem natural
- [x] 3 telas: **Perfil** → **Início** (histórico + chips) → **Chat** (veredicto + painéis)
- [x] Perfis com pesos visuais C₁–C₅ (engenheiro / pesquisador / estudante)
- [x] Painéis expansíveis: condições, investigações, evidência, lacunas, follow-ups
- [x] Design system: navy `#1B2B85`, blue `#0050D8`, sky `#2491FF`, yellow `#E7F434`, Fira Sans
- [x] Portado para React em `src/chat/`
- [x] Documentado no Notion (Stellar Hub) + arquivo no repo

**Arquivos de referência**

| Onde | Caminho / link |
| --- | --- |
| Repo | `docs/prototipos/blue-ember-chat-v1.html` |
| Repo (cópia raiz) | `blue-ember-chat.html` |
| Notion | [Protótipo Visual v1](https://app.notion.com/p/Prot-tipo-Visual-v1-Chat-Blue-Ember-4197d339a479817d9bc0e8ef2fe8b56f) |
| Escopo | Tag “DADOS FICTÍCIOS · protótipo” — nomes/PSI/DOI reais; notas e textos da IA fictícios |

### Ainda não desenhados / não implementados (Telas e diferenciais)

Estas telas estão no backlog de UI do Notion; o v1 **só** materializa o fluxo de chat (antes da tela principal de ranking).

| # | Tela | Status | Notas |
| --- | --- | --- | --- |
| 1 | **Ranking** com filtros e pesos (tela principal) | [ ] | Wireframe no Notion; não está no chat v1 |
| 2 | **Detalhe da investigação** (ficha, condições, insights, fontes) | [ ] | Parcialmente coberto pelos painéis do chat; falta tela dedicada |
| 3 | **Comparador** lado a lado (2–3 investigações) | [ ] | Diferencial listado; API `compare` depois |
| 4 | **Mapa de lacunas** (O₂ × pressão vs ambiente lunar) | [ ] | Painel de gaps no chat ≠ mapa 2D |
| 5 | **Aplicações na Terra** (spinoffs por investigação) | [ ] | Dados estáticos OK; seção própria |

**Diferenciais a preservar na UI (Notion):**

- Aviso explícito de ausência de dados de gravidade parcial
- Export CSV / JSON
- Rastreabilidade: cada insight aponta para fonte (PSI / DOI)

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
| **T7 — Telas além do chat** | ranking principal, detalhe, mapa, spinoffs | após T3/T4 (ou pós-demo) |

Sugestão de donos (preencher):

- T1: ________  
- T2: ________  
- T3: ________  
- T4: ________  
- T5: ________  
- T6: ________  
- T7: ________  

---

## Prioridade alta (bloqueadores da demo)

### T1 — Contrato HTTP e camada de serviços

- [x] **Tipos TypeScript espelhando DTOs** (`src/services/contracts.ts`)
  - `ProfileDto`, `EnvironmentDto`, `InvestigationSummary/Detail`
  - `RankingResponse` / `RankingItemDto` (`criteria`, `weights`, `featured`)
  - `GapsResponse` (`partialGravityWarning`, `coverageCells`, `nearTargetInvestigationIds`)
  - `ErrorResponse` `{ error, missing? }`
- [x] **Client HTTP** (`src/services/`)
  - `getHealth`, `getProfiles`, `getEnvironments`
  - `getInvestigations`, `getInvestigation(id)`, `compareInvestigations(ids)`
  - `getRanking` / `getRankingFireSafety`
  - `getGaps`, `exportRanking` (json/csv)
  - Base: proxy Vite `/api` → `:5006` (já existe)
- [x] **Mapeamento de IDs** UI ↔ API (`src/chat/adapters.ts`)
- [x] **Estados de rede** reutilizáveis: `idle | loading | ok | error` + mensagem amigável (`src/services/request-state.ts`)
  - Hooks de dados ficam para T2; health ainda usa `use-api-health.ts`

**Done quando:** dá para chamar ranking fire-safety no DevTools/console tipado e tipar a resposta sem `any`. ✅ (14/11/2026)

---

### T2 — Perfil e ambientes reais

- [x] Carregar `GET /api/profiles` na tela de perfil (labels + barras de peso da API)
- [x] Remover pesos hardcoded de `WEIGHTS` **como fonte de verdade** (podem ficar só como fallback offline)
- [x] Carregar `GET /api/environments` (alvos O₂ / pressão / fluxo)
- [x] Persistência: gravar no `localStorage` os IDs **canônicos da API** (`ShipEngineer`, `Moon`, …)
- [x] Indicador de API no header (reusar ideia do `HomePage` health: online/offline)

**Done quando:** trocar perfil muda o ranking que a API devolve (mesmo sem chat perfeito). ✅ (15/11/2026)

---

### T3 — Ranking e força da evidência na UI

- [x] Painel **Investigações**: popular com `GET /api/ranking/fire-safety?profile=&environment=`
  - Nota / critérios C1–C5 da API (`c1Proximidade` … `c5Toxicidade`)
  - Links PSI do summary (`nasaPsiUrl`; DOI omitido — summary não traz)
- [x] Painel **Força da evidência**: derivar de ranking + gaps (não inventar % fictícios)
- [x] Remover / isolar o score local de `engine.ts` para não contradizer a API
- [x] Loading skeleton / empty / erro no painel

**Done quando:** resposta do chat mostra top investigações **iguais** ao Swagger para o mesmo profile+environment. ✅ (15/11/2026)

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

## Prioridade baixa / depois (T7 — além do chat)

Alinhado a [Telas e diferenciais](https://app.notion.com/p/4187d339a47981c2b28cc13bb0b38c90) e [Próximos passos](https://app.notion.com/p/4187d339a47981788c76ec96609afc2d) (“Desenhar as telas no Figma” ainda aberto).

- [ ] Tela **Ranking principal** (filtros categoria / O₂ / pressão + sliders de pesos) — wireframe Notion
- [ ] Tela **Detalhe** dedicada da investigação
- [ ] Tela **Comparador** (2–3 IDs) com `GET /api/investigations/compare`
- [ ] **Mapa de lacunas** O₂ × pressão (visual 2D; não só lista no painel)
- [ ] Seção **Spinoffs / aplicações na Terra** por investigação
- [ ] Catálogo browse (`featured=false`) fora do chat
- [ ] Testes unitários do parser + adapter de IDs
- [ ] Endpoint futuro `/ask` (só quando o BE existir)

---

## Ordem sugerida (se só 1–2 pessoas)

1. **T1** contratos + client  
2. **T2** perfil/ambiente  
3. **T3** ranking nos painéis  
4. **T4** gaps  
5. **T5** ligar o chat às chamadas  
6. **T6** export + polish da demo  
7. **T7** telas além do chat (se sobrar tempo)

Se forem **3+ pessoas:** T1 sozinho → em seguida T2 ∥ T3 ∥ T4 → T5 integra → T6 fecha → T7 opcional.

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

- Notion Stellar Hub: [Telas e diferenciais](https://app.notion.com/p/4187d339a47981c2b28cc13bb0b38c90) · [Protótipo Visual v1](https://app.notion.com/p/Prot-tipo-Visual-v1-Chat-Blue-Ember-4197d339a479817d9bc0e8ef2fe8b56f) · [Próximos passos](https://app.notion.com/p/4187d339a47981788c76ec96609afc2d)
- Backend contratos: `blue-ember-backend/docs/RELATORIO-BACKEND-MVP.md` §9  
- Backend próximos: `blue-ember-backend/docs/TODO-PROXIMA-FATIA.md`  
- UI atual: `src/chat/`  
- Protótipo v1: `docs/prototipos/blue-ember-chat-v1.html`

---

*Atualizado 15/11/2026 — T1 + T2 + T3 fechados (ranking fire-safety + evidência via API nos painéis). Próximo: T4 gaps & fontes.*
