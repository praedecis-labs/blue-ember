using BlueEmber.Api.Domain.Investigations;
using BlueEmber.Api.Infrastructure.Data;

namespace BlueEmber.Api.Infrastructure.NasaPsi;

public sealed class NasaRefreshService
{
    private static readonly SemaphoreSlim Gate = new(1, 1);

    private readonly NasaPsiClient _client;
    private readonly IInvestigationRepository _repo;
    private readonly IHostEnvironment _env;
    private readonly ILogger<NasaRefreshService> _logger;

    public NasaRefreshService(
        NasaPsiClient client,
        IInvestigationRepository repo,
        IHostEnvironment env,
        ILogger<NasaRefreshService> logger)
    {
        _client = client;
        _repo = repo;
        _env = env;
        _logger = logger;
    }

    public async Task<NasaRefreshResult> RefreshAsync(CancellationToken cancellationToken = default)
    {
        if (!await Gate.WaitAsync(0, cancellationToken))
        {
            return new NasaRefreshResult(false, _repo.GetAll().Count, 0, false, "Refresh already in progress.");
        }

        try
        {
            var fetched = await _client.FetchInvestigationsAsync(cancellationToken: cancellationToken);
            if (fetched.Count == 0)
            {
                _logger.LogWarning("NASA PSI GEODE returned zero investigations");
                return new NasaRefreshResult(false, 0, 0, false, "NASA PSI returned zero investigations");
            }

            var merged = MergeWithEnrichedCache(fetched, _repo.GetAll());
            _repo.ReplaceAll(merged, "geode");

            var persisted = false;
            if (_env.IsDevelopment())
            {
                await _repo.PersistToDiskAsync(cancellationToken);
                persisted = true;
            }

            var featured = merged.Count(x => x.IsFeaturedFireSafety);
            _logger.LogInformation(
                "NASA PSI refresh ok: count={Count} featured={Featured} persisted={Persisted}",
                merged.Count,
                featured,
                persisted);

            return new NasaRefreshResult(true, merged.Count, featured, persisted);
        }
        finally
        {
            Gate.Release();
        }
    }

    private static List<Investigation> MergeWithEnrichedCache(
        IReadOnlyList<Investigation> fetched,
        IReadOnlyList<Investigation> existingList)
    {
        var existing = existingList.ToDictionary(i => i.Id, StringComparer.OrdinalIgnoreCase);
        return fetched.Select(f =>
        {
            if (!existing.TryGetValue(f.Id, out var prev))
                return f;

            f.Materials = prev.Materials;
            f.Geometry = prev.Geometry;
            f.O2Range = prev.O2Range;
            f.PressureKpa = prev.PressureKpa;
            f.FlowSpeedCms = prev.FlowSpeedCms;
            f.FlameSpreadRateMms = prev.FlameSpreadRateMms;
            f.MocPercent = prev.MocPercent;
            f.HrrKw = prev.HrrKw;
            f.CoPpm = prev.CoPpm;
            f.RelevanceHabitat = prev.RelevanceHabitat;
            f.IsFeaturedFireSafety = prev.IsFeaturedFireSafety || f.IsFeaturedFireSafety;
            if (string.IsNullOrWhiteSpace(f.EarthBenefits))
                f.EarthBenefits = prev.EarthBenefits;
            return f;
        }).ToList();
    }
}
