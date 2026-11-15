# NVIDIA agent (tools)

`POST /api/agent/ask` uses NVIDIA NIM (OpenAI-compatible chat completions at `https://integrate.api.nvidia.com/v1`) with tool calling over ranking, gaps, and investigations (in-process). Default model: `nvidia/nemotron-3.5-super-vl-120b-a12b`.

## Fallback chain

`Agent:Provider` is the primary provider; `Agent:Fallbacks` lists provider keys tried in order when the primary fails (HTTP error, timeout, invalid response). Providers without an API key are skipped.

```json
"Agent": { "Provider": "nvidia", "Fallbacks": [ "gemini" ] }
```

The `gemini` fallback uses the Google Gemini API (`generativelanguage.googleapis.com`) with a Gemma model — default `gemma-4-31b-it` — configured under `Gemini:*` (see `Gemini:ApiKey` below).

## API key setup (do not commit)

The key must **not** go in `appsettings.json`. Use one of:

```bash
# User secrets (local dev)
dotnet user-secrets set "Nvidia:ApiKey" "YOUR_KEY" --project BlueEmber.Api.csproj

# Or environment variable
set NVIDIA__ApiKey=YOUR_KEY
```

Optional:

```bash
dotnet user-secrets set "Nvidia:Model" "nvidia/nemotron-3.5-super-vl-120b-a12b" --project BlueEmber.Api.csproj
```

Gemini fallback key (Google AI Studio):

```bash
dotnet user-secrets set "Gemini:ApiKey" "YOUR_KEY" --project BlueEmber.Api.csproj
# optional
dotnet user-secrets set "Gemini:Model" "gemma-4-31b-it" --project BlueEmber.Api.csproj
```

Without a key, the endpoint returns **503** and the React chat falls back to ranking/templates.

## Security

If the key appeared in chat, a ticket, or a log: **revoke/rotate it on build.nvidia.com** and configure the new one via user-secrets/env.

## Contract

Request: `{ message, profile?, environment?, category?, locale?, query?, history? }`  

- `locale`: `"en-US"` (default) or `"pt-BR"`. User-visible agent prose and fallback dashboard copy follow this locale. HTTP error strings stay in English.

Response: `{ text, ranking?, gaps?, toolsUsed[], dashboard? }`

Tools: `get_fire_safety_ranking`, `get_coverage_gaps`, `get_investigation`, `search_investigations`, `compose_dashboard`.

`dashboard` is interpretive only (`materialHazard`, `scenarioPredictability`, `insight` + legends). Agent prose is short plain text (no markdown).
