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

    public void ReplaceAll(IEnumerable<Investigation> investigations)
    {
        var list = investigations.ToList();
        lock (_gate)
        {
            _all = list;
            _byId.Clear();
            foreach (var inv in list)
                _byId[inv.Id] = inv;
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

        ReplaceAll(list);
        _logger.LogInformation("Loaded {Count} investigations from {Path}", list.Count, path);
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
        ["doi"] = inv.Doi
    };
}
