using BlueEmber.Api.Domain.Environments;
using BlueEmber.Api.Domain.Profiles;
using BlueEmber.Api.Infrastructure.Jev;

namespace BlueEmber.Api.Domain.Scoring;

public sealed class JevCriterionJudgment
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

    public double JevAverageConfidence { get; set; }
    public bool IsConsistent { get; set; } // true se não há julgamento ambíguo (0.3-0.7) em Noul crítico

    public string Summary { get; set; } = "";
}
