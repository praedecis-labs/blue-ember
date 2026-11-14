# Blue Ember

NASA Space Apps 2026 — Flame in Freefall.

## Estrutura

| Pasta | Stack |
| --- | --- |
| `blue-ember-frontend/` | React + TypeScript + Vite |
| `blue-ember-backend/` | ASP.NET Core 8 Minimal API |
| `MVP.md` | Escopo e dados do MVP |

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

- App: http://localhost:5173  
- CORS liberado para essa origem no backend
