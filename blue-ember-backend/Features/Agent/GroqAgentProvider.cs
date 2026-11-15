using System.Text;
using System.Text.Json;
using System.Text.Json.Nodes;
using Microsoft.Extensions.Options;

namespace BlueEmber.Api.Features.Agent;

/// <summary>
/// Provider Groq (API compatível com OpenAI chat.completions).
/// Modelo default: openai/gpt-oss-20b.
/// </summary>
public sealed class GroqAgentProvider(
    IHttpClientFactory httpClientFactory,
    IOptions<GroqOptions> options,
    IServiceScopeFactory scopeFactory,
    ILogger<GroqAgentProvider> logger) : IAgentProvider
{
    public string ProviderKey => "groq";

    public string DisplayName => "Groq";

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
            throw new InvalidOperationException("Groq API key is not configured.");

        using var scope = scopeFactory.CreateScope();
        var tools = scope.ServiceProvider.GetRequiredService<AgentTools>();

        var messages = BuildMessages(request);
        var client = httpClientFactory.CreateClient("groq");
        var model = string.IsNullOrWhiteSpace(opts.Model) ? "openai/gpt-oss-20b" : opts.Model;
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

        var rateLimitRetries = 0;
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
                logger.LogError(ex, "Failed to parse Groq response");
                throw new InvalidOperationException("Invalid response from Groq.");
            }

            // Limite por minuto (TPM) do Groq: espera o tempo que a própria API indica e repete a rodada.
            if ((int)httpResponse.StatusCode == 429 && rateLimitRetries < 2
                && RetryAfterSeconds(body) is { } waitSec && waitSec <= 20)
            {
                rateLimitRetries++;
                logger.LogWarning("Groq rate limit on round {Round}; waiting {Wait:0.0}s and retrying", round, waitSec);
                await Task.Delay(TimeSpan.FromSeconds(waitSec + 0.5), ct);
                round--;
                continue;
            }

            var apiError = root?["error"];
            if (apiError is not null)
            {
                var msg = apiError["message"]?.GetValue<string>()
                          ?? "Groq API error";
                // Malformed tool JSON / transient provider errors mid-loop: keep tools already run.
                if (round > 0 && IsRecoverableProviderError(msg, (int)httpResponse.StatusCode))
                {
                    logger.LogWarning(
                        "Groq recoverable error on round {Round}; finalizing with tools so far: {Msg}",
                        round,
                        msg);
                    break;
                }

                throw new InvalidOperationException(msg);
            }

            if (!httpResponse.IsSuccessStatusCode)
            {
                var msg = $"Groq HTTP {(int)httpResponse.StatusCode}: {Trim(body, 400)}";
                if (round > 0 && IsRecoverableProviderError(msg, (int)httpResponse.StatusCode))
                {
                    logger.LogWarning(
                        "Groq HTTP recoverable on round {Round}; finalizing with tools so far: {Msg}",
                        round,
                        msg);
                    break;
                }

                throw new InvalidOperationException(msg);
            }

            var message = root?["choices"]?[0]?["message"] as JsonObject;
            if (message is null)
                throw new InvalidOperationException("Groq returned an empty choice.");

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

                object result;
                try
                {
                    result = await tools.ExecuteAsync(name, args);
                }
                catch (Exception ex)
                {
                    logger.LogWarning(ex, "Tool {Tool} failed; returning error to model", name);
                    result = new { error = ex.Message };
                }

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

    private static double? RetryAfterSeconds(string body)
    {
        var m = System.Text.RegularExpressions.Regex.Match(body, @"try again in ([0-9]+(?:\.[0-9]+)?)s");
        return m.Success && double.TryParse(m.Groups[1].Value, System.Globalization.NumberStyles.Float,
            System.Globalization.CultureInfo.InvariantCulture, out var s) ? s : null;
    }

    private static bool IsRecoverableProviderError(string message, int statusCode)
    {
        if (statusCode is 429 or 500 or 502 or 503)
            return true;
        return message.Contains("tool call", StringComparison.OrdinalIgnoreCase)
               || message.Contains("rate limit", StringComparison.OrdinalIgnoreCase)
               || message.Contains("arguments as JSON", StringComparison.OrdinalIgnoreCase);
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
