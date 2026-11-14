using System.Globalization;
using System.Text;
using BlueEmber.Api.Domain.Environments;
using BlueEmber.Api.Domain.Investigations;
using BlueEmber.Api.Domain.Profiles;
using BlueEmber.Api.Domain.Scoring;
using BlueEmber.Api.Infrastructure.Data;

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
                return Results.BadRequest(new { error = "Invalid profile." });
            if (!MissionEnvironmentCatalog.TryParse(environment, out var missionEnv))
                return Results.BadRequest(new { error = "Invalid environment." });

            var weights = ScoreWeights.For(userProfile);
            var featuredOnly = FeaturedFilter.RestrictToFireSafety(featured);
            IEnumerable<Domain.Investigations.Investigation> query = repo.GetAll();
            if (featuredOnly)
                query = query.Where(i => i.IsFeaturedFireSafety);
            if (!string.IsNullOrWhiteSpace(category))
                query = query.Where(i => i.Category.Equals(category, StringComparison.OrdinalIgnoreCase));

            var rows = query
                .Select(inv =>
                {
                    var b = calculator.Calculate(inv, missionEnv, weights);
                    return new ExportRow(
                        inv.Id,
                        inv.Acronym,
                        inv.Title,
                        inv.Category,
                        b.Total,
                        b.C1Proximidade,
                        b.C2MargemMoc,
                        b.C3Cinetica,
                        b.C4SeveridadeTermica,
                        b.C5Toxicidade,
                        inv.NasaPsiUrl,
                        inv.Doi);
                })
                .OrderByDescending(r => r.Score)
                .ToList();

            var fmt = (format ?? "json").Trim().ToLowerInvariant();
            if (fmt == "csv")
            {
                var csv = ToCsv(rows);
                return Results.File(
                    Encoding.UTF8.GetBytes(csv),
                    "text/csv",
                    $"blue-ember-ranking-{userProfile}-{missionEnv}.csv");
            }

            return Results.Ok(new
            {
                profile = userProfile.ToString(),
                environment = missionEnv.ToString(),
                featured = featuredOnly,
                count = rows.Count,
                items = rows
            });
        })
        .WithName("ExportRanking")
        .WithTags("Export")
        .WithOpenApi();

        return app;
    }

    private sealed record ExportRow(
        string Id,
        string Acronym,
        string Title,
        string Category,
        double Score,
        double C1,
        double C2,
        double C3,
        double C4,
        double C5,
        string NasaPsiUrl,
        string Doi);

    private static string ToCsv(IReadOnlyList<ExportRow> rows)
    {
        var sb = new StringBuilder();
        sb.AppendLine("id,acronym,title,category,score,c1,c2,c3,c4,c5,nasa_psi_url,doi");
        foreach (var r in rows)
        {
            sb.Append(Escape(r.Id)).Append(',')
                .Append(Escape(r.Acronym)).Append(',')
                .Append(Escape(r.Title)).Append(',')
                .Append(Escape(r.Category)).Append(',')
                .Append(r.Score.ToString(CultureInfo.InvariantCulture)).Append(',')
                .Append(r.C1.ToString(CultureInfo.InvariantCulture)).Append(',')
                .Append(r.C2.ToString(CultureInfo.InvariantCulture)).Append(',')
                .Append(r.C3.ToString(CultureInfo.InvariantCulture)).Append(',')
                .Append(r.C4.ToString(CultureInfo.InvariantCulture)).Append(',')
                .Append(r.C5.ToString(CultureInfo.InvariantCulture)).Append(',')
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
}
