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
    ├── Health/                         # já existia
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

| Critério | Significado | Campos |
| --- | --- | --- |
| C1 | Proximidade operacional vs ambiente | `o2_range`, `pressure_kpa`, `flow_speed_cms` |
| C2 | Margem MOC (`O2_amb − moc`) | `moc_percent` |
| C3 | Cinética de propagação | `flame_spread_rate_mms` |
| C4 | Severidade térmica | `hrr_kw` |
| C5 | Toxicidade (CO) | `co_ppm` |

Categorias: `prevencao` / `deteccao` / `supressao` / `outro` (via acronym/sub_discipline).

---

## 9. Contratos HTTP entregues

| Método | Rota | Função |
| --- | --- | --- |
| GET | `/api/health` | Status do serviço |
| GET | `/api/profiles` | Perfis mock + pesos |
| GET | `/api/environments` | Ambientes + alvos |
| GET | `/api/investigations` | Lista com filtros (`q`, `category`, `featured`, O2, pressão) |
| GET | `/api/investigations/{id}` | Ficha completa + URL PSI / DOI |
| GET | `/api/investigations/compare?ids=` | Compara 2–3 fichas |
| GET | `/api/ranking?profile=&environment=` | Ranking + breakdown C1–C5 |
| GET | `/api/gaps?environment=` | Grade O2×P + aviso gravidade parcial |
| GET | `/api/export?format=json\|csv` | Export do ranking |
| POST | `/api/nasa/refresh` | Sync GEODE → memória (+ disk em Dev) |

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
