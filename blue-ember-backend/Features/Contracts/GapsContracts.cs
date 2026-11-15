namespace BlueEmber.Api.Features.Contracts;

public sealed record MissionTargetsDto(
    double O2Percent,
    double PressureKpa,
    double FlowCms);

public sealed record CoverageCellDto(
    double O2Min,
    double O2Max,
    double PressureMinKpa,
    double PressureMaxKpa,
    int CoverageCount,
    IReadOnlyList<string> InvestigationIds);

public sealed record GapsResponse(
    string Environment,
    MissionTargetsDto Targets,
    string PartialGravityWarning,
    IReadOnlyList<string> NearTargetInvestigationIds,
    IReadOnlyList<CoverageCellDto> CoverageCells,
    int FeaturedCount);
