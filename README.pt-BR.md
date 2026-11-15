# Blue Ember

**NASA Space Apps 2026 — Flame in Freefall · Equipe Stellar Hub**

Idioma: **[English](README.md)** | **[Português](README.pt-BR.md)**

O Blue Ember ranqueia investigações de combustão e segurança contra incêndio do NASA Physical Sciences Informatics (**PSI / GEODE**) contra ambientes de missão (ISS, Lua, Marte) e perfis de usuário (Engenheiro de bordo, Pesquisador, Estudante). A UI do produto é um chat que transforma uma hipótese em linguagem natural em evidências ranqueadas, lacunas e exportação.

---

## Fluxo de ponta a ponta

```
Usuário (browser :3000)
        │
        │  Proxy Vite /api → :5006
        ▼
Chat React (perfil → home → thread + painéis)
        │
        ├── GET  /api/health, /profiles, /environments
        ├── GET  /api/ranking/fire-safety
        ├── GET  /api/gaps
        ├── GET  /api/export?format=csv|json
        └── POST /api/agent/ask  (prosa NVIDIA opcional)
        ▼
ASP.NET Core 8 Minimal API
        │
        ├── Domain: ScoreCalculator C1–C5 + perfis/ambientes mock
        ├── Infrastructure: cache JSON + NasaPsiClient (GEODE)
        └── Features: Health, Investigations, Ranking, Gaps, Export, Nasa, Agent
        ▼
NASA PSI GEODE  ←── POST /api/nasa/refresh opcional (merge preserva métricas enriquecidas)
```

1. **Boot:** a API carrega `data/normalized_investigations.json` na memória. Se vazio, faz fallback no GEODE.
2. **Perfil:** o usuário escolhe um perfil mock; os pesos vêm de `GET /api/profiles`.
3. **Hipótese:** o chat interpreta ambiente/objetivo (e pode chamar o agent NVIDIA). Ranking e gaps vêm sempre da API.
4. **Painéis:** investigações (C1–C5), força da evidência, gaps (aviso de gravidade parcial na Lua), fontes (PSI / DOI).
5. **Export:** CSV ou JSON para o perfil + ambiente atuais.
6. **Frescor:** `GET /api/health` expõe a idade do cache (`dataAgeSeconds`, `lastLoadedAt`, `dataSource`, `cacheStale`). Auto-refresh opcional se `Data:CacheTtlMinutes` > 0.

**Idioma da UI:** padrão **en-US**. Alternar **EN | PT** no header do chat (persistido no `localStorage`).

---

## Organização do monorepo

| Caminho | Papel |
| --- | --- |
| `blue-ember-frontend/` | App canônico — React + TypeScript + Vite |
| `blue-ember-backend/` | API ASP.NET Core 8 (Vertical Slice) |
| `blue-ember-backend/data/` | Cache JSON normalizado do NASA PSI |
| `blue-ember-backend/scripts/` | Utilitários de ingestão / conexão |
| `blue-ember-backend/docs/` | Relatórios, agent e TODOs da próxima fatia |
| `blue-ember-frontend/docs/` | TODOs dos tracks do frontend (T1–T7) |
| `docs/` | Docs compartilhados / protótipos visuais |
| `blue-ember-chat.html` | Protótipo HTML de arquivo (não é a UI do produto) |

---

## Organização do backend

Vertical Slice: cada feature dona seus endpoints; regras compartilhadas no Domain; I/O na Infrastructure.

| Camada | Caminho | Responsabilidade |
| --- | --- | --- |
| Composição | `Program.cs` | DI, CORS, Swagger, `Map*Endpoints`, bootstrap |
| Features | `Features/<Name>/` | Health, Investigations, Ranking, Gaps, Export, Nasa, Agent |
| Contratos | `Features/Contracts/` | DTOs compartilhados com Swagger / FE |
| Domain | `Domain/` | Investigações, categorias, perfis, ambientes, `ScoreCalculator` |
| Infrastructure | `Infrastructure/Data/` | `JsonInvestigationStore`, idade do cache / opções de TTL |
| Infrastructure | `Infrastructure/NasaPsi/` | Cliente GEODE, normalizer, `NasaRefreshService`, worker de TTL |
| Testes | `BlueEmber.Api.Tests/` | Fixtures fixas de score (C1–C5) |

**Score (0–10):** `S = w1·C1 + … + w5·C5` — proximidade, margem de MOC, cinética, severidade térmica, toxicidade. Pesos por perfil; overrides opcionais `w1`…`w5` no ranking.

**Filtro featured:** omitir `featured` = só fire-safety (~19). `featured=false` = catálogo completo. Atalho: `GET /api/ranking/fire-safety`.

**Rotas principais**

