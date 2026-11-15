namespace BlueEmber.Api.Features.Contracts;

public sealed record RankingItemDto(
    int Rank,
    double Score,
    ScoreCriteriaDto Criteria,
    InvestigationSummaryDto Investigation);

public sealed record RankingResponse(
    string Profile,
    string Environment,
    bool Featured,
    ScoreWeightsDto Weights,
    int Count,
    IReadOnlyList<RankingItemDto> Items);

public sealed record ProfileDto(string Id, string Label, ScoreWeightsDto Weights);

public sealed record ProfileListResponse(IReadOnlyList<ProfileDto> Items);

public sealed record EnvironmentDto(
    string Id,
    string Label,
    double TargetO2Percent,
    double TargetPressureKpa,
    double TargetFlowCms);

public sealed record EnvironmentListResponse(IReadOnlyList<EnvironmentDto> Items);
