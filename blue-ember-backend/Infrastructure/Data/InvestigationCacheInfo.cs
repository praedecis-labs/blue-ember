namespace BlueEmber.Api.Infrastructure.Data;

public sealed record InvestigationCacheInfo(
    DateTimeOffset? LastLoadedAtUtc,
    string? Source,
    int Count);
