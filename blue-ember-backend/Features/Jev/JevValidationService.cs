using BlueEmber.Api.Domain.Environments;
using BlueEmber.Api.Domain.Investigations;
using BlueEmber.Api.Domain.Profiles;
using BlueEmber.Api.Domain.Scoring;
using BlueEmber.Api.Infrastructure.Jev;
using Microsoft.Extensions.Options;

namespace BlueEmber.Api.Features.Jev;

public sealed class JevValidationService
{
    private readonly JevClient _client;
    private readonly ScoreCalculator _calculator;
    private readonly JevOptions _options;

    public JevValidationService(
        JevClient client,
        ScoreCalculator calculator,
        IOptions<JevOptions> options)
    {
        _client = client;
        _calculator = calculator;
        _options = options.Value;
    }

    public async Task<JevValidationResult> ValidateAsync(
        Investigation investigation,
        MissionEnvironment environment,
        ScoreWeights weights,
        CancellationToken cancellationToken = default)
    {
        var breakdown = _calculator.Calculate(investigation, environment, weights);

        var state = new
        {
            investigation_id = investigation.Id,
            acronym = investigation.Acronym,
            title = investigation.Title,
            environment_o2 = MissionEnvironmentCatalog.Targets(environment).TargetO2Percent,
            environment_pressure = MissionEnvironmentCatalog.Targets(environment).TargetPressureKpa,
            environment_flow = MissionEnvironmentCatalog.Targets(environment).TargetFlowCms,
            inv_o2_range = investigation.O2Range,
            inv_pressure_kpa = investigation.PressureKpa,
            inv_flow_speed_cms = investigation.FlowSpeedCms,
            inv_flame_spread_rate_mms = investigation.FlameSpreadRateMms,
            inv_moc_percent = investigation.MocPercent,
            inv_hrr_kw = investigation.HrrKw,
            inv_co_ppm = investigation.CoPpm,
            deterministic_score = breakdown.Total,
            c1_proximidade = breakdown.C1Proximidade,
            c2_margem_moc = breakdown.C2MargemMoc,
            c3_cinetica = breakdown.C3Cinetica,
            c4_severidade_termica = breakdown.C4SeveridadeTermica,
            c5_toxicidade = breakdown.C5Toxicidade
        };

        var questions = new Dictionary<string, JevQuestion>
        {
            ["c1_proximidade"] = new JevQuestion
            {
                Type = "noul",
                Instructions = "Is the investigation's oxygen concentration and pressure close to the mission environment target?",
                Criteria = new
                {
                    @true = "O2 and pressure values are within +/-10% of the mission target",
                    @false = "O2 and/or pressure differ significantly from the mission target"
                }
            },
            ["c2_moc_margin"] = new JevQuestion
            {
                Type = "noul",
                Instructions = "Is the ambient oxygen concentration above the investigation's Minimum Oxygen Concentration (MOC), indicating flammability risk relevance?",
                Criteria = new
                {
                    @true = "Ambient O2 > MOC",
                    @false = "Ambient O2 <= MOC or MOC not applicable"
                }
            },
            ["c3_kinetics"] = new JevQuestion
            {
                Type = "score",
                Instructions = "Rate how relevant the flame spread rate of this investigation is for fire safety in the given environment.",
                Criteria = new[] { "Not relevant", "Low relevance", "Moderate relevance", "High relevance", "Critical relevance" }
            },
            ["c4_thermal_severity"] = new JevQuestion
            {
                Type = "score",
                Instructions = "Rate how severe the heat release rate (HRR) of this investigation is for crew habitat fire safety.",
                Criteria = new[] { "Negligible", "Low", "Moderate", "High", "Critical" }
            },
            ["c5_toxicity"] = new JevQuestion
            {
                Type = "score",
                Instructions = "Rate how toxic the CO emission of this investigation is for crew habitat fire safety.",
                Criteria = new[] { "Negligible", "Low", "Moderate", "High", "Critical" }
            }
        };

        var response = await _client.EvaluateAsync(state, questions, cancellationToken);

        var judgments = new List<JevCriterionJudgment>();

        if (response.Answers.TryGetValue("c1_proximidade", out var a1) && a1 is NoulAnswer n1)
            judgments.Add(new JevCriterionJudgment
            {
                Criterion = "C1",
                Question = "Proximity to mission environment (O2/pressure/flow)",
                Noul = n1.Noul,
                Confidence = null,
                SelectedChoice = null
            });

        if (response.Answers.TryGetValue("c2_moc_margin", out var a2) && a2 is NoulAnswer n2)
            judgments.Add(new JevCriterionJudgment
            {
                Criterion = "C2",
                Question = "Ambient O2 above MOC (flammability risk)",
                Noul = n2.Noul,
                Confidence = null,
                SelectedChoice = null
            });

        if (response.Answers.TryGetValue("c3_kinetics", out var a3) && a3 is ScoreAnswer s3)
            judgments.Add(new JevCriterionJudgment
            {
                Criterion = "C3",
                Question = "Flame spread rate relevance",
                Score = s3.Score,
                Confidence = s3.Confidence,
                SelectedChoice = null
            });

        if (response.Answers.TryGetValue("c4_thermal_severity", out var a4) && a4 is ScoreAnswer s4)
            judgments.Add(new JevCriterionJudgment
            {
                Criterion = "C4",
                Question = "Heat release rate severity",
                Score = s4.Score,
                Confidence = s4.Confidence,
                SelectedChoice = null
            });

        if (response.Answers.TryGetValue("c5_toxicity", out var a5) && a5 is ScoreAnswer s5)
            judgments.Add(new JevCriterionJudgment
            {
                Criterion = "C5",
                Question = "CO emission toxicity",
                Score = s5.Score,
                Confidence = s5.Confidence,
                SelectedChoice = null
            });

        var confidences = judgments.Where(j => j.Confidence.HasValue).Select(j => j.Confidence!.Value).ToList();
        var avgConf = confidences.Count > 0 ? confidences.Average() : 0;

        // Consistência: nenhum Noul crítico (C1, C2) na zona ambígua 0.3-0.7
        var ambiguousNoul = judgments
            .Where(j => j.Noul.HasValue)
            .Any(j => j.Noul.Value is >= 0.3 and <= 0.7);

        var summary = BuildSummary(breakdown, judgments, ambiguousNoul);

        return new JevValidationResult
        {
            InvestigationId = investigation.Id,
            InvestigationTitle = investigation.Title,
            Profile = weights.ToString(),
            Environment = environment.ToString(),
            DeterministicScore = breakdown.Total,
            DeterministicBreakdown = breakdown,
            Judgments = judgments,
            JevAverageConfidence = Math.Round(avgConf, 3),
            IsConsistent = !ambiguousNoul,
            Summary = summary
        };
    }

