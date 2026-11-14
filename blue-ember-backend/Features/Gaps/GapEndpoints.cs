using BlueEmber.Api.Domain.Environments;
using BlueEmber.Api.Infrastructure.Data;

namespace BlueEmber.Api.Features.Gaps;

public static class GapEndpoints
{
    public static IEndpointRouteBuilder MapGapEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapGet("/api/gaps", (IInvestigationRepository repo, string? environment) =>
        {
            if (!MissionEnvironmentCatalog.TryParse(environment, out var missionEnv))
                return Results.BadRequest(new { error = "Invalid environment. Use Iss, Moon, or Mars." });

            var targets = MissionEnvironmentCatalog.Targets(missionEnv);
            var investigations = repo.GetAll().Where(i => i.IsFeaturedFireSafety).ToList();

            // Coarse O2 x Pressure coverage grid for the selected environment
            var o2Bins = new[] { 15.0, 21.0, 30.0, 40.0, 60.0, 85.0 };
            var pBins = new[] { 50.0, 70.3, 85.0, 101.3 };

            var cells = new List<object>();
            for (var oi = 0; oi < o2Bins.Length - 1; oi++)
            {
                for (var pi = 0; pi < pBins.Length - 1; pi++)
                {
                    var o2Lo = o2Bins[oi];
                    var o2Hi = o2Bins[oi + 1];
                    var pLo = pBins[pi];
                    var pHi = pBins[pi + 1];

                    var covering = investigations.Where(inv =>
                        inv.O2Range.Any(o => o >= o2Lo && o <= o2Hi) &&
                        inv.PressureKpa.Any(p => p >= pLo && p <= pHi)).ToList();

                    cells.Add(new
                    {
                        o2Min = o2Lo,
                        o2Max = o2Hi,
                        pressureMinKpa = pLo,
                        pressureMaxKpa = pHi,
                        coverageCount = covering.Count,
                        investigationIds = covering.Select(c => c.Id).Take(8).ToList()
                    });
                }
            }

            var nearTarget = investigations.Where(inv =>
            {
                var o2Close = inv.O2Range.Any(o => Math.Abs(o - targets.TargetO2Percent) <= 5);
                var pClose = inv.PressureKpa.Any(p => Math.Abs(p - targets.TargetPressureKpa) <= 15);
                return o2Close && pClose;
            }).Select(i => i.Id).ToList();

            return Results.Ok(new
            {
                environment = missionEnv.ToString(),
                targets = new
                {
                    o2Percent = targets.TargetO2Percent,
                    pressureKpa = targets.TargetPressureKpa,
                    flowCms = targets.TargetFlowCms
                },
                partialGravityWarning =
                    "O PSI quase não contém dados de gravidade parcial (Lua ~0,16g / Marte ~0,38g). " +
                    "A maior parte dos ensaios é 0g ou 1g; interpolar entre esses regimes pode subestimar risco.",
                nearTargetInvestigationIds = nearTarget,
                coverageCells = cells,
                featuredCount = investigations.Count
            });
        })
        .WithName("GetGaps")
        .WithTags("Gaps")
        .WithOpenApi();

        return app;
    }
}
