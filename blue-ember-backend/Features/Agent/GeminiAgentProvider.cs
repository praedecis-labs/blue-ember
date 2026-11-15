using System.Text;
using System.Text.Json;
using System.Text.Json.Nodes;
using Microsoft.Extensions.Options;

namespace BlueEmber.Api.Features.Agent;

/// <summary>
/// Provider Google Gemini API (generateContent), usado como fallback.
/// Modelo default: gemma-4-31b-it.
/// </summary>
public sealed class GeminiAgentProvider(
    IHttpClientFactory httpClientFactory,
    IOptions<GeminiOptions> options,
    IServiceScopeFactory scopeFactory,
    ILogger<GeminiAgentProvider> logger) : IAgentProvider
{
    public string ProviderKey => "gemini";

    public string DisplayName => "Gemini";

    private static readonly JsonSerializerOptions JsonOpts = new()
    {
        PropertyNameCaseInsensitive = true,
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        DefaultIgnoreCondition = System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull,
    };

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
        var model = string.IsNullOrWhiteSpace(opts.Model) ? "gemma-4-31b-it" : opts.Model;
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
                        new JsonObject { ["text"] = AgentCompletion.SystemPromptFor(request.Locale) },
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

            // Echo model content verbatim (preserves thoughtSignature for tool calling).
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
                    // Gemma 4 emite partes de raciocínio com "thought": true — ignorar.
                    if (partNode?["thought"]?.GetValue<bool>() == true) continue;
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
                var result = await tools.ExecuteAsync(name, args);
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

        return await AgentCompletion.FinalizeAsync(request, tools, finalText, ct);
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

        contents.Add(new JsonObject
        {
            ["role"] = "user",
            ["parts"] = new JsonArray
            {
                new JsonObject { ["text"] = AgentCompletion.BuildUserContext(request) },
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
