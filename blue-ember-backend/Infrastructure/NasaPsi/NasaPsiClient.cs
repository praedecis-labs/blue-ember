using System.Text.Json;
using BlueEmber.Api.Domain.Investigations;
using Microsoft.Extensions.Options;

namespace BlueEmber.Api.Infrastructure.NasaPsi;

public sealed class NasaPsiClient
{
    private readonly HttpClient _http;
    private readonly NasaPsiOptions _options;
    private readonly ILogger<NasaPsiClient> _logger;

    public NasaPsiClient(HttpClient http, IOptions<NasaPsiOptions> options, ILogger<NasaPsiClient> logger)
    {
        _http = http;
        _options = options.Value;
        _logger = logger;
    }

    public async Task<IReadOnlyList<Investigation>> FetchInvestigationsAsync(
        string? query = null,
        string? researchArea = null,
        int? size = null,
        CancellationToken cancellationToken = default)
    {
        var q = query ?? _options.DefaultQuery;
        var area = researchArea ?? _options.DefaultResearchArea;
        var sz = size ?? _options.DefaultSize;

        var url = $"{_options.BaseUrl}?q={Uri.EscapeDataString(q)}" +
                  $"&data_source=psi&data_type=investigation&size={sz}";
        if (!string.IsNullOrWhiteSpace(area))
            url += $"&research_area={Uri.EscapeDataString(area)}";

        _logger.LogInformation("Fetching NASA PSI GEODE: {Url}", url);

        using var response = await _http.GetAsync(url, cancellationToken);
        response.EnsureSuccessStatusCode();

        await using var stream = await response.Content.ReadAsStreamAsync(cancellationToken);
        using var doc = await JsonDocument.ParseAsync(stream, cancellationToken: cancellationToken);

        if (!doc.RootElement.TryGetProperty("hits", out var hitsObj) ||
            !hitsObj.TryGetProperty("hits", out var hits) ||
            hits.ValueKind != JsonValueKind.Array)
        {
            return [];
        }

        var list = new List<Investigation>();
        foreach (var hit in hits.EnumerateArray())
        {
            if (!hit.TryGetProperty("_source", out var source))
                continue;
            list.Add(InvestigationNormalizer.FromJsonElement(source));
        }

        return list;
    }
}
