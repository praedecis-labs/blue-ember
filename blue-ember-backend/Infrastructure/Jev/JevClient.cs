using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Options;

namespace BlueEmber.Api.Infrastructure.Jev;

public sealed class JevClient
{
    private readonly HttpClient _http;
    private readonly JevOptions _options;
    private readonly ILogger<JevClient> _logger;
    private static readonly JsonSerializerOptions JsonOpts = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        DefaultIgnoreCondition = System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull,
        Converters = { new JevAnswerConverter() }
    };

    public JevClient(HttpClient http, IOptions<JevOptions> options, ILogger<JevClient> logger)
    {
        _http = http;
        _options = options.Value;
        _logger = logger;
    }

    public async Task<JevResponse> EvaluateAsync(
        object state,
        Dictionary<string, JevQuestion> questions,
        CancellationToken cancellationToken = default)
    {
        var request = new JevRequest
        {
            Model = _options.Model,
            State = state,
            Questions = questions
        };

        var json = JsonSerializer.Serialize(request, JsonOpts);
        using var content = new StringContent(json, Encoding.UTF8, "application/json");

        _logger.LogInformation("Calling Jev {Model} with {QuestionCount} questions", _options.Model, questions.Count);

        using var response = await _http.PostAsync("/v1/systemone", content, cancellationToken);

        var body = await response.Content.ReadAsStringAsync(cancellationToken);
        if (!response.IsSuccessStatusCode)
        {
            _logger.LogWarning(
                "Jev {Model} returned {Status}: {Body}",
                _options.Model, (int)response.StatusCode, Trim(body, 500));
            throw new InvalidOperationException(
                $"Jev API error {(int)response.StatusCode}: {Trim(body, 300)}");
        }

        var jevResponse = JsonSerializer.Deserialize<JevResponse>(body, JsonOpts)
            ?? throw new InvalidOperationException("Jev returned empty response.");

        return jevResponse;
    }

    private static string Trim(string s, int max) =>
        s.Length <= max ? s : s[..max] + "…";
}
