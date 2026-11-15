using BlueEmber.Api.Domain.Environments;
using BlueEmber.Api.Domain.Investigations;
using BlueEmber.Api.Domain.Profiles;

namespace BlueEmber.Api.Domain.Scoring;

public enum AggregationRule
{
    /// <summary>Usa a condição de maior total (melhor caso).</summary>
    Best,
    /// <summary>Usa a condição de menor total (pior caso — mais conservador para segurança contra incêndio).</summary>
    Worst,
    /// <summary>Usa a condição mais próxima da média (representativa).</summary>
    Average,
}

public sealed record ScoreAggregation
{
    /// <summary>Maior total entre as condições (melhor caso para a investigação).</summary>
    public double Best { get; init; }
    /// <summary>Menor total entre as condições (pior caso — mais conservador para segurança).</summary>
    public double Worst { get; init; }
    /// <summary>Média dos totais de todas as condições.</summary>
    public double Average { get; init; }
    /// <summary>Cobertura: fração de condições com total acima de 5,0 (limiar de relevância).</summary>
    public double Coverage { get; init; }
    public int ConditionCount { get; init; }
    public int BestConditionIndex { get; init; }
    public int WorstConditionIndex { get; init; }
    public TestCondition? BestCondition { get; init; }
    public TestCondition? WorstCondition { get; init; }
    public double? BestPpO2Kpa { get; init; }
    public double? WorstPpO2Kpa { get; init; }
}

public sealed record CriterionBreakdown(
    double C1Proximidade,
    double C2MargemMoc,
    double C3Cinetica,
    double C4SeveridadeTermica,
    double C5Toxicidade,
    double Total,
    int? WinningConditionIndex = null,
    TestCondition? WinningCondition = null,
    double? PpO2Kpa = null,
    ScoreAggregation? Aggregation = null);

public sealed class ScoreCalculator
{
    public CriterionBreakdown Calculate(
        Investigation inv,
        MissionEnvironment environment,
        ScoreWeights weights,
        AggregationRule rule = AggregationRule.Best)
    {
        var targets = MissionEnvironmentCatalog.Targets(environment);
        var conditions = inv.TestConditions.Count > 0
            ? inv.TestConditions
            : [SynthesizeLegacyCondition(inv)];

        var breakdowns = new List<(CriterionBreakdown breakdown, TestCondition condition, int index)>();
        for (var i = 0; i < conditions.Count; i++)
        {
            var breakdown = CalculateCondition(conditions[i], inv, targets, weights);
            breakdowns.Add((breakdown, conditions[i], i));
        }

        if (breakdowns.Count == 0)
            return new CriterionBreakdown(0, 0, 0, 0, 0, 0, null, null, null, BuildAggregation([], rule));

        var best = breakdowns.OrderByDescending(b => b.breakdown.Total).First();
        var worst = breakdowns.OrderBy(b => b.breakdown.Total).First();
        var average = breakdowns.Average(b => b.breakdown.Total);
        var coverage = breakdowns.Count(b => b.breakdown.Total >= 5.0) / (double)breakdowns.Count;

        var agg = new ScoreAggregation
        {
            Best = best.breakdown.Total,
            Worst = worst.breakdown.Total,
            Average = average,
            Coverage = coverage,
            ConditionCount = breakdowns.Count,
            BestConditionIndex = best.index,
            WorstConditionIndex = worst.index,
            BestCondition = best.condition,
            WorstCondition = worst.condition,
            BestPpO2Kpa = best.condition.PpO2Kpa,
            WorstPpO2Kpa = worst.condition.PpO2Kpa,
        };

        var selected = rule switch
        {
            AggregationRule.Worst => worst,
            AggregationRule.Average => breakdowns.OrderBy(b => Math.Abs(b.breakdown.Total - average)).First(),
            _ => best,
        };

        return selected.breakdown with
        {
            WinningConditionIndex = selected.index,
            WinningCondition = selected.condition,
            PpO2Kpa = selected.condition.PpO2Kpa,
            Aggregation = agg,
        };
    }

    private static ScoreAggregation BuildAggregation(
        List<(CriterionBreakdown breakdown, TestCondition condition, int index)> breakdowns,
        AggregationRule rule)
    {
        if (breakdowns.Count == 0)
            return new ScoreAggregation { Best = 0, Worst = 0, Average = 0, Coverage = 0, ConditionCount = 0 };

        var best = breakdowns.OrderByDescending(b => b.breakdown.Total).First();
        var worst = breakdowns.OrderBy(b => b.breakdown.Total).First();
        var average = breakdowns.Average(b => b.breakdown.Total);
        var coverage = breakdowns.Count(b => b.breakdown.Total >= 5.0) / (double)breakdowns.Count;

        return new ScoreAggregation
        {
            Best = best.breakdown.Total,
            Worst = worst.breakdown.Total,
            Average = average,
            Coverage = coverage,
            ConditionCount = breakdowns.Count,
            BestConditionIndex = best.index,
            WorstConditionIndex = worst.index,
            BestCondition = best.condition,
            WorstCondition = worst.condition,
            BestPpO2Kpa = best.condition.PpO2Kpa,
            WorstPpO2Kpa = worst.condition.PpO2Kpa,
        };
    }

