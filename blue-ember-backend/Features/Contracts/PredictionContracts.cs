namespace BlueEmber.Api.Features.Prediction;

public sealed record PredictionItemDto(
    string InvestigationId,
    string InvestigationTitle,
    string Category,
    string Material,
    string Regime,
    double O2Percent,
    double PressureKpa,
    double FlowSpeedCms,
    double PpO2Kpa,
    double IgnitionProbability,
    string RiskLevel,
    bool AboveFlammabilityLimit,
    double FlammabilityLimitPpO2Kpa,
    string Provenance);

public sealed record PredictionResponseDto(
    int Count,
    int AboveFlammabilityLimitCount,
    int CriticalCount,
    IReadOnlyList<PredictionItemDto> Items);
