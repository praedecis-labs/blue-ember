using BlueEmber.Api.Infrastructure.Data;

namespace BlueEmber.Api.Features.Investigations;

public static class InvestigationEndpoints
{
    public static IEndpointRouteBuilder MapInvestigationEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/investigations").WithTags("Investigations");

        group.MapGet("/", (
            IInvestigationRepository repo,
            string? q,
            string? category,
            bool? featured,
            double? o2Min,
            double? o2Max,
            double? pressureMin,
            double? pressureMax) =>
        {
            IEnumerable<Domain.Investigations.Investigation> query = repo.GetAll();

            if (!string.IsNullOrWhiteSpace(q))
            {
                var term = q.Trim();
                query = query.Where(i =>
                    i.Id.Contains(term, StringComparison.OrdinalIgnoreCase) ||
                    i.Acronym.Contains(term, StringComparison.OrdinalIgnoreCase) ||
                    i.Title.Contains(term, StringComparison.OrdinalIgnoreCase) ||
                    i.Objectives.Contains(term, StringComparison.OrdinalIgnoreCase));
            }

            if (!string.IsNullOrWhiteSpace(category))
                query = query.Where(i => i.Category.Equals(category, StringComparison.OrdinalIgnoreCase));

            if (featured is true)
                query = query.Where(i => i.IsFeaturedFireSafety);

            if (o2Min is not null)
                query = query.Where(i => i.O2Range.Count == 0 || i.O2Range.Max() >= o2Min);
            if (o2Max is not null)
                query = query.Where(i => i.O2Range.Count == 0 || i.O2Range.Min() <= o2Max);
            if (pressureMin is not null)
                query = query.Where(i => i.PressureKpa.Count == 0 || i.PressureKpa.Max() >= pressureMin);
            if (pressureMax is not null)
                query = query.Where(i => i.PressureKpa.Count == 0 || i.PressureKpa.Min() <= pressureMax);

            var items = query.Select(InvestigationDtos.ToSummary).ToList();
            return Results.Ok(new { count = items.Count, items });
        })
        .WithName("ListInvestigations")
        .WithOpenApi();

        group.MapGet("/compare", (IInvestigationRepository repo, string ids) =>
        {
            var idList = ids.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .ToList();

            if (idList.Count is < 2 or > 3)
                return Results.BadRequest(new { error = "Provide 2 or 3 investigation ids via ?ids=PSI-a,PSI-b" });

            var found = idList
                .Select(id => repo.GetById(id))
                .Where(x => x is not null)
                .Select(x => InvestigationDtos.ToDto(x!))
                .ToList();

            if (found.Count != idList.Count)
            {
                var missing = idList.Where(id => repo.GetById(id) is null).ToList();
                return Results.NotFound(new { error = "Some investigations were not found", missing });
            }

            return Results.Ok(new { count = found.Count, items = found });
        })
        .WithName("CompareInvestigations")
        .WithOpenApi();

        group.MapGet("/{id}", (IInvestigationRepository repo, string id) =>
        {
            var inv = repo.GetById(id);
            return inv is null
                ? Results.NotFound(new { error = $"Investigation '{id}' not found" })
                : Results.Ok(InvestigationDtos.ToDto(inv));
        })
        .WithName("GetInvestigation")
        .WithOpenApi();

        return app;
    }
}