    private static string BuildSummary(
        CriterionBreakdown breakdown,
        IReadOnlyList<JevCriterionJudgment> judgments,
        bool ambiguous)
    {
        var lines = new List<string>
        {
            $"Deterministic score: {breakdown.Total:F3} (0-10 scale)",
            $"C1 Proximity: {breakdown.C1Proximidade:F3} | C2 MOC margin: {breakdown.C2MargemMoc:F3}",
            $"C3 Kinetics: {breakdown.C3Cinetica:F3} | C4 Thermal: {breakdown.C4SeveridadeTermica:F3} | C5 Toxicity: {breakdown.C5Toxicidade:F3}"
        };

        foreach (var j in judgments)
        {
            if (j.Noul.HasValue)
                lines.Add($"Jev {j.Criterion}: {j.Noul.Value:P0} - {j.Question}");
            else if (j.Score.HasValue)
                lines.Add($"Jev {j.Criterion}: {j.Score.Value:F2}/4 confidence={j.Confidence:P0} - {j.Question}");
        }

        lines.Add(ambiguous
            ? "Consistency: AMBIGUOUS - some Jev judgments fell in the 0.3-0.7 zone; review before trusting."
            : "Consistency: OK - Jev judgments are decisive (near 0 or 1).");

        return string.Join(" | ", lines);
    }
}
