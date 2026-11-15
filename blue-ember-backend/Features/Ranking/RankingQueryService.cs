using BlueEmber.Api.Domain.Environments;
using BlueEmber.Api.Domain.Investigations;
using BlueEmber.Api.Domain.Profiles;
using BlueEmber.Api.Domain.Scoring;
using BlueEmber.Api.Features.Contracts;
using BlueEmber.Api.Features.Investigations;
using BlueEmber.Api.Infrastructure.Data;

namespace BlueEmber.Api.Features.Ranking;

public sealed class RankingQueryService(IInvestigationRepository repo, ScoreCalculator calculator)
{
    public bool TryBuild(
        string? profile,
        string? environment,
        string? category,
        bool featuredOnly,
        double? w1,
        double? w2,
        double? w3,
        double? w4,
        double? w5,
        out RankingResponse? response,
        out string? error)
    {
        response = null;
        error = null;

        if (!UserProfileCatalog.TryParse(profile, out var userProfile))
        {
            error = "Invalid profile. Use Student, Researcher, or ShipEngineer.";
            return false;
        }

        if (!MissionEnvironmentCatalog.TryParse(environment, out var missionEnv))
        {
            error = "Invalid environment. Use Iss, Moon, or Mars.";
            return false;
        }

        var weights = ScoreWeights.TryFromOverrides(w1, w2, w3, w4, w5)
                      ?? ScoreWeights.For(userProfile);

        IEnumerable<Domain.Investigations.Investigation> query = repo.GetAll();
        if (featuredOnly)
            query = query.Where(i => i.IsFeaturedFireSafety);
        if (!string.IsNullOrWhiteSpace(category))
            query = query.Where(i => i.Category.Equals(category, StringComparison.OrdinalIgnoreCase));

        var ranked = query
            .Select(inv =>
            {
                var breakdown = calculator.Calculate(inv, missionEnv, weights);
                return (
                    Score: breakdown.Total,
                    Criteria: ScoreCriteriaDto.From(breakdown),
                    Investigation: InvestigationDtos.ToSummary(inv));
            })
            .OrderByDescending(x => x.Score)
            .Select((x, index) => new RankingItemDto(
                index + 1,
                x.Score,
                x.Criteria,
                x.Investigation))
            .ToList();

        response = new RankingResponse(
            userProfile.ToString(),
            missionEnv.ToString(),
            featuredOnly,
            ScoreWeightsDto.From(weights),
            ranked.Count,
            ranked);
        return true;
    }
}
