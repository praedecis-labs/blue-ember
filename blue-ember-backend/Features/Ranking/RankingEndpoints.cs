using BlueEmber.Api.Domain.Environments;
using BlueEmber.Api.Domain.Profiles;
using BlueEmber.Api.Domain.Scoring;
using BlueEmber.Api.Features.Contracts;
using BlueEmber.Api.Features.Investigations;
using BlueEmber.Api.Infrastructure.Data;
using Microsoft.OpenApi.Models;

namespace BlueEmber.Api.Features.Ranking;

public static class RankingEndpoints
{
    public static IEndpointRouteBuilder MapRankingEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapGet("/api/profiles", () =>
            {
                var items = UserProfileCatalog.List()
                    .Select(p => new ProfileDto(p.Id, p.Label, ScoreWeightsDto.From(p.Weights)))
                    .ToList();
                return Results.Ok(new ProfileListResponse(items));
            })
            .WithName("ListProfiles")
            .WithTags("Profiles")
            .Produces<ProfileListResponse>(StatusCodes.Status200OK)
            .WithOpenApi(op =>
            {
                op.Summary = "Lista perfis mock e pesos padrão (w1–w5).";
                return op;
            });

        app.MapGet("/api/environments", () =>
            {
                var items = MissionEnvironmentCatalog.List()
                    .Select(e => new EnvironmentDto(
                        e.Id, e.Label, e.TargetO2Percent, e.TargetPressureKpa, e.TargetFlowCms))
                    .ToList();
                return Results.Ok(new EnvironmentListResponse(items));
            })
            .WithName("ListEnvironments")
            .WithTags("Environments")
            .Produces<EnvironmentListResponse>(StatusCodes.Status200OK)
            .WithOpenApi(op =>
            {
                op.Summary = "Lista ambientes de missão e alvos de O2 / pressão / fluxo.";
                return op;
            });

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
        {
            if (!UserProfileCatalog.TryParse(profile, out var userProfile))
                return Results.BadRequest(new ErrorResponse(
                    "Invalid profile. Use Student, Researcher, or ShipEngineer."));

            if (!MissionEnvironmentCatalog.TryParse(environment, out var missionEnv))
                return Results.BadRequest(new ErrorResponse(
                    "Invalid environment. Use Iss, Moon, or Mars."));

            var weights = ScoreWeights.TryFromOverrides(w1, w2, w3, w4, w5)
                          ?? ScoreWeights.For(userProfile);

            IEnumerable<Domain.Investigations.Investigation> query = repo.GetAll();
            if (featured is true)
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

            return Results.Ok(new RankingResponse(
                userProfile.ToString(),
                missionEnv.ToString(),
                ScoreWeightsDto.From(weights),
                ranked.Count,
                ranked));
        })
        .WithName("GetRanking")
        .WithTags("Ranking")
        .Produces<RankingResponse>(StatusCodes.Status200OK)
        .Produces<ErrorResponse>(StatusCodes.Status400BadRequest)
        .WithOpenApi(op =>
        {
            op.Summary = "Ranking ponderado C1–C5 por perfil e ambiente.";
            DescribeQuery(op, "profile", "Opcional. Default: Student. Valores: Student, Researcher, ShipEngineer.");
            DescribeQuery(op, "environment", "Opcional. Default: Moon. Valores: Iss, Moon, Mars.");
            DescribeQuery(op, "category", "Opcional. Filtro: prevencao | deteccao | supressao | outro.");
            DescribeQuery(op, "featured", "Opcional. Se true, só investigações featured fire-safety.");
            DescribeQuery(op, "w1", "Opcional. Override do peso C1 (se qualquer w* for enviado, slots omitidos = 0.2).");
            DescribeQuery(op, "w2", "Opcional. Override do peso C2.");
            DescribeQuery(op, "w3", "Opcional. Override do peso C3.");
            DescribeQuery(op, "w4", "Opcional. Override do peso C4.");
            DescribeQuery(op, "w5", "Opcional. Override do peso C5.");
            return op;
        });

        return app;
    }

    private static void DescribeQuery(OpenApiOperation op, string name, string description)
    {
        var param = op.Parameters?.FirstOrDefault(p => p.Name == name);
        if (param is not null)
            param.Description = description;
    }
}
