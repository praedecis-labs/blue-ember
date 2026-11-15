using System.Collections.Concurrent;
using System.Text.Json;
using BlueEmber.Api.Domain.Investigations;
using BlueEmber.Api.Infrastructure.NasaPsi;
using Microsoft.Extensions.Options;

namespace BlueEmber.Api.Infrastructure.Data;

public sealed class JsonInvestigationStore : IInvestigationRepository
{
    private readonly DataOptions _options;
    private readonly IHostEnvironment _env;
    private readonly ILogger<JsonInvestigationStore> _logger;
    private readonly ConcurrentDictionary<string, Investigation> _byId = new(StringComparer.OrdinalIgnoreCase);
    private List<Investigation> _all = [];
    private DateTimeOffset? _lastLoadedAtUtc;
    private string? _source;
    private readonly object _gate = new();

    private static readonly JsonSerializerOptions WriteOptions = new()
    {
        WriteIndented = true,
        PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower
    };

    public JsonInvestigationStore(
        IOptions<DataOptions> options,
        IHostEnvironment env,
        ILogger<JsonInvestigationStore> logger)
    {
        _options = options.Value;
        _env = env;
        _logger = logger;
    }

    public IReadOnlyList<Investigation> GetAll()
    {
        lock (_gate) return _all;
    }

    public Investigation? GetById(string id)
    {
        _byId.TryGetValue(id, out var inv);
        return inv;
    }

    public InvestigationCacheInfo GetCacheInfo()
    {
        lock (_gate)
            return new InvestigationCacheInfo(_lastLoadedAtUtc, _source, _all.Count);
    }

    public void ReplaceAll(
        IEnumerable<Investigation> investigations,
        string source = "memory",
        DateTimeOffset? loadedAtUtc = null)
    {
        var list = investigations.ToList();
        lock (_gate)
        {
            _all = list;
            _byId.Clear();
            foreach (var inv in list)
                _byId[inv.Id] = inv;
            _lastLoadedAtUtc = loadedAtUtc ?? DateTimeOffset.UtcNow;
            _source = source;
        }
    }

    public async Task LoadFromDiskAsync(CancellationToken cancellationToken = default)
    {
        var path = ResolvePath();
        if (!File.Exists(path))
        {
            _logger.LogWarning("Normalized investigations file not found at {Path}", path);
            return;
        }

        await using var stream = File.OpenRead(path);
        using var doc = await JsonDocument.ParseAsync(stream, cancellationToken: cancellationToken);

        if (!doc.RootElement.TryGetProperty("investigations", out var arr) ||
            arr.ValueKind != JsonValueKind.Array)
        {
            _logger.LogWarning("Invalid investigations JSON shape at {Path}", path);
            return;
        }

        var list = arr.EnumerateArray()
            .Select(InvestigationNormalizer.FromCachedJson)
            .ToList();

        var loadedAt = ReadTimestamp(doc.RootElement) ?? new DateTimeOffset(File.GetLastWriteTimeUtc(path));
        ReplaceAll(list, "disk", loadedAt);
        _logger.LogInformation(
            "Loaded {Count} investigations from {Path} (age source timestamp {LoadedAt})",
            list.Count,
            path,
            loadedAt);
    }

    public async Task PersistToDiskAsync(CancellationToken cancellationToken = default)
    {
        var path = ResolvePath();
        var dir = Path.GetDirectoryName(path);
        if (!string.IsNullOrEmpty(dir))
            Directory.CreateDirectory(dir);

        var snapshot = GetAll();
        var payload = new
        {
            metadata = new
            {
                source = "NASA Physical Sciences Informatics (PSI) GEODE Repository",
                api_endpoint = "https://psi.nasa.gov/geode-py/ws/repo/search",
                total_investigations = snapshot.Count,
                featured_fire_safety_count = snapshot.Count(x => x.IsFeaturedFireSafety),
                timestamp = DateTime.UtcNow.ToString("o")
            },
            investigations = snapshot.Select(ToSnakeDict)
        };

        await using var stream = File.Create(path);
        await JsonSerializer.SerializeAsync(stream, payload, WriteOptions, cancellationToken);
        _logger.LogInformation("Persisted {Count} investigations to {Path}", snapshot.Count, path);
    }

    private static DateTimeOffset? ReadTimestamp(JsonElement root)
    {
        if (!root.TryGetProperty("metadata", out var meta))
            return null;
        if (!meta.TryGetProperty("timestamp", out var ts))
            return null;
        var raw = ts.GetString();
        if (string.IsNullOrWhiteSpace(raw))
            return null;
        return DateTimeOffset.TryParse(raw, out var parsed) ? parsed.ToUniversalTime() : null;
    }

    private string ResolvePath()
    {
        var configured = _options.NormalizedInvestigationsPath;
        if (Path.IsPathRooted(configured))
            return configured;

        var candidates = new[]
        {
            Path.GetFullPath(Path.Combine(_env.ContentRootPath, configured)),
            Path.GetFullPath(Path.Combine(Directory.GetCurrentDirectory(), configured)),
            Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, configured)),
            Path.GetFullPath(Path.Combine(_env.ContentRootPath, "data", "normalized_investigations.json"))
        };

        return candidates.FirstOrDefault(File.Exists) ?? candidates[0];
    }

    private static Dictionary<string, object?> ToSnakeDict(Investigation inv) => new()
    {
        ["id"] = inv.Id,
        ["acronym"] = inv.Acronym,
        ["title"] = inv.Title,
        ["platform"] = inv.Platform,
        ["hardware"] = inv.Hardware,
        ["hardware_link"] = inv.HardwareLink,
        ["discipline"] = inv.Discipline,
        ["sub_discipline"] = inv.SubDiscipline,
        ["objectives"] = inv.Objectives,
        ["approach"] = inv.Approach,
        ["hypothesis"] = inv.Hypothesis,
        ["earth_benefits"] = inv.EarthBenefits,
        ["materials"] = inv.Materials,
        ["geometry"] = inv.Geometry,
        ["o2_range"] = inv.O2Range,
        ["pressure_kpa"] = inv.PressureKpa,
        ["flow_speed_cms"] = inv.FlowSpeedCms,
        ["flame_spread_rate_mms"] = inv.FlameSpreadRateMms,
        ["moc_percent"] = inv.MocPercent,
        ["hrr_kw"] = inv.HrrKw,
        ["co_ppm"] = inv.CoPpm,
        ["relevance_habitat"] = inv.RelevanceHabitat,
        ["is_featured_fire_safety"] = inv.IsFeaturedFireSafety,
        ["nasa_psi_url"] = inv.NasaPsiUrl,
        ["doi"] = inv.Doi,
        ["test_conditions"] = inv.TestConditions.Select(c => new Dictionary<string, object?>
        {
            ["material"] = c.Material,
            ["geometry"] = c.Geometry,
            ["o2_percent"] = c.O2Percent,
            ["pressure_kpa"] = c.PressureKpa,
            ["flow_speed_cms"] = c.FlowSpeedCms,
            ["flame_spread_rate_mms"] = c.FlameSpreadRateMms,
            ["moc_percent"] = c.MocPercent,
            ["hrr_kw"] = c.HrrKw,
            ["co_ppm"] = c.CoPpm,
            ["provenance"] = c.Provenance,
            ["regime"] = c.Regime
        }).ToList()
    };
}
