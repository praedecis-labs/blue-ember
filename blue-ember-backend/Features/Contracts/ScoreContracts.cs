using BlueEmber.Api.Domain.Profiles;
using BlueEmber.Api.Domain.Scoring;

namespace BlueEmber.Api.Features.Contracts;

public sealed record ScoreWeightsDto(double W1, double W2, double W3, double W4, double W5)
{
    public static ScoreWeightsDto From(ScoreWeights weights) =>
        new(weights.W1, weights.W2, weights.W3, weights.W4, weights.W5);
}

public sealed record ScoreCriteriaDto(
    double C1Proximidade,
    double C2MargemMoc,
    double C3Cinetica,
    double C4SeveridadeTermica,
    double C5Toxicidade)
{
    public static ScoreCriteriaDto From(CriterionBreakdown breakdown) =>
        new(
            breakdown.C1Proximidade,
            breakdown.C2MargemMoc,
            breakdown.C3Cinetica,
            breakdown.C4SeveridadeTermica,
            breakdown.C5Toxicidade);
}
