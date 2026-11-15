namespace BlueEmber.Api.Features.Health;

public record HealthResponse(
    string Status,
    string Service,
    long? DataAgeSeconds,
    string? LastLoadedAt,
    string? DataSource,
    int InvestigationCount,
    bool? CacheStale,
    int CacheTtlMinutes);
