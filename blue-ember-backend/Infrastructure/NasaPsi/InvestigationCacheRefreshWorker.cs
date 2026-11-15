using BlueEmber.Api.Infrastructure.Data;
using Microsoft.Extensions.Options;

namespace BlueEmber.Api.Infrastructure.NasaPsi;

public sealed class InvestigationCacheRefreshWorker : BackgroundService
{
    private readonly IServiceProvider _services;
    private readonly DataOptions _options;
    private readonly ILogger<InvestigationCacheRefreshWorker> _logger;

    public InvestigationCacheRefreshWorker(
        IServiceProvider services,
        IOptions<DataOptions> options,
        ILogger<InvestigationCacheRefreshWorker> logger)
    {
        _services = services;
        _options = options.Value;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        if (_options.CacheTtlMinutes <= 0)
        {
            _logger.LogInformation("Cache TTL auto-refresh disabled (Data:CacheTtlMinutes <= 0)");
            return;
        }

        var checkEvery = TimeSpan.FromMinutes(Math.Max(1, _options.CacheRefreshCheckMinutes));
        var ttl = TimeSpan.FromMinutes(_options.CacheTtlMinutes);
        _logger.LogInformation(
            "Cache TTL auto-refresh enabled: ttl={TtlMinutes}m checkEvery={CheckMinutes}m",
            _options.CacheTtlMinutes,
            Math.Max(1, _options.CacheRefreshCheckMinutes));

        using var timer = new PeriodicTimer(checkEvery);
        while (await timer.WaitForNextTickAsync(stoppingToken))
        {
            try
            {
                await MaybeRefreshAsync(ttl, stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Cache TTL auto-refresh tick failed");
            }
        }
    }

    private async Task MaybeRefreshAsync(TimeSpan ttl, CancellationToken cancellationToken)
    {
        using var scope = _services.CreateScope();
        var repo = scope.ServiceProvider.GetRequiredService<IInvestigationRepository>();
        var refresh = scope.ServiceProvider.GetRequiredService<NasaRefreshService>();

        var info = repo.GetCacheInfo();
        if (info.LastLoadedAtUtc is null)
        {
            _logger.LogWarning("Cache has no LastLoadedAt; triggering GEODE refresh");
            await refresh.RefreshAsync(cancellationToken);
            return;
        }

        var age = DateTimeOffset.UtcNow - info.LastLoadedAtUtc.Value;
        if (age < ttl)
            return;

        _logger.LogInformation(
            "Cache stale (age={AgeMinutes:F1}m >= ttl={TtlMinutes}m); refreshing from GEODE",
            age.TotalMinutes,
            ttl.TotalMinutes);

        var result = await refresh.RefreshAsync(cancellationToken);
        if (!result.Refreshed)
            _logger.LogWarning("Auto-refresh did not refresh: {Error}", result.Error);
    }
}
