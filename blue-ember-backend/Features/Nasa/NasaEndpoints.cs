using BlueEmber.Api.Infrastructure.NasaPsi;

namespace BlueEmber.Api.Features.Nasa;

public static class NasaEndpoints
{
    public static IEndpointRouteBuilder MapNasaEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapPost("/api/nasa/refresh", async (
            NasaRefreshService refresh,
            CancellationToken ct) =>
        {
            try
            {
                var result = await refresh.RefreshAsync(ct);
                if (!result.Refreshed)
                {
                    var status = result.Error?.Contains("already in progress", StringComparison.OrdinalIgnoreCase) == true
                        ? StatusCodes.Status409Conflict
                        : StatusCodes.Status502BadGateway;
                    return Results.Problem(
                        detail: result.Error ?? "Refresh failed",
                        title: "Failed to refresh NASA PSI data",
                        statusCode: status);
                }

                return Results.Ok(new
                {
                    refreshed = true,
                    count = result.Count,
                    featuredFireSafetyCount = result.FeaturedFireSafetyCount,
                    persistedToDisk = result.PersistedToDisk
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
