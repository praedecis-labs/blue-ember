using BlueEmber.Api.Domain.Investigations;
using BlueEmber.Api.Features.Contracts;
using BlueEmber.Api.Infrastructure.Data;

namespace BlueEmber.Api.Features.Investigations;

public sealed class InvestigationQueryService(IInvestigationRepository repo)
{
    public InvestigationListResponse Search(
        string? q,
        string? category,
        bool? featured,
        double? o2Min,
        double? o2Max,
        double? pressureMin,
        double? pressureMax,
        int limit = 12)
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

        var items = query.Select(InvestigationDtos.ToSummary).Take(Math.Clamp(limit, 1, 30)).ToList();
        return new InvestigationListResponse(featuredOnly, items.Count, items);
    }

    public InvestigationDetailDto? GetById(string id)
    {
        var inv = repo.GetById(id);
        return inv is null ? null : InvestigationDtos.ToDetail(inv);
    }
}