| Método | Rota | Notas |
| --- | --- | --- |
| GET | `/api/health` | Status + idade do cache |
| GET | `/api/profiles` | Perfis mock + pesos |
| GET | `/api/environments` | Alvos ISS / Lua / Marte |
| GET | `/api/investigations` | Lista summary (featured por default) |
| GET | `/api/investigations/{id}` | Ficha completa + PSI / DOI |
| GET | `/api/investigations/compare` | 2–3 IDs |
| GET | `/api/ranking` | Ranking ponderado |
| GET | `/api/ranking/fire-safety` | Sempre featured |
| GET | `/api/gaps` | Cobertura O₂×pressão + avisos |
| GET | `/api/export` | `format=json\|csv` |
| POST | `/api/nasa/refresh` | Puxa GEODE + merge |
| POST | `/api/agent/ask` | NVIDIA opcional (ver `docs/AGENT-NVIDIA.md`) |

Porta: **http://localhost:5006** · Swagger (dev): `/swagger`

---

## Organização do frontend

| Caminho | Papel |
| --- | --- |
| `src/App.tsx` | Shell — `I18nProvider` + `ChatApp` |
| `src/chat/` | Telas, painéis, hooks de sessão, adapters, parser |
| `src/services/` | Client HTTP tipado (`contracts`, `http`, ranking, gaps, export, agent, …) |
| `src/i18n/` | Catálogos `en-US` / `pt-BR` |
| `src/components/ui/` | Primitivos no estilo shadcn |
| `src/hooks/` | Hooks React compartilhados |
| `vite.config.ts` | Porta 3000 + proxy `/api` → `:5006` |

**Fluxo do chat:** Perfil → Home de análises (histórico + chips) → Thread com painéis expansíveis.

**Mapa de IDs (UI ↔ API)**

| UI | API |
| --- | --- |
| `eng` / `pesq` / `est` | `ShipEngineer` / `Researcher` / `Student` |
| `lua` / `marte` / `iss` | `Moon` / `Mars` / `Iss` |

Persistimos os IDs canônicos da API no `localStorage`. O mapeamento fica em `src/chat/adapters.ts`.

**Tracks (status):** T1–T6 feitos (client tipado → chat na API → export/polish). **T7** opcional: tela de ranking principal, detalhe dedicado, comparador, mapa 2D de gaps, spinoffs — ver `blue-ember-frontend/docs/TODO-FRONTEND.md`.

---

## Pré-requisitos

- Node.js 20+
- .NET SDK 8
- (Opcional) chave NVIDIA para prosa do agent — seção `Nvidia` no `appsettings` / user secrets do backend; ver `blue-ember-backend/docs/AGENT-NVIDIA.md`

---

## Como rodar

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

Abra http://localhost:3000 — o CORS libera essa origem; o proxy do Vite encaminha `/api` para a API.

### Scripts úteis

| Onde | Comando | Uso |
| --- | --- | --- |
| Frontend | `npm run dev` | Servidor de desenvolvimento |
| Frontend | `npm run build` | Typecheck + build de produção |
| Frontend | `npm test` | Vitest |
| Backend | `dotnet build BlueEmber.sln` | Compilar |
| Backend | `dotnet test BlueEmber.sln` | Testes de score |

### TTL do cache (opcional)

Em `blue-ember-backend/appsettings.json`:

```json
"Data": {
  "CacheTtlMinutes": 0,
  "CacheRefreshCheckMinutes": 15
}
```

Defina `CacheTtlMinutes` > 0 para ligar o refresh automático do GEODE quando os dados estiverem velhos.

---

## Checklist smoke da demo

| # | Ação | Esperado |
| --- | --- | --- |
| 1 | BE `:5006` + FE `:3000` | Health ok no header |
| 2 | Idioma EN / PT | Textos da UI trocam; sobrevivem ao reload |
| 3 | Escolher Engenheiro | Pesos iguais aos da API |
| 4 | Chip ex. “Tecido seguro na Lua?” | Bolha com tops PSI reais |
| 5 | Painel Investigações | C1–C5 da API |
| 6 | Gaps (Lua) | Aviso de gravidade parcial |
| 7 | Trocar ambiente para ISS | Ranking / gaps mudam |
| 8 | Export CSV | Download HTTP 200 |
| 9 | API off | Erro claro, sem tela branca |

---

## Documentação

| Doc | Conteúdo |
| --- | --- |
| [`blue-ember-backend/docs/RELATORIO-BACKEND-MVP.md`](blue-ember-backend/docs/RELATORIO-BACKEND-MVP.md) | Relatório do MVP backend + contratos HTTP |
| [`blue-ember-backend/docs/TODO-PROXIMA-FATIA.md`](blue-ember-backend/docs/TODO-PROXIMA-FATIA.md) | Próxima fatia do backend |
| [`blue-ember-backend/docs/AGENT-NVIDIA.md`](blue-ember-backend/docs/AGENT-NVIDIA.md) | Setup do agent |
| [`blue-ember-frontend/docs/TODO-FRONTEND.md`](blue-ember-frontend/docs/TODO-FRONTEND.md) | Tracks T1–T7 do frontend |
| [`blue-ember-frontend/README.md`](blue-ember-frontend/README.md) | Notas de execução só do frontend |

---

*Atualizado em 15/11/2026 — reflete integração API + chat (T1–T6), idade/TTL do cache e agent NVIDIA opcional.*
