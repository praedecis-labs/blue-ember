using BlueEmber.Api.Domain.Environments;
using BlueEmber.Api.Domain.Investigations;
using BlueEmber.Api.Domain.Profiles;

namespace BlueEmber.Api.Domain.Scoring;

public sealed record CriterionBreakdown(
    double C1Proximidade,
    double C2MargemMoc,
    double C3Cinetica,
    double C4SeveridadeTermica,
    double C5Toxicidade,
    double Total);

public sealed class ScoreCalculator
{
    public CriterionBreakdown Calculate(
        Investigation inv,
        MissionEnvironment environment,
        ScoreWeights weights)
    {
        var targets = MissionEnvironmentCatalog.Targets(environment);

        var c1 = Proximidade(inv, targets);
        var c2 = MargemMoc(inv, targets.TargetO2Percent);
        var c3 = Normalize(inv.FlameSpreadRateMms, 0, 4);
        var c4 = Normalize(inv.HrrKw, 0, 12);
        var c5 = Normalize(inv.CoPpm, 0, 700);

        var total =
            weights.W1 * c1 +
            weights.W2 * c2 +
            weights.W3 * c3 +
            weights.W4 * c4 +
            weights.W5 * c5;

        return new CriterionBreakdown(
            Round(c1),
            Round(c2),
            Round(c3),
            Round(c4),
            Round(c5),
            Round(total * 10)); // scale 0-10 for UI friendliness
    }

    private static double Proximidade(Investigation inv, EnvironmentTargets targets)
    {
        var o2 = Closest(inv.O2Range, targets.TargetO2Percent);
        var p = Closest(inv.PressureKpa, targets.TargetPressureKpa);
        var f = Closest(inv.FlowSpeedCms, targets.TargetFlowCms);

        var o2Score = 1.0 - Math.Min(1.0, Math.Abs(o2 - targets.TargetO2Percent) / 40.0);
        var pScore = 1.0 - Math.Min(1.0, Math.Abs(p - targets.TargetPressureKpa) / 60.0);
        var fScore = 1.0 - Math.Min(1.0, Math.Abs(f - targets.TargetFlowCms) / 40.0);

        var habitatBoost = inv.RelevanceHabitat.Any(h =>
            h.Contains("Moon", StringComparison.OrdinalIgnoreCase) ||
            h.Contains("Mars", StringComparison.OrdinalIgnoreCase) ||
            h.Contains("ISS", StringComparison.OrdinalIgnoreCase) ||
            h.Contains("Space", StringComparison.OrdinalIgnoreCase))
            ? 0.05
            : 0;

        return Math.Clamp((o2Score + pScore + fScore) / 3.0 + habitatBoost, 0, 1);
    }

    private static double MargemMoc(Investigation inv, double ambientO2)
    {
        // Larger positive margin (ambient O2 above MOC) indicates flammability risk relevance.
        var margin = ambientO2 - inv.MocPercent;
        return Normalize(margin, 0, 20);
    }

    private static double Closest(IReadOnlyList<double> values, double target)
    {
        if (values.Count == 0) return target;
        return values.OrderBy(v => Math.Abs(v - target)).First();
    }

    private static double Normalize(double value, double min, double max)
    {
        if (max <= min) return 0;
        return Math.Clamp((value - min) / (max - min), 0, 1);
    }

    private static double Round(double v) => Math.Round(v, 3);
}
