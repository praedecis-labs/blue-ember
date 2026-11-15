# Gemini agent (tools)

`POST /api/agent/ask` uses Gemini with function calling over ranking, gaps, and investigations (in-process).

## API key setup (do not commit)

The key must **not** go in `appsettings.json`. Use one of:

```bash
# User secrets (local dev)
dotnet user-secrets set "Gemini:ApiKey" "YOUR_KEY" --project BlueEmber.Api.csproj

# Or environment variable
set GEMINI__ApiKey=YOUR_KEY
```

Optional:

```bash
dotnet user-secrets set "Gemini:Model" "gemini-3.1-flash-lite" --project BlueEmber.Api.csproj
```

Without a key, the endpoint returns **503** and the React chat falls back to ranking/templates.

## Security

If the key appeared in chat, a ticket, or a log: **revoke/rotate it in Google AI Studio** and configure the new one via user-secrets/env.

## Contract

Request: `{ message, profile?, environment?, category?, locale?, query?, history? }`  

- `locale`: `"en-US"` (default) or `"pt-BR"`. User-visible agent prose and fallback dashboard copy follow this locale. HTTP error strings stay in English.

Response: `{ text, ranking?, gaps?, toolsUsed[], dashboard? }`

Tools: `get_fire_safety_ranking`, `get_coverage_gaps`, `get_investigation`, `search_investigations`, `compose_dashboard`.

`dashboard` is interpretive only (`materialHazard`, `scenarioPredictability`, `insight` + legends). Agent prose is short plain text (no markdown).
