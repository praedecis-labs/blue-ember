namespace BlueEmber.Api.Features.Contracts;

public sealed record InvestigationSummaryDto(
    string Id,
    string Acronym,
    string Title,
    string Category,
    string Platform,
    IReadOnlyList<double> O2Range,
    IReadOnlyList<double> PressureKpa,
    bool IsFeaturedFireSafety,
    string NasaPsiUrl);

public sealed record InvestigationDetailDto(
    string Id,
    string Acronym,
    string Title,
    string Platform,
    string Hardware,
    string HardwareLink,
    string Discipline,
    string SubDiscipline,
    string Category,
    string Objectives,
    string Approach,
    string Hypothesis,
    string EarthBenefits,
    IReadOnlyList<string> Materials,
    string Geometry,
    IReadOnlyList<double> O2Range,
    IReadOnlyList<double> PressureKpa,
    IReadOnlyList<double> FlowSpeedCms,
    double FlameSpreadRateMms,
    double MocPercent,
    double HrrKw,
    double CoPpm,
    IReadOnlyList<string> RelevanceHabitat,
    bool IsFeaturedFireSafety,
    string NasaPsiUrl,
    string Doi);

public sealed record InvestigationListResponse(
    bool Featured,
    int Count,
    IReadOnlyList<InvestigationSummaryDto> Items);

public sealed record CompareResponse(
    int Count,
    IReadOnlyList<InvestigationDetailDto> Items);
