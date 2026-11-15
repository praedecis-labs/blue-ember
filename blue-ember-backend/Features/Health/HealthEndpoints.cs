using BlueEmber.Api.Infrastructure.Data;
using Microsoft.Extensions.Options;

namespace BlueEmber.Api.Features.Health;

public static class HealthEndpoints
{
    public static IEndpointRouteBuilder MapHealthEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapGet("/api/health", (IInvestigationRepository repo, IOptions<DataOptions> dataOptions) =>
            {
                var opts = dataOptions.Value;
                var info = repo.GetCacheInfo();
                long? ageSeconds = null;
                bool? stale = null;

                if (info.LastLoadedAtUtc is { } loadedAt)
                {
                    ageSeconds = (long)Math.Max(0, (DateTimeOffset.UtcNow - loadedAt).TotalSeconds);
                    if (opts.CacheTtlMinutes > 0)
                        stale = ageSeconds > opts.CacheTtlMinutes * 60L;
                }

                return Results.Ok(new HealthResponse(
                    "ok",
                    "BlueEmber.Api",
                    ageSeconds,
                    info.LastLoadedAtUtc?.ToString("o"),
                    info.Source,
                    info.Count,
                    stale,
                    opts.CacheTtlMinutes));
            })
            .WithName("Health")
            .WithTags("Health")
            .Produces<HealthResponse>(StatusCodes.Status200OK)
            .WithOpenApi();

        return app;
    }
}
