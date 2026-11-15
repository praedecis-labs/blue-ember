using System.Text;
using System.Text.Json;
using System.Text.Json.Nodes;
using Microsoft.Extensions.Options;

namespace BlueEmber.Api.Features.Agent;

public sealed class GeminiAgentService(
    IHttpClientFactory httpClientFactory,
    IOptions<GeminiOptions> options,
    IServiceScopeFactory scopeFactory,
    ILogger<GeminiAgentService> logger)
{
    private static readonly JsonSerializerOptions JsonOpts = new()
    {
        PropertyNameCaseInsensitive = true,
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        DefaultIgnoreCondition = System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull,
    };

    private static string SystemPromptFor(string? locale)
    {
        var pt = DashboardComposer.IsPortuguese(locale);
        if (pt)
        {
            return """
                Você é o assistente Blue Ember de segurança contra fogo em habitats espaciais.
                Responda sempre em português do Brasil.

                Estilo da resposta (obrigatório):
                - No máximo 4 a 6 frases curtas.
                - Texto puro: sem markdown (#, **, listas com - ou *, tabelas, emojis).
                - Sem seções longas; vá direto ao ponto.

                Dados:
                - Use as ferramentas para ranking, lacunas e fichas NASA PSI.
                - Cite só o que as tools retornaram; não invente IDs, DOI, scores ou resultados.

                Dashboards:
                - Se o usuário pedir dashboard, painel, visualização, periculosidade ou previsibilidade/predição:
                  1) chame get_fire_safety_ranking e/ou get_coverage_gaps;
                  2) chame compose_dashboard.
                - Widgets permitidos: materialHazard, scenarioPredictability, insight.
                - Sempre inclua um insight com leitura + legendas (o que cada nível/pill significa).
                - Para previsibilidade Iss/Moon/Mars: high na ISS; medium/low em Lua/Marte (gravidade parcial).
                - Títulos e textos do dashboard em português do Brasil.
                - Na prosa do chat: só 1–2 frases introduzindo o painel; o detalhe fica no insight do dashboard.
                """;
        }

        return """
            You are the Blue Ember assistant for fire safety in space habitats.
            Always respond in English.

            Response style (required):
            - At most 4 to 6 short sentences.
            - Plain text only: no markdown (#, **, lists with - or *, tables, emojis).
            - No long sections; get straight to the point.

            Data:
            - Use the tools for ranking, gaps, and NASA PSI investigation records.
            - Cite only what the tools returned; do not invent IDs, DOIs, scores, or results.

            Dashboards:
            - If the user asks for a dashboard, panel, visualization, hazard, or predictability/prediction:
              1) call get_fire_safety_ranking and/or get_coverage_gaps;
              2) call compose_dashboard.
            - Allowed widgets: materialHazard, scenarioPredictability, insight.
            - Always include an insight with reading + legends (what each level/pill means).
            - For Iss/Moon/Mars predictability: high on ISS; medium/low on Moon/Mars (partial gravity).
            - Dashboard titles and copy in English.
            - In chat prose: only 1–2 sentences introducing the panel; detail stays in the dashboard insight.
            """;
    }

    public bool IsConfigured =>
        !string.IsNullOrWhiteSpace(options.Value.ApiKey);

    public async Task<AgentAskResponse> AskAsync(AgentAskRequest request, CancellationToken ct)
    {
        var opts = options.Value;
        if (string.IsNullOrWhiteSpace(opts.ApiKey))
            throw new InvalidOperationException("Gemini API key is not configured.");

        using var scope = scopeFactory.CreateScope();
        var tools = scope.ServiceProvider.GetRequiredService<AgentTools>();

        var contents = BuildContents(request);
        var client = httpClientFactory.CreateClient("gemini");
        var model = string.IsNullOrWhiteSpace(opts.Model) ? "gemini-3.1-flash-lite" : opts.Model;
        var url =
            $"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={opts.ApiKey}";

        var toolDeclarations = JsonSerializer.SerializeToNode(AgentTools.Declarations(), JsonOpts)!;
        var maxRounds = Math.Clamp(opts.MaxToolRounds, 1, 8);
        string? finalText = null;

        for (var round = 0; round < maxRounds; round++)
        {
            var payload = new JsonObject
            {
                ["system_instruction"] = new JsonObject
                {
                    ["parts"] = new JsonArray
                    {
                        new JsonObject { ["text"] = SystemPromptFor(request.Locale) },
                    },
                },
                ["contents"] = contents.DeepClone(),
                ["tools"] = new JsonArray
                {
                    new JsonObject
                    {
                        ["function_declarations"] = toolDeclarations.DeepClone(),
                    },
                },
            };

            using var httpRequest = new HttpRequestMessage(HttpMethod.Post, url)
            {
                Content = new StringContent(payload.ToJsonString(), Encoding.UTF8, "application/json"),
            };

            using var httpResponse = await client.SendAsync(httpRequest, ct);
            var body = await httpResponse.Content.ReadAsStringAsync(ct);
            JsonNode? root;
            try
            {
                root = JsonNode.Parse(body);
            }
            catch (JsonException ex)
            {
                logger.LogError(ex, "Failed to parse Gemini response");
                throw new InvalidOperationException("Invalid response from Gemini.");
            }

            var apiError = root?["error"];
            if (apiError is not null)
            {
                var msg = apiError["message"]?.GetValue<string>()
                          ?? apiError["status"]?.GetValue<string>()
                          ?? "Gemini API error";
                throw new InvalidOperationException(msg);
            }

            if (!httpResponse.IsSuccessStatusCode)
                throw new InvalidOperationException(
                    $"Gemini HTTP {(int)httpResponse.StatusCode}: {Trim(body, 400)}");

            var modelContent = root?["candidates"]?[0]?["content"] as JsonObject;
            var parts = modelContent?["parts"] as JsonArray;
            if (modelContent is null || parts is null || parts.Count == 0)
                throw new InvalidOperationException("Gemini returned an empty candidate.");

            // Echo model content verbatim (preserves thoughtSignature for Gemini 3 tools).
            var echoed = modelContent.DeepClone()!.AsObject();
            echoed["role"] = "model";
            contents.Add(echoed);

            var functionCalls = new List<(string Name, Dictionary<string, object?>? Args)>();
            foreach (var partNode in parts)
            {
                var call = partNode?["functionCall"] as JsonObject
                           ?? partNode?["function_call"] as JsonObject;
                if (call is null) continue;
                var name = call["name"]?.GetValue<string>();
                if (string.IsNullOrWhiteSpace(name)) continue;
                functionCalls.Add((name, ParseArgs(call["args"])));
            }

            if (functionCalls.Count == 0)
            {
                var texts = new List<string>();
                foreach (var partNode in parts)
                {
                    var text = partNode?["text"]?.GetValue<string>();
                    if (!string.IsNullOrWhiteSpace(text))
                        texts.Add(text.Trim());
                }

                finalText = string.Join("\n", texts);
                break;
            }

            var responseParts = new JsonArray();
            foreach (var (name, args) in functionCalls)
            {
                var result = tools.Execute(name, args);
                responseParts.Add(new JsonObject
                {
                    ["functionResponse"] = new JsonObject
                    {
                        ["name"] = name,
                        ["response"] = JsonSerializer.SerializeToNode(
                            new Dictionary<string, object?> { ["result"] = result },
                            JsonOpts),
                    },
                });
            }

            contents.Add(new JsonObject
            {
                ["role"] = "user",
                ["parts"] = responseParts,
            });
        }

        if (string.IsNullOrWhiteSpace(finalText))
        {
            finalText =
                DashboardComposer.IsPortuguese(request.Locale)
                    ? "Consultei as ferramentas disponíveis, mas não consegui fechar uma resposta em prosa. " +
                      "Tente reformular a hipótese com ambiente e material."
                    : "I used the available tools but could not finish a prose answer. " +
                      "Try rephrasing the hypothesis with environment and material.";
        }

        var dashboard = tools.LastDashboard;
        if (dashboard is null && DashboardComposer.LooksLikeDashboardRequest(request.Message))
        {
            // Ensure we have data for the default dashboard when the model skipped compose_dashboard.
            if (tools.LastRanking is null)
            {
                tools.Execute("get_fire_safety_ranking", new Dictionary<string, object?>
                {
                    ["profile"] = request.Profile ?? "Student",
                    ["environment"] = request.Environment ?? request.Query?.Env ?? "Moon",
                    ["category"] = request.Category,
                });
            }

            if (tools.LastGaps is null)
            {
                tools.Execute("get_coverage_gaps", new Dictionary<string, object?>
                {
                    ["environment"] = request.Environment ?? request.Query?.Env ?? "Moon",
                });
            }

            dashboard = DashboardComposer.DefaultInterpretive(
                tools.LastRanking?.Environment ?? request.Environment,
                request.Locale);
        }

        return new AgentAskResponse(
            SanitizeProse(finalText),
            tools.LastRanking,
            tools.LastGaps,
            tools.ToolsUsed.Distinct().ToList(),
            dashboard);
    }

    /// <summary>Strip common markdown so the chat bubble stays plain and short.</summary>
    internal static string SanitizeProse(string text)
    {
        if (string.IsNullOrWhiteSpace(text)) return text;
        var lines = text.Replace("\r\n", "\n").Split('\n');
        var cleaned = new List<string>();
        foreach (var raw in lines)
        {
            var line = raw.Trim();
            if (line.Length == 0) continue;
            while (line.StartsWith('#'))
                line = line.TrimStart('#').TrimStart();
            if (line.StartsWith("- ") || line.StartsWith("* "))
                line = line[2..].TrimStart();
            line = line.Replace("**", "").Replace("__", "").Replace("`", "");
            if (line.Length > 0)
                cleaned.Add(line);
        }

        // Keep at most ~6 sentences worth of lines.
        if (cleaned.Count > 6)
            cleaned = cleaned.Take(6).ToList();

        return string.Join(" ", cleaned).Trim();
    }

    private static JsonArray BuildContents(AgentAskRequest request)
    {
        var contents = new JsonArray();

        if (request.History is { Count: > 0 })
        {
            foreach (var turn in request.History.TakeLast(8))
            {
                var role = turn.Role.Equals("model", StringComparison.OrdinalIgnoreCase)
                    || turn.Role.Equals("assistant", StringComparison.OrdinalIgnoreCase)
                    ? "model"
                    : "user";
                contents.Add(new JsonObject
                {
                    ["role"] = role,
                    ["parts"] = new JsonArray
                    {
                        new JsonObject { ["text"] = turn.Text },
                    },
                });
            }
        }

        var context = new StringBuilder();
        context.AppendLine("Contexto estruturado da UI (já parseado):");
        context.AppendLine($"- profile: {request.Profile ?? "Student"}");
        context.AppendLine($"- environment: {request.Environment ?? request.Query?.Env ?? "Moon"}");
        if (!string.IsNullOrWhiteSpace(request.Category))
            context.AppendLine($"- category: {request.Category}");
        if (request.Query is { } q)
        {
            context.AppendLine(
                $"- query: env={q.Env}, material={q.Material}, o2={q.O2}, psi={q.Psi}, flow={q.Flow}, goal={q.Goal}, claim={q.Claim}");
        }

        context.AppendLine();
        context.AppendLine("Mensagem do usuário:");
        context.Append(request.Message.Trim());

        contents.Add(new JsonObject
        {
            ["role"] = "user",
            ["parts"] = new JsonArray
            {
                new JsonObject { ["text"] = context.ToString() },
            },
        });

        return contents;
    }

    private static Dictionary<string, object?>? ParseArgs(JsonNode? argsNode)
    {
        if (argsNode is null) return null;
        try
        {
            return argsNode.Deserialize<Dictionary<string, object?>>(JsonOpts);
        }
        catch
        {
            return new Dictionary<string, object?> { ["raw"] = argsNode.ToJsonString() };
        }
    }

    private static string Trim(string s, int max) =>
        s.Length <= max ? s : s[..max] + "…";
}
