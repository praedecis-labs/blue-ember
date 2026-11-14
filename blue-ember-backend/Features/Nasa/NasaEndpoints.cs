using BlueEmber.Api.Infrastructure.Data;
using BlueEmber.Api.Infrastructure.NasaPsi;

namespace BlueEmber.Api.Features.Nasa;

public static class NasaEndpoints
{
    public static IEndpointRouteBuilder MapNasaEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapPost("/api/nasa/refresh", async (
            NasaPsiClient client,
            IInvestigationRepository repo,
            IHostEnvironment env,
            CancellationToken ct) =>
        {
            try
            {
                var fetched = await client.FetchInvestigationsAsync(cancellationToken: ct);
                if (fetched.Count == 0)
                    return Results.Problem("NASA PSI returned zero investigations", statusCode: StatusCodes.Status502BadGateway);

                // Prefer enriched cache metrics when the same id already exists
                var existing = repo.GetAll().ToDictionary(i => i.Id, StringComparer.OrdinalIgnoreCase);
                var merged = fetched.Select(f =>
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

                repo.ReplaceAll(merged);

                if (env.IsDevelopment())
                    await repo.PersistToDiskAsync(ct);

                return Results.Ok(new
                {
                    refreshed = true,
                    count = merged.Count,
                    featuredFireSafetyCount = merged.Count(x => x.IsFeaturedFireSafety),
                    persistedToDisk = env.IsDevelopment()
                });
            }
            catch (Exception ex)
            {
                return Results.Problem(
                    detail: ex.Message,
                    title: "Failed to refresh NASA PSI data",
                    statusCode: StatusCodes.Status502BadGateway);
            }
        })
        .WithName("RefreshNasaPsi")
        .WithTags("Nasa")
        .WithOpenApi();

        return app;
    }
}
