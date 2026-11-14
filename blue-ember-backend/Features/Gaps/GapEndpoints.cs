using BlueEmber.Api.Domain.Environments;
using BlueEmber.Api.Features.Contracts;
using BlueEmber.Api.Infrastructure.Data;
using Microsoft.OpenApi.Models;

namespace BlueEmber.Api.Features.Gaps;

public static class GapEndpoints
{
    public static IEndpointRouteBuilder MapGapEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapGet("/api/gaps", (IInvestigationRepository repo, string? environment) =>
        {
            if (!MissionEnvironmentCatalog.TryParse(environment, out var missionEnv))
                return Results.BadRequest(new ErrorResponse(
                    "Invalid environment. Use Iss, Moon, or Mars."));

            var targets = MissionEnvironmentCatalog.Targets(missionEnv);
            var investigations = repo.GetAll().Where(i => i.IsFeaturedFireSafety).ToList();

            var o2Bins = new[] { 15.0, 21.0, 30.0, 40.0, 60.0, 85.0 };
            var pBins = new[] { 50.0, 70.3, 85.0, 101.3 };

            var cells = new List<CoverageCellDto>();
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

                    cells.Add(new CoverageCellDto(
                        o2Lo,
                        o2Hi,
                        pLo,
                        pHi,
                        covering.Count,
                        covering.Select(c => c.Id).Take(8).ToList()));
                }
            }

            var nearTarget = investigations.Where(inv =>
            {
                var o2Close = inv.O2Range.Any(o => Math.Abs(o - targets.TargetO2Percent) <= 5);
                var pClose = inv.PressureKpa.Any(p => Math.Abs(p - targets.TargetPressureKpa) <= 15);
                return o2Close && pClose;
            }).Select(i => i.Id).ToList();

            return Results.Ok(new GapsResponse(
                missionEnv.ToString(),
                new MissionTargetsDto(
                    targets.TargetO2Percent,
                    targets.TargetPressureKpa,
                    targets.TargetFlowCms),
                "O PSI quase não contém dados de gravidade parcial (Lua ~0,16g / Marte ~0,38g). " +
                "A maior parte dos ensaios é 0g ou 1g; interpolar entre esses regimes pode subestimar risco.",
                nearTarget,
                cells,
                investigations.Count));
        })
        .WithName("GetGaps")
        .WithTags("Gaps")
        .Produces<GapsResponse>(StatusCodes.Status200OK)
        .Produces<ErrorResponse>(StatusCodes.Status400BadRequest)
        .WithOpenApi(op =>
        {
            op.Summary = "Grade O2×pressão e gaps (sempre featured fire-safety).";
            DescribeQuery(op, "environment", "Opcional. Default: Moon. Valores: Iss, Moon, Mars.");
            return op;
        });

        return app;
    }

    private static void DescribeQuery(OpenApiOperation op, string name, string description)
    {
        var param = op.Parameters?.FirstOrDefault(p => p.Name == name);
        if (param is not null)
            param.Description = description;
    }
}
