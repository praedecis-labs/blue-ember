namespace BlueEmber.Api.Domain.Scoring;

public enum JevConsistencyState
{
    /// <summary>Jev e determinístico concordam (ambos decisivos e na mesma direção).</summary>
    Concordant,
    /// <summary>Jev e determinístico discordam significativamente.</summary>
    Discordant,
    /// <summary>Jev está na zona ambígua (0.3-0.7) ou confiança baixa — revisar antes de confiar.</summary>
    Ambiguous,
}

public sealed record CriterionAgreement
{
    public string Criterion { get; set; } = ""; // C1..C5
    public double? JevValue { get; set; }       // noul (0-1) ou score (0-4)
    public double? DeterministicValue { get; set; } // 0-1 (normalizado)
    public double? NormalizedJev { get; set; }  // 0-1, para comparação direta
    public double Difference { get; set; }
    public bool Agrees { get; set; }            // |diff| <= 0.25 (limiar de concordância)
}

public sealed record JevCriterionJudgment
{
    public string Criterion { get; set; } = ""; // C1..C5
    public string Question { get; set; } = "";
    public double? Noul { get; set; }
    public double? Score { get; set; }
    public double? Confidence { get; set; }
    public string? SelectedChoice { get; set; }
}

public sealed class JevValidationResult
{
    public string InvestigationId { get; set; } = "";
    public string InvestigationTitle { get; set; } = "";
    public string Profile { get; set; } = "";
    public string Environment { get; set; } = "";

    public double DeterministicScore { get; set; }
    public CriterionBreakdown DeterministicBreakdown { get; set; } = new(0, 0, 0, 0, 0, 0);

    public IReadOnlyList<JevCriterionJudgment> Judgments { get; set; } = [];
    public IReadOnlyDictionary<string, CriterionAgreement> CriterionAgreement { get; set; } =
        new Dictionary<string, CriterionAgreement>();

    public double JevAverageConfidence { get; set; }
    public JevConsistencyState ConsistencyState { get; set; }

    /// <summary>Compatibilidade: true quando não é Discordant.</summary>
    public bool IsConsistent => ConsistencyState != JevConsistencyState.Discordant;

    public string Summary { get; set; } = "";
}
