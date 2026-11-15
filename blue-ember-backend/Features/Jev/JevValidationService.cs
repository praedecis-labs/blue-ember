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

        // Juiz cego: NÃO envia deterministic_score nem c1…c5 no state.
        // O juiz deve avaliar com base nos dados brutos da investigação e ambiente.
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
            regime = investigation.TestConditions.Count > 0
                ? investigation.TestConditions.FirstOrDefault()?.Regime
                : null,
            pp_o2_kpa = investigation.TestConditions.Count > 0
                ? investigation.TestConditions.FirstOrDefault()?.PpO2Kpa
                : null,
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

        // Acordo por critério: Jev vs determinístico (normalizado para 0-1)
        var agreement = ComputeCriterionAgreement(judgments, breakdown);

        var confidences = judgments.Where(j => j.Confidence.HasValue).Select(j => j.Confidence!.Value).ToList();
        var avgConf = confidences.Count > 0 ? confidences.Average() : 0;

        // Consistência: 3 estados
        // - Ambiguous: algum Noul crítico (C1, C2) na zona ambígua 0.3-0.7 OU confiança média baixa (< 0.5)
        // - Discordant: critérios não concordam (|diff| > 0.25 em maioria)
        // - Concordant: caso contrário
        var ambiguousNoul = judgments
            .Where(j => j.Criterion is "C1" or "C2" && j.Noul.HasValue)
            .Any(j => j.Noul.Value is >= 0.3 and <= 0.7);

        var lowConfidence = avgConf < 0.5;
        var nonAgreeing = agreement.Values.Count(a => !a.Agrees);
        var totalJudged = agreement.Count;

        JevConsistencyState consistencyState;
        if (ambiguousNoul || lowConfidence)
            consistencyState = JevConsistencyState.Ambiguous;
        else if (totalJudged > 0 && nonAgreeing > totalJudged / 2.0)
            consistencyState = JevConsistencyState.Discordant;
        else
            consistencyState = JevConsistencyState.Concordant;

        var summary = BuildSummary(breakdown, judgments, consistencyState, agreement);

        return new JevValidationResult
        {
            InvestigationId = investigation.Id,
            InvestigationTitle = investigation.Title,
            Profile = weights.ToString(),
            Environment = environment.ToString(),
            DeterministicScore = breakdown.Total,
            DeterministicBreakdown = breakdown,
            Judgments = judgments,
            CriterionAgreement = agreement,
            JevAverageConfidence = Math.Round(avgConf, 3),
            ConsistencyState = consistencyState,
            Summary = summary
        };
    }

    private static IReadOnlyDictionary<string, CriterionAgreement> ComputeCriterionAgreement(
        IReadOnlyList<JevCriterionJudgment> judgments,
        CriterionBreakdown breakdown)
    {
        var deterministicByCriterion = new Dictionary<string, double>(StringComparer.OrdinalIgnoreCase)
        {
            ["C1"] = breakdown.C1Proximidade,
            ["C2"] = breakdown.C2MargemMoc,
            ["C3"] = breakdown.C3Cinetica,
            ["C4"] = breakdown.C4SeveridadeTermica,
            ["C5"] = breakdown.C5Toxicidade,
        };

        var result = new Dictionary<string, CriterionAgreement>(StringComparer.OrdinalIgnoreCase);

        foreach (var j in judgments)
        {
            var detValue = deterministicByCriterion.TryGetValue(j.Criterion, out var dv) ? dv : 0.0;

            double? jevValue = null;
            double? normalizedJev = null;

            if (j.Noul.HasValue)
            {
                jevValue = j.Noul.Value;
                normalizedJev = j.Noul.Value; // noul já está em 0-1
            }
            else if (j.Score.HasValue)
            {
                jevValue = j.Score.Value;
                normalizedJev = j.Score.Value / 4.0; // score 0-4 → 0-1
            }

            var agreement = new CriterionAgreement
            {
                Criterion = j.Criterion,
                JevValue = jevValue,
                DeterministicValue = detValue,
                NormalizedJev = normalizedJev,
            };

            if (normalizedJev.HasValue)
            {
                agreement.Difference = Math.Abs(normalizedJev.Value - detValue);
                agreement.Agrees = agreement.Difference <= 0.25;
            }

            result[j.Criterion] = agreement;
        }

        return result;
    }

    private static string BuildSummary(
        CriterionBreakdown breakdown,
        IReadOnlyList<JevCriterionJudgment> judgments,
        JevConsistencyState consistency,
        IReadOnlyDictionary<string, CriterionAgreement> agreement)
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

        foreach (var kv in agreement)
        {
            var a = kv.Value;
            lines.Add($"Agreement {a.Criterion}: Jev={a.NormalizedJev:P0} vs Det={a.DeterministicValue:P0} diff={a.Difference:P0} {(a.Agrees ? "OK" : "DISCORDANT")}");
        }

        lines.Add(consistency switch
        {
            JevConsistencyState.Ambiguous => "Consistency: AMBIGUOUS - Jev in 0.3-0.7 zone or low confidence; review before trusting.",
            JevConsistencyState.Discordant => "Consistency: DISCORDANT - Jev disagrees with deterministic on majority of criteria.",
            _ => "Consistency: CONCORDANT - Jev judgments align with deterministic breakdown.",
        });

        return string.Join(" | ", lines);
    }
}
