# Blue Ember

NASA Space Apps 2026 — Flame in Freefall.

## Estrutura

| Pasta | Stack |
| --- | --- |
| `blue-ember-frontend/` | React + TypeScript + Vite (organização por layers) |
| `blue-ember-backend/` | ASP.NET Core 8 Minimal API (Vertical Slice) |
| `MVP.md` | Escopo e dados do MVP |

### Backend — Vertical Slice

| Pasta | Papel |
| --- | --- |
| `Features/Health/` | Endpoint + DTO da feature |
| `Program.cs` | Composition root (DI, middleware, `Map*Endpoints`) |

Novas capacidades entram como `Features/<Nome>/` (ex.: `Investigations`, `Ranking`).

### Frontend (`src/`) — layers

| Pasta | Papel |
| --- | --- |
| `pages/` | Telas |
| `components/` | UI reutilizável |
| `hooks/` | Hooks React |
| `services/` | Chamadas HTTP / API |
| `types/` | Tipos compartilhados |
| `utils/` | Helpers |
| `assets/` | Imagens e mídia estática |
| `App.tsx` | Shell da aplicação |

## Pré-requisitos

- Node.js 20+
- .NET SDK 8 (`~/.dotnet` se instalado via script oficial)

```bash
export DOTNET_ROOT="$HOME/.dotnet"
export PATH="$HOME/.dotnet:$PATH"
```

## Rodar

### Backend

```bash
cd blue-ember-backend
dotnet run
```

- Swagger (dev): HTTPS da API + `/swagger`
- Health: `GET /api/health`

### Frontend

```bash
cd blue-ember-frontend
npm install
npm run dev
```

- App: http://localhost:3000  
- CORS liberado para essa origem no backend
