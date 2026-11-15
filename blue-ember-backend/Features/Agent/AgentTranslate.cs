using System.Text;
using System.Text.Json.Nodes;
using BlueEmber.Api.Features.Contracts;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;

namespace BlueEmber.Api.Features.Agent;

public sealed record AgentTranslateRequest(string Text, string TargetLocale);

public sealed record AgentTranslateResponse(string Text, string Locale, string Provider);

/// <summary>
/// Traduz a resposta do agente para o idioma da tela, sem ferramentas e sem conteúdo novo.
/// Usa o provedor configurado em Agent:Provider; se ele não tiver chave, tenta o outro.
/// </summary>
public sealed class AgentTranslator(
    IHttpClientFactory httpClientFactory,
    IOptions<AgentOptions> agentOptions,
    IOptions<GeminiOptions> geminiOptions,
    IOptions<GroqOptions> groqOptions)
{
    private static string Prompt(string targetLocale) =>
        DashboardComposer.IsPortuguese(targetLocale)
            ? "Traduza o texto para português do Brasil. Mantenha exatamente o mesmo significado, números, siglas e nomes de investigações (ex.: SAFFIRE-II, PSI-99). Não acrescente nem remova informação. Responda só com a tradução, em texto puro."
            : "Translate the text into English. Keep exactly the same meaning, numbers, acronyms and investigation names (e.g. SAFFIRE-II, PSI-99). Do not add or remove information. Reply with the translation only, as plain text.";

    public async Task<AgentTranslateResponse> TranslateAsync(
        string text, string targetLocale, CancellationToken ct)
    {
        var preferGroq = string.Equals(agentOptions.Value.Provider, "groq", StringComparison.OrdinalIgnoreCase);
        var hasGroq = !string.IsNullOrWhiteSpace(groqOptions.Value.ApiKey);
        var hasGemini = !string.IsNullOrWhiteSpace(geminiOptions.Value.ApiKey);

        var order = preferGroq ? new[] { "groq", "gemini" } : new[] { "gemini", "groq" };
        Exception? last = null;
        foreach (var provider in order)
        {
            if (provider == "groq" && !hasGroq) continue;
            if (provider == "gemini" && !hasGemini) continue;
            try
            {
                var translated = provider == "groq"
                    ? await GroqAsync(text, targetLocale, ct)
                    : await GeminiAsync(text, targetLocale, ct);
                return new AgentTranslateResponse(
                    AgentCompletion.SanitizeProse(translated.Trim()), targetLocale, provider);
            }
            catch (Exception ex) when (ex is InvalidOperationException or HttpRequestException)
            {
                last = ex; // tenta o outro provedor
            }
        }

        if (last is not null) throw new InvalidOperationException(last.Message, last);
        throw new InvalidOperationException("No agent provider is configured for translation.");
    }

    private async Task<string> GeminiAsync(string text, string targetLocale, CancellationToken ct)
    {
        var opts = geminiOptions.Value;
        var model = string.IsNullOrWhiteSpace(opts.Model) ? "gemini-3.1-flash-lite" : opts.Model;
        var client = httpClientFactory.CreateClient("gemini");
        var payload = new JsonObject
        {
            ["system_instruction"] = new JsonObject
            {
                ["parts"] = new JsonArray { new JsonObject { ["text"] = Prompt(targetLocale) } },
            },
            ["contents"] = new JsonArray
            {
                new JsonObject
                {
                    ["role"] = "user",
                    ["parts"] = new JsonArray { new JsonObject { ["text"] = text } },
                },
            },
            ["generationConfig"] = new JsonObject { ["temperature"] = 0 },
        };
        using var req = new HttpRequestMessage(
            HttpMethod.Post,
            $"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent")
        {
            Content = new StringContent(payload.ToJsonString(), Encoding.UTF8, "application/json"),
        };
        // Chave no cabeçalho, não no endereço: não aparece em log.
        req.Headers.Add("x-goog-api-key", opts.ApiKey);
        using var res = await client.SendAsync(req, ct);
        var body = await res.Content.ReadAsStringAsync(ct);
        var root = JsonNode.Parse(body);
        if (!res.IsSuccessStatusCode || root?["error"] is not null)
            throw new InvalidOperationException(
                root?["error"]?["message"]?.GetValue<string>() ?? $"Gemini HTTP {(int)res.StatusCode}");
        var parts = root?["candidates"]?[0]?["content"]?["parts"] as JsonArray;
        var sb = new StringBuilder();
        foreach (var p in parts ?? new JsonArray())
            sb.Append(p?["text"]?.GetValue<string>());
        if (sb.Length == 0) throw new InvalidOperationException("Gemini returned an empty translation.");
        return sb.ToString();
    }

    private async Task<string> GroqAsync(string text, string targetLocale, CancellationToken ct)
    {
        var opts = groqOptions.Value;
        var model = string.IsNullOrWhiteSpace(opts.Model) ? "openai/gpt-oss-20b" : opts.Model;
        var client = httpClientFactory.CreateClient("groq");
        var payload = new JsonObject
        {
            ["model"] = model,
            ["temperature"] = 0,
            ["messages"] = new JsonArray
            {
                new JsonObject { ["role"] = "system", ["content"] = Prompt(targetLocale) },
                new JsonObject { ["role"] = "user", ["content"] = text },
            },
        };
        using var req = new HttpRequestMessage(HttpMethod.Post, $"{opts.BaseUrl.TrimEnd('/')}/chat/completions")
        {
            Content = new StringContent(payload.ToJsonString(), Encoding.UTF8, "application/json"),
        };
        using var res = await client.SendAsync(req, ct);
        var body = await res.Content.ReadAsStringAsync(ct);
        var root = JsonNode.Parse(body);
        if (!res.IsSuccessStatusCode || root?["error"] is not null)
            throw new InvalidOperationException(
                root?["error"]?["message"]?.GetValue<string>() ?? $"Groq HTTP {(int)res.StatusCode}");
        var content = root?["choices"]?[0]?["message"]?["content"]?.GetValue<string>();
        if (string.IsNullOrWhiteSpace(content)) throw new InvalidOperationException("Groq returned an empty translation.");
        return content;
    }
}

public static class AgentTranslateEndpoints
{
    public static IEndpointRouteBuilder MapAgentTranslateEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapPost("/api/agent/translate", async (
                [FromBody] AgentTranslateRequest? body,
                AgentTranslator translator,
                CancellationToken ct) =>
            {
                if (body is null || string.IsNullOrWhiteSpace(body.Text))
                    return Results.BadRequest(new ErrorResponse("text is required."));
                if (body.Text.Length > 4000)
                    return Results.BadRequest(new ErrorResponse("text is too long."));
                if (string.IsNullOrWhiteSpace(body.TargetLocale))
                    return Results.BadRequest(new ErrorResponse("targetLocale is required."));
                try
                {
                    return Results.Ok(await translator.TranslateAsync(body.Text, body.TargetLocale, ct));
                }
                catch (InvalidOperationException ex)
                {
                    return Results.Json(new ErrorResponse(ex.Message), statusCode: StatusCodes.Status502BadGateway);
                }
            })
            .WithName("AgentTranslate")
            .WithTags("Agent")
            .Produces<AgentTranslateResponse>(StatusCodes.Status200OK)
            .Produces<ErrorResponse>(StatusCodes.Status400BadRequest)
            .Produces<ErrorResponse>(StatusCodes.Status502BadGateway)
            .WithOpenApi(op =>
            {
                op.Summary = "Traduz a resposta do agente para o idioma da tela (sem tools, sem conteúdo novo).";
                return op;
            });
        return app;
    }
}
