# Relatório de implementação — Backend Blue Ember (MVP)

**Data:** 14/11/2026  
**Projeto:** Blue Ember · NASA Space Apps 2026 · Flame in Freefall  
**Equipe:** Stellar Hub  
**Base documental:** Notion [Stellar Hub](https://app.notion.com/p/guraburieuru/Stellar-Hub-4187d339a47981df9daae02450da8c67) (Arquitetura, Dados e acesso, Modelo de Informações, Ranqueamento, Telas, Doc de Métricas)

---

## 1. Resumo executivo

Foi implementada a **API pública ASP.NET Core 8** (Minimal API, Vertical Slice) que:

1. Consome o **banco oficial NASA PSI (GEODE)** + cache local JSON.
2. Expõe investigações, ranking, gaps e exportação para o dashboard React.
3. Trata **perfis de usuário como mock** (sem banco de users, sem OAuth/JWT).

**Fora deste escopo (proposital):** worker Python, PostgreSQL/pgvector, endpoint `/ask`, autenticação real, ingestão S3 `nasa-psi`, telas React.

---

## 2. Antes × depois

| Aspecto | Antes | Depois |
| --- | --- | --- |
| Endpoints | Só `GET /api/health` | Health + Investigations + Ranking + Profiles + Environments + Gaps + Export + NASA refresh |
| Dados NASA | Cliente TS órfão na raiz + JSON em `data/` | Backend lê o JSON no boot; fallback e refresh via GEODE; protótipo Vite da raiz removido |
| Perfis | Inexistentes | Enum mock: Student / Researcher / ShipEngineer |
| Score | Inexistente | C1–C5 com pesos por perfil |
| Persistência de users | — | **Não criada** (decisão confirmada) |

---

## 3. Arquitetura aplicada

```
NASA PSI GEODE  ──HttpClient──►  BlueEmber.Api (.NET 8)
                                      ▲
normalized_investigations.json ───────┘  (boot + offline)
                                      │
                                      ▼
                              React (localhost:3000)
```

- **Contrato futuro:** `IInvestigationRepository` permite trocar JSON/GEODE por Postgres sem mudar as rotas HTTP.
- **CORS:** `http://localhost:3000`
- **Porta:** `http://localhost:5006` (Swagger em `/swagger`)

---

## 4. Estrutura de pastas criada

```
blue-ember-backend/
├── Program.cs                          # DI, middleware, Map*Endpoints, bootstrap
├── appsettings.json                    # NasaPsi + Data paths
├── BlueEmber.Api.http                  # requests de smoke
├── Domain/
│   ├── Investigations/Investigation.cs
│   ├── Categories/CategoryMapper.cs
│   ├── Profiles/UserProfile.cs         # mock + pesos
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
    ├── Contracts/                      # DTOs tipados (Swagger / FE)
    ├── Health/
    ├── Investigations/
    ├── Ranking/
    ├── Gaps/
    ├── Export/
    └── Nasa/
```


---

## 5. Configuração NASA

Em `appsettings.json`:

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

**Boot:** carrega o JSON → se vazio, tenta GEODE.  
**Refresh:** `POST /api/nasa/refresh` busca GEODE, faz merge com métricas enriquecidas do cache e, em Development, regrava o JSON.

---

## 6. Perfis (mock — sem banco de users)

| Id | Label | Pesos (w1…w5) |
| --- | --- | --- |
| `Student` | Estudante | 0.20 uniforme |
| `Researcher` | Pesquisador | C1=0.35; demais ≈0.1625 |
| `ShipEngineer` | Engenheiro de nave | C2=0.25, C3=0.25, C1=0.20, C4=0.15, C5=0.15 |

Uso: query `?profile=ShipEngineer` (ou override `w1`…`w5`).  
Lista: `GET /api/profiles`.

---

## 7. Ambientes de missão

| Id | Alvo O2 | Pressão | Uso |
| --- | --- | --- | --- |
| `Iss` | 21% | 101.3 kPa | Estação |
| `Moon` | 30% | 70.3 kPa | Base lunar (Notion) |
| `Mars` | 30% | ~70 kPa | Base marciana (MVP) |

Lista: `GET /api/environments`.

---

## 8. Score (C1–C5)

```
S = w1·C1 + w2·C2 + w3·C3 + w4·C4 + w5·C5   → escala ~0–10 na API
```

JSON estável (camelCase) — tipar estes nomes no FE:

| Critério | Campo em `criteria` | Campos da investigação |
| --- | --- | --- |
| C1 | `c1Proximidade` | `o2Range`, `pressureKpa`, `flowSpeedCms` |
| C2 | `c2MargemMoc` | `mocPercent` |
| C3 | `c3Cinetica` | `flameSpreadRateMms` |
| C4 | `c4SeveridadeTermica` | `hrrKw` |
| C5 | `c5Toxicidade` | `coPpm` |

Pesos: `weights.w1`…`w5`. Score total: `score` (0–10).  
Categorias: `prevencao` / `deteccao` / `supressao` / `outro`.

**CSV do export:** colunas curtas `c1`…`c5` mapeiam para os mesmos critérios (`c1` ↔ `c1Proximidade`, …).

---

## 9. Contratos HTTP entregues

DTOs tipados em `Features/Contracts/` + schemas no Swagger (Dev). Erros de contrato: `{ error, missing? }`.

| Método | Rota | Função |
| --- | --- | --- |
| GET | `/api/health` | Status do serviço |
| GET | `/api/profiles` | Perfis mock + pesos |
| GET | `/api/environments` | Ambientes + alvos |
| GET | `/api/investigations` | Lista (summary) |
| GET | `/api/investigations/{id}` | Ficha completa + URL PSI / DOI |
| GET | `/api/investigations/compare` | Compara 2–3 fichas |
| GET | `/api/ranking` | Ranking + `criteria` C1–C5 |
| GET | `/api/gaps` | Grade O2×P + aviso gravidade parcial |
| GET | `/api/export` | Export JSON (criteria nomeados) ou CSV |
| POST | `/api/nasa/refresh` | Sync GEODE → memória (+ disk em Dev) |

### Query params (obrigatório / opcional / default)

| Rota | Params |
| --- | --- |
| `GET /api/investigations` | **Opcional:** `q`, `category`, `featured`, `o2Min`, `o2Max`, `pressureMin`, `pressureMax` |
| `GET /api/investigations/{id}` | **Path obrigatório:** `id` |
| `GET /api/investigations/compare` | **Obrigatório:** `ids` (2 ou 3 IDs separados por vírgula) |
| `GET /api/ranking` | **Opcional:** `profile` (default `Student`), `environment` (default `Moon`), `category`, `featured`, `w1`…`w5` |
| `GET /api/gaps` | **Opcional:** `environment` (default `Moon`); sempre filtra featured fire-safety |
| `GET /api/export` | **Opcional:** `format` (default `json`; `csv` → download), `profile` (default `Student`), `environment` (default `Moon`), `category`, `featured` (sem override `w*`) |

### Shapes JSON principais

- **Ranking / export JSON:** `profile`, `environment`, `weights`, `count`, `items[]` — item de ranking: `rank`, `score`, `criteria`, `investigation` (summary); item de export: `id`, `acronym`, `title`, `category`, `score`, `criteria`, `nasaPsiUrl`, `doi`
- **Lista / compare:** `{ count, items }` — lista usa summary; compare usa detail
- **Gaps:** `environment`, `targets` (`o2Percent`, `pressureKpa`, `flowCms`), `partialGravityWarning`, `nearTargetInvestigationIds`, `coverageCells[]`, `featuredCount`

---

## 10. Validação (smoke test)

Executado contra `http://localhost:5006`:

| Teste | Resultado |
| --- | --- |
| Health | `{ status: "ok", service: "BlueEmber.Api" }` |
| Profiles | 3 perfis com pesos corretos |
| Investigations `featured=true` | **19** fichas |
| Ranking Moon + ShipEngineer | Top: SAFFIRE-II (PSI-99), SAFFIRE-III, SAFFIRE-I |
| Compare | 2 itens OK |
| Gaps Moon | 19 featured + warning de gravidade parcial |
| Export CSV | HTTP 200 |
| `POST /api/nasa/refresh` | `refreshed: true`, **133** investigações, 19 featured |

Build: `dotnet build` — 0 erros, 0 avisos.

---

## 11. Fontes de dados usadas

| Arquivo / origem | Papel |
| --- | --- |
| `blue-ember-backend/data/normalized_investigations.json` | Cache principal no boot (~133 fichas) |
| `https://psi.nasa.gov/geode-py/ws/repo/search` | Fonte oficial GEODE (refresh/fallback) |
| `blue-ember-backend/scripts/normalize_nasa_data.py` | Origem histórica do enriquecimento |
| Notion Stellar Hub | Requisitos de score, perfis, telas e arquitetura |

---

## 12. Decisões explícitas

1. **Perfis mock** — sem tabela de usuários, login ou JWT (evita tempo desnecessário no hackathon).
2. **Sem Postgres nesta fatia** — JSON + GEODE; repositório interfaceado para migração futura.
3. **Sem worker Python / IA `/ask`** — próximo incremento.
4. **Merge no refresh** — GEODE atualiza metadados; métricas enriquecidas do cache local são preservadas quando o `id` já existe.

---

## 13. Como rodar

```bash
cd blue-ember-backend
dotnet run --launch-profile http
```

- API: http://localhost:5006  
- Swagger: http://localhost:5006/swagger  
- Exemplos: `BlueEmber.Api.http`

Frontend (já com proxy `/api` → `:5006`):

```bash
cd blue-ember-frontend
npm run dev
```

---

## 14. Próximos passos sugeridos (não feitos)

- Worker Python + S3 `nasa-psi` + embeddings / pgvector  
- Persistência Postgres atrás de `IInvestigationRepository`  
- Endpoint `/ask` (proxy)  
- Consumo das rotas no React (ranking, detalhe, comparador, gaps, export)  
- Ajuste fino de pesos/normalização com o time de métricas  

---

*Relatório gerado a partir da implementação do plano Backend Blue Ember no repositório `blue-ember`.*
