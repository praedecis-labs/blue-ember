using BlueEmber.Api.Domain.Environments;
using BlueEmber.Api.Domain.Investigations;
using BlueEmber.Api.Domain.Profiles;
using BlueEmber.Api.Domain.Scoring;
using BlueEmber.Api.Features.Investigations;
using BlueEmber.Api.Infrastructure.Data;

namespace BlueEmber.Api.Features.Ranking;

public static class RankingEndpoints
{
    public static IEndpointRouteBuilder MapRankingEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapGet("/api/profiles", () => Results.Ok(new { items = UserProfileCatalog.List() }))
            .WithName("ListProfiles")
            .WithTags("Profiles")
            .WithOpenApi();

        app.MapGet("/api/environments", () => Results.Ok(new { items = MissionEnvironmentCatalog.List() }))
            .WithName("ListEnvironments")
            .WithTags("Environments")
            .WithOpenApi();

        app.MapGet("/api/ranking", (
            IInvestigationRepository repo,
            ScoreCalculator calculator,
            string? profile,
            string? environment,
            string? category,
            bool? featured,
            double? w1,
            double? w2,
            double? w3,
            double? w4,
            double? w5) =>
            BuildRanking(repo, calculator, profile, environment, category, FeaturedFilter.RestrictToFireSafety(featured), w1, w2, w3, w4, w5))
        .WithName("GetRanking")
        .WithTags("Ranking")
        .WithOpenApi();

        app.MapGet("/api/ranking/fire-safety", (
            IInvestigationRepository repo,
            ScoreCalculator calculator,
            string? profile,
            string? environment,
            string? category,
            double? w1,
            double? w2,
            double? w3,
            double? w4,
            double? w5) =>
            BuildRanking(repo, calculator, profile, environment, category, featuredOnly: true, w1, w2, w3, w4, w5))
        .WithName("GetFireSafetyRanking")
        .WithTags("Ranking")
        .WithOpenApi();

        return app;
    }

    private static IResult BuildRanking(
        IInvestigationRepository repo,
        ScoreCalculator calculator,
        string? profile,
        string? environment,
        string? category,
        bool featuredOnly,
        double? w1,
        double? w2,
        double? w3,
        double? w4,
        double? w5)
    {
        if (!UserProfileCatalog.TryParse(profile, out var userProfile))
            return Results.BadRequest(new { error = "Invalid profile. Use Student, Researcher, or ShipEngineer." });

        if (!MissionEnvironmentCatalog.TryParse(environment, out var missionEnv))
            return Results.BadRequest(new { error = "Invalid environment. Use Iss, Moon, or Mars." });

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
                return new
                {
                    score = breakdown.Total,
                    criteria = new
                    {
                        c1Proximidade = breakdown.C1Proximidade,
                        c2MargemMoc = breakdown.C2MargemMoc,
                        c3Cinetica = breakdown.C3Cinetica,
                        c4SeveridadeTermica = breakdown.C4SeveridadeTermica,
                        c5Toxicidade = breakdown.C5Toxicidade
                    },
                    investigation = InvestigationDtos.ToSummary(inv)
                };
            })
            .OrderByDescending(x => x.score)
            .Select((x, index) => new
            {
                rank = index + 1,
                x.score,
                x.criteria,
                x.investigation
            })
            .ToList();

        return Results.Ok(new
        {
            profile = userProfile.ToString(),
            environment = missionEnv.ToString(),
            featured = featuredOnly,
            weights = new { w1 = weights.W1, w2 = weights.W2, w3 = weights.W3, w4 = weights.W4, w5 = weights.W5 },
            count = ranked.Count,
            items = ranked
        });
    }
}
