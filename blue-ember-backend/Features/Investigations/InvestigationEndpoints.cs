using BlueEmber.Api.Domain.Investigations;
using BlueEmber.Api.Features.Contracts;
using BlueEmber.Api.Infrastructure.Data;
using Microsoft.OpenApi.Models;

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
            var featuredOnly = FeaturedFilter.RestrictToFireSafety(featured);
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

            if (featuredOnly)
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
            return Results.Ok(new InvestigationListResponse(featuredOnly, items.Count, items));
        })
        .WithName("ListInvestigations")
        .Produces<InvestigationListResponse>(StatusCodes.Status200OK)
        .WithOpenApi(op =>
        {
            op.Summary = "Lista investigações (summary). Default: fire-safety featured; featured=false = catálogo completo.";
            DescribeQuery(op, "q", "Opcional. Busca em id, acronym, title, objectives.");
            DescribeQuery(op, "category", "Opcional. prevencao | deteccao | supressao | outro.");
            DescribeQuery(op, "featured", "Opcional. Default true (só fire-safety). Use false para o catálogo completo.");
            DescribeQuery(op, "o2Min", "Opcional. Filtro mínimo de O2 (%).");
            DescribeQuery(op, "o2Max", "Opcional. Filtro máximo de O2 (%).");
            DescribeQuery(op, "pressureMin", "Opcional. Filtro mínimo de pressão (kPa).");
            DescribeQuery(op, "pressureMax", "Opcional. Filtro máximo de pressão (kPa).");
            return op;
        });

        group.MapGet("/compare", (IInvestigationRepository repo, string ids) =>
        {
            var idList = ids.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .ToList();

            if (idList.Count is < 2 or > 3)
                return Results.BadRequest(new ErrorResponse(
                    "Provide 2 or 3 investigation ids via ?ids=PSI-a,PSI-b"));

            var found = idList
                .Select(id => repo.GetById(id))
                .Where(x => x is not null)
                .Select(x => InvestigationDtos.ToDetail(x!))
                .ToList();

            if (found.Count != idList.Count)
            {
                var missing = idList.Where(id => repo.GetById(id) is null).ToList();
                return Results.NotFound(new ErrorResponse(
                    "Some investigations were not found", missing));
            }

            return Results.Ok(new CompareResponse(found.Count, found));
        })
        .WithName("CompareInvestigations")
        .Produces<CompareResponse>(StatusCodes.Status200OK)
        .Produces<ErrorResponse>(StatusCodes.Status400BadRequest)
        .Produces<ErrorResponse>(StatusCodes.Status404NotFound)
        .WithOpenApi(op =>
        {
            op.Summary = "Compara 2 ou 3 fichas completas.";
            DescribeQuery(op, "ids", "Obrigatório. IDs separados por vírgula (2 ou 3), ex.: PSI-99,PSI-100.");
            return op;
        });

        group.MapGet("/{id}", (IInvestigationRepository repo, string id) =>
        {
            var inv = repo.GetById(id);
            return inv is null
                ? Results.NotFound(new ErrorResponse($"Investigation '{id}' not found"))
                : Results.Ok(InvestigationDtos.ToDetail(inv));
        })
        .WithName("GetInvestigation")
        .Produces<InvestigationDetailDto>(StatusCodes.Status200OK)
        .Produces<ErrorResponse>(StatusCodes.Status404NotFound)
        .WithOpenApi(op =>
        {
            op.Summary = "Ficha completa de uma investigação.";
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
