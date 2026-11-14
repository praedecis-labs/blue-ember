using System.Globalization;
using System.Text;
using BlueEmber.Api.Domain.Environments;
using BlueEmber.Api.Domain.Investigations;
using BlueEmber.Api.Domain.Profiles;
using BlueEmber.Api.Domain.Scoring;
using BlueEmber.Api.Features.Contracts;
using BlueEmber.Api.Infrastructure.Data;
using Microsoft.OpenApi.Models;

namespace BlueEmber.Api.Features.Export;

public static class ExportEndpoints
{
    public static IEndpointRouteBuilder MapExportEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapGet("/api/export", (
            IInvestigationRepository repo,
            ScoreCalculator calculator,
            string? format,
            string? profile,
            string? environment,
            string? category,
            bool? featured) =>
        {
            if (!UserProfileCatalog.TryParse(profile, out var userProfile))
                return Results.BadRequest(new ErrorResponse("Invalid profile."));
            if (!MissionEnvironmentCatalog.TryParse(environment, out var missionEnv))
                return Results.BadRequest(new ErrorResponse("Invalid environment."));

            var weights = ScoreWeights.For(userProfile);
            var featuredOnly = FeaturedFilter.RestrictToFireSafety(featured);
            IEnumerable<Domain.Investigations.Investigation> query = repo.GetAll();
            if (featuredOnly)
                query = query.Where(i => i.IsFeaturedFireSafety);
            if (!string.IsNullOrWhiteSpace(category))
                query = query.Where(i => i.Category.Equals(category, StringComparison.OrdinalIgnoreCase));

            var items = query
                .Select(inv =>
                {
                    var b = calculator.Calculate(inv, missionEnv, weights);
                    return new ExportItemDto(
                        inv.Id,
                        inv.Acronym,
                        inv.Title,
                        inv.Category,
                        b.Total,
                        ScoreCriteriaDto.From(b),
                        inv.NasaPsiUrl,
                        inv.Doi);
                })
                .OrderByDescending(r => r.Score)
                .ToList();

            var fmt = (format ?? "json").Trim().ToLowerInvariant();
            if (fmt == "csv")
            {
                var csv = ToCsv(items);
                return Results.File(
                    Encoding.UTF8.GetBytes(csv),
                    "text/csv",
                    $"blue-ember-ranking-{userProfile}-{missionEnv}.csv");
            }

            return Results.Ok(new ExportResponse(
                userProfile.ToString(),
                missionEnv.ToString(),
                featuredOnly,
                ScoreWeightsDto.From(weights),
                items.Count,
                items));
        })
        .WithName("ExportRanking")
        .WithTags("Export")
        .Produces<ExportResponse>(StatusCodes.Status200OK)
        .Produces<ErrorResponse>(StatusCodes.Status400BadRequest)
        .WithOpenApi(op =>
        {
            op.Summary = "Exporta ranking em JSON (criteria nomeados) ou CSV (colunas c1–c5). Default: fire-safety featured.";
            DescribeQuery(op, "format", "Opcional. Default: json. Valores: json | csv.");
            DescribeQuery(op, "profile", "Opcional. Default: Student. Valores: Student, Researcher, ShipEngineer.");
            DescribeQuery(op, "environment", "Opcional. Default: Moon. Valores: Iss, Moon, Mars.");
            DescribeQuery(op, "category", "Opcional. prevencao | deteccao | supressao | outro.");
            DescribeQuery(op, "featured", "Opcional. Default true (só fire-safety). Use false para o catálogo completo.");
            return op;
        });

        return app;
    }

    private static string ToCsv(IReadOnlyList<ExportItemDto> rows)
    {
        var sb = new StringBuilder();
        // CSV keeps short headers; JSON uses criteria.c1Proximidade… (see RELATORIO)
        sb.AppendLine("id,acronym,title,category,score,c1,c2,c3,c4,c5,nasa_psi_url,doi");
        foreach (var r in rows)
        {
            sb.Append(Escape(r.Id)).Append(',')
                .Append(Escape(r.Acronym)).Append(',')
                .Append(Escape(r.Title)).Append(',')
                .Append(Escape(r.Category)).Append(',')
                .Append(r.Score.ToString(CultureInfo.InvariantCulture)).Append(',')
                .Append(r.Criteria.C1Proximidade.ToString(CultureInfo.InvariantCulture)).Append(',')
                .Append(r.Criteria.C2MargemMoc.ToString(CultureInfo.InvariantCulture)).Append(',')
                .Append(r.Criteria.C3Cinetica.ToString(CultureInfo.InvariantCulture)).Append(',')
                .Append(r.Criteria.C4SeveridadeTermica.ToString(CultureInfo.InvariantCulture)).Append(',')
                .Append(r.Criteria.C5Toxicidade.ToString(CultureInfo.InvariantCulture)).Append(',')
                .Append(Escape(r.NasaPsiUrl)).Append(',')
                .Append(Escape(r.Doi))
                .AppendLine();
        }
        return sb.ToString();
    }

    private static string Escape(string value)
    {
        if (value.Contains('"') || value.Contains(',') || value.Contains('\n'))
            return $"\"{value.Replace("\"", "\"\"")}\"";
        return value;
    }

    private static void DescribeQuery(OpenApiOperation op, string name, string description)
    {
        var param = op.Parameters?.FirstOrDefault(p => p.Name == name);
        if (param is not null)
            param.Description = description;
    }
}
