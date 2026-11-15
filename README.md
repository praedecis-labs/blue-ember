# Blue Ember

NASA Space Apps 2026 — Flame in Freefall.

## Estrutura (monorepo)

| Pasta | Papel |
| --- | --- |
| `blue-ember-frontend/` | React + TypeScript + Vite (app canônico) |
| `blue-ember-backend/` | ASP.NET Core 8 Minimal API (Vertical Slice) |
| `blue-ember-backend/data/` | Cache NASA PSI (JSON) |
| `blue-ember-backend/scripts/` | Utilitários de ingestão/teste (Python/Node) |
| `blue-ember-backend/docs/` | Relatórios e documentação do backend |

### Backend — Vertical Slice

| Pasta | Papel |
| --- | --- |
| `Features/<Nome>/` | Endpoints da feature (Health, Investigations, Ranking, Gaps, Export, Nasa) |
| `Domain/` | Score, perfis mock, ambientes, categorias |
| `Infrastructure/` | Cliente GEODE + store JSON |
| `Program.cs` | Composition root (DI, middleware, `Map*Endpoints`) |

### Frontend (`blue-ember-frontend/src/`) — layers

| Pasta | Papel |
| --- | --- |
| `chat/` | App de chat (perfil, home, thread, painéis) |
| `components/` | UI reutilizável (shadcn) |
| `hooks/` | Hooks React |
| `services/` | Client HTTP tipado da API |
| `assets/` | Imagens e mídia estática |
| `App.tsx` | Shell — monta `ChatApp` |

## Pré-requisitos

- Node.js 20+
- .NET SDK 8

## Rodar

### Backend

```bash
cd blue-ember-backend
dotnet run --launch-profile http
```

- API: http://localhost:5006  
- Swagger (dev): http://localhost:5006/swagger  
- Health: `GET /api/health`  
- Investigations: `GET /api/investigations`, `GET /api/investigations/{id}`, `GET /api/investigations/compare?ids=`  
- Ranking: `GET /api/ranking?profile=ShipEngineer&environment=Moon`  
- Profiles / Environments / Gaps / Export: `/api/profiles`, `/api/environments`, `/api/gaps`, `/api/export`  
- NASA refresh: `POST /api/nasa/refresh`

### Frontend

```bash
cd blue-ember-frontend
npm install
npm run dev
```

- App: http://localhost:3000  
- CORS liberado para essa origem no backend  
- Proxy Vite: `/api` → `http://localhost:5006`
