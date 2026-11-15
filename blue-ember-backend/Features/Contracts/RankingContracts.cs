namespace BlueEmber.Api.Features.Contracts;

using BlueEmber.Api.Domain.Scoring;

public sealed record WinningConditionDto(
    int Index,
    string? Material,
    double? O2Percent,
    double? PressureKpa,
    double? FlowSpeedCms,
    double? PpO2Kpa,
    string Provenance,
    string? Regime);

public sealed record AggregationDto(
    double Best,
    double Worst,
    double Average,
    double Coverage,
    int ConditionCount,
    int BestConditionIndex,
    int WorstConditionIndex,
    double? BestPpO2Kpa,
    double? WorstPpO2Kpa);

public sealed record RankingItemDto(
    int Rank,
    double Score,
    ScoreCriteriaDto Criteria,
    InvestigationSummaryDto Investigation,
    WinningConditionDto? WinningCondition = null,
    AggregationDto? Aggregation = null,
    JevConsistencyState? JevConsistency = null);

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