    public CriterionBreakdown CalculateCondition(
        TestCondition condition,
        Investigation inv,
        EnvironmentTargets targets,
        ScoreWeights weights)
    {
        var isDetection = string.Equals(inv.Category, "deteccao", StringComparison.OrdinalIgnoreCase)
                          || string.Equals(condition.Regime, "detection", StringComparison.OrdinalIgnoreCase);

        var c1 = Proximidade(condition, inv, targets);
        var c2 = MargemMoc(condition, targets.TargetO2Percent);

        double? c3 = isDetection ? null : OptionalNormalize(condition.FlameSpreadRateMms, 0, 4);
        double? c4 = isDetection ? null : OptionalNormalize(condition.HrrKw, 0, 12);
        double? c5 = isDetection ? null : OptionalNormalize(condition.CoPpm, 0, 700);

        var parts = new List<(double weight, double value)>();
        parts.Add((weights.W1, c1));
        if (c2.HasValue) parts.Add((weights.W2, c2.Value));
        if (c3.HasValue) parts.Add((weights.W3, c3.Value));
        if (c4.HasValue) parts.Add((weights.W4, c4.Value));
        if (c5.HasValue) parts.Add((weights.W5, c5.Value));

        var weightSum = parts.Sum(p => p.weight);
        var total = weightSum <= 0
            ? 0
            : parts.Sum(p => p.weight * p.value) / weightSum;

        return new CriterionBreakdown(
            Round(c1),
            Round(c2 ?? 0),
            Round(c3 ?? 0),
            Round(c4 ?? 0),
            Round(c5 ?? 0),
            Round(total * 10),
            null,
            condition,
            condition.PpO2Kpa);
    }

    private static TestCondition SynthesizeLegacyCondition(Investigation inv) => new()
    {
        Material = inv.Materials.FirstOrDefault(),
        Geometry = string.IsNullOrWhiteSpace(inv.Geometry) ? null : inv.Geometry,
        O2Percent = inv.O2Range.Count > 0 ? inv.O2Range[0] : null,
        PressureKpa = inv.PressureKpa.Count > 0 ? inv.PressureKpa[0] : null,
        FlowSpeedCms = inv.FlowSpeedCms.Count > 0 ? inv.FlowSpeedCms[0] : null,
        FlameSpreadRateMms = inv.FlameSpreadRateMms,
        MocPercent = inv.MocPercent,
        HrrKw = inv.HrrKw,
        CoPpm = inv.CoPpm,
        Provenance = "unknown",
        Regime = null
    };

    private static double Proximidade(
        TestCondition condition,
        Investigation inv,
        EnvironmentTargets targets)
    {
        var axisScores = new List<double>();

        if (condition.O2Percent is { } o2)
        {
            axisScores.Add(1.0 - Math.Min(1.0, Math.Abs(o2 - targets.TargetO2Percent) / 40.0));
        }

        if (condition.PressureKpa is { } p)
        {
            axisScores.Add(1.0 - Math.Min(1.0, Math.Abs(p - targets.TargetPressureKpa) / 60.0));
        }

        if (condition.FlowSpeedCms is { } f)
        {
            axisScores.Add(1.0 - Math.Min(1.0, Math.Abs(f - targets.TargetFlowCms) / 40.0));
        }

        var baseScore = axisScores.Count == 0 ? 0.5 : axisScores.Average();

        var habitatBoost = inv.RelevanceHabitat.Any(h =>
            h.Contains("Moon", StringComparison.OrdinalIgnoreCase) ||
            h.Contains("Mars", StringComparison.OrdinalIgnoreCase) ||
            h.Contains("ISS", StringComparison.OrdinalIgnoreCase) ||
            h.Contains("Space", StringComparison.OrdinalIgnoreCase))
            ? 0.05
            : 0;

        return Math.Clamp(baseScore + habitatBoost, 0, 1);
    }

    private static double? MargemMoc(TestCondition condition, double ambientO2)
    {
        if (condition.MocPercent is not { } moc)
            return null;
        var margin = ambientO2 - moc;
        return Normalize(margin, 0, 20);
    }

    private static double? OptionalNormalize(double? value, double min, double max) =>
        value is { } v ? Normalize(v, min, max) : null;

    private static double Normalize(double value, double min, double max)
    {
        if (max <= min) return 0;
        return Math.Clamp((value - min) / (max - min), 0, 1);
    }

    private static double Round(double v) => Math.Round(v, 3);
}
