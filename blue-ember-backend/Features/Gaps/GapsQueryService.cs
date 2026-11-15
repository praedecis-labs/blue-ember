using BlueEmber.Api.Domain.Environments;
using BlueEmber.Api.Features.Contracts;
using BlueEmber.Api.Infrastructure.Data;

namespace BlueEmber.Api.Features.Gaps;

public sealed class GapsQueryService(IInvestigationRepository repo)
{
    public bool TryBuild(string? environment, out GapsResponse? response, out string? error)
    {
        response = null;
        error = null;

        if (!MissionEnvironmentCatalog.TryParse(environment, out var missionEnv))
        {
            error = "Invalid environment. Use Iss, Moon, or Mars.";
            return false;
        }

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

        response = new GapsResponse(
            missionEnv.ToString(),
            new MissionTargetsDto(
                targets.TargetO2Percent,
                targets.TargetPressureKpa,
                targets.TargetFlowCms),
            "O PSI quase não contém dados de gravidade parcial (Lua ~0,16g / Marte ~0,38g). " +
            "A maior parte dos ensaios é 0g ou 1g; interpolar entre esses regimes pode subestimar risco.",
            nearTarget,
            cells,
            investigations.Count);
        return true;
    }
}
