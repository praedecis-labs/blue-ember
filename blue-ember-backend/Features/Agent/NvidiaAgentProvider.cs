using System.Text;
using System.Text.Json;
using System.Text.Json.Nodes;
using Microsoft.Extensions.Options;

namespace BlueEmber.Api.Features.Agent;

/// <summary>
/// Provider NVIDIA NIM (API compatível com OpenAI chat.completions).
/// Endpoint: https://integrate.api.nvidia.com/v1
/// Modelo default: nvidia/nemotron-3.5-super-vl-120b-a12b.
/// </summary>
public sealed class NvidiaAgentProvider(
    IHttpClientFactory httpClientFactory,
    IOptions<NvidiaOptions> options,
    IServiceScopeFactory scopeFactory,
    ILogger<NvidiaAgentProvider> logger) : IAgentProvider
{
    public string ProviderKey => "nvidia";

    public string DisplayName => "NVIDIA";

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
            throw new InvalidOperationException("NVIDIA API key is not configured.");

        using var scope = scopeFactory.CreateScope();
        var tools = scope.ServiceProvider.GetRequiredService<AgentTools>();

        var messages = BuildMessages(request);
        var client = httpClientFactory.CreateClient("nvidia");
        var model = string.IsNullOrWhiteSpace(opts.Model) ? "nvidia/nemotron-3.5-super-vl-120b-a12b" : opts.Model;
        var url = $"{opts.BaseUrl.TrimEnd('/')}/chat/completions";

        var toolSpecs = JsonSerializer.SerializeToNode(
            AgentTools.Declarations().Select(d => new
            {
                type = "function",
                function = new
                {
                    name = d.Name,
                    description = d.Description,
                    parameters = d.Parameters,
                },
            }).ToList(),
            JsonOpts)!;

        var maxRounds = Math.Clamp(opts.MaxToolRounds, 1, 8);
        string? finalText = null;

        for (var round = 0; round < maxRounds; round++)
        {
            var payload = new JsonObject
            {
                ["model"] = model,
                ["messages"] = messages.DeepClone(),
                ["tools"] = toolSpecs.DeepClone(),
                ["tool_choice"] = "auto",
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
                logger.LogError(ex, "Failed to parse NVIDIA response");
                throw new InvalidOperationException("Invalid response from NVIDIA.");
            }

            var apiError = root?["error"];
            if (apiError is not null)
            {
                var msg = apiError["message"]?.GetValue<string>()
                          ?? "NVIDIA API error";
                throw new InvalidOperationException(msg);
            }

            if (!httpResponse.IsSuccessStatusCode)
                throw new InvalidOperationException(
                    $"NVIDIA HTTP {(int)httpResponse.StatusCode}: {Trim(body, 400)}");

            var message = root?["choices"]?[0]?["message"] as JsonObject;
            if (message is null)
                throw new InvalidOperationException("NVIDIA returned an empty choice.");

            var toolCalls = message["tool_calls"] as JsonArray;
            if (toolCalls is null || toolCalls.Count == 0)
            {
                finalText = message["content"]?.GetValue<string>();
                break;
            }

            // Echo the assistant message verbatim (required for tool-call continuation).
            messages.Add(message.DeepClone());

            foreach (var callNode in toolCalls)
            {
                var call = callNode as JsonObject;
                var callId = call?["id"]?.GetValue<string>() ?? "";
                var fn = call?["function"] as JsonObject;
                var name = fn?["name"]?.GetValue<string>();
                if (string.IsNullOrWhiteSpace(name)) continue;

                var argsJson = fn?["arguments"]?.GetValue<string>();
                Dictionary<string, object?>? args = null;
                if (!string.IsNullOrWhiteSpace(argsJson))
                {
                    try
                    {
                        args = JsonSerializer.Deserialize<Dictionary<string, object?>>(argsJson, JsonOpts);
                    }
                    catch (JsonException)
                    {
                        args = new Dictionary<string, object?> { ["raw"] = argsJson };
                    }
                }

                var result = await tools.ExecuteAsync(name, args);
                var resultJson = JsonSerializer.Serialize(
                    new Dictionary<string, object?> { ["result"] = result }, JsonOpts);

                messages.Add(new JsonObject
                {
                    ["role"] = "tool",
                    ["tool_call_id"] = callId,
                    ["content"] = resultJson,
                });
            }
        }

        return await AgentCompletion.FinalizeAsync(request, tools, finalText, ct);
    }

    private static JsonArray BuildMessages(AgentAskRequest request)
    {
        var messages = new JsonArray
        {
            new JsonObject
            {
                ["role"] = "system",
                ["content"] = AgentCompletion.SystemPromptFor(request.Locale),
            },
        };

        if (request.History is { Count: > 0 })
        {
            foreach (var turn in request.History.TakeLast(8))
            {
                var role = turn.Role.Equals("model", StringComparison.OrdinalIgnoreCase)
                    || turn.Role.Equals("assistant", StringComparison.OrdinalIgnoreCase)
                    ? "assistant"
                    : "user";
                messages.Add(new JsonObject
                {
                    ["role"] = role,
                    ["content"] = turn.Text,
                });
            }
        }

        messages.Add(new JsonObject
        {
            ["role"] = "user",
            ["content"] = AgentCompletion.BuildUserContext(request),
        });

        return messages;
    }

    private static string Trim(string s, int max) =>
        s.Length <= max ? s : s[..max] + "…";
}
