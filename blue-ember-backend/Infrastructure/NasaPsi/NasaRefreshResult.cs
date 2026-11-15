namespace BlueEmber.Api.Infrastructure.NasaPsi;

public sealed record NasaRefreshResult(
    bool Refreshed,
    int Count,
    int FeaturedFireSafetyCount,
    bool PersistedToDisk,
    string? Error = null);
