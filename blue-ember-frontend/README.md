# Blue Ember — Frontend

Chat React (Vite + TypeScript) que consome a API .NET do Blue Ember.

## Pré-requisitos

- Node.js 20+
- Backend rodando em `http://localhost:5006` (ver monorepo)

## Subir FE + BE juntos

### 1. Backend (`:5006`)

```bash
cd ../blue-ember-backend
dotnet run --launch-profile http
```

- API: http://localhost:5006  
- Swagger (dev): http://localhost:5006/swagger  
- Health: `GET /api/health`

### 2. Frontend (`:3000`)

```bash
npm install
npm run dev
```

- App: http://localhost:3000  
- Proxy Vite: `/api` → `http://localhost:5006` (ver `vite.config.ts`)

## Scripts

| Comando | Uso |
| --- | --- |
| `npm run dev` | Dev server na porta 3000 |
| `npm test` | Vitest |
| `npm run build` | Typecheck + build |
| `npm run lint` | Oxlint |

## Smoke checklist (demo)

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

Lista completa: [`docs/TODO-FRONTEND.md`](docs/TODO-FRONTEND.md).
