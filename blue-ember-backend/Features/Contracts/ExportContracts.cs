namespace BlueEmber.Api.Features.Contracts;

public sealed record ExportItemDto(
    string Id,
    string Acronym,
    string Title,
    string Category,
    double Score,
    ScoreCriteriaDto Criteria,
    string NasaPsiUrl,
    string Doi);

public sealed record ExportResponse(
    string Profile,
    string Environment,
    ScoreWeightsDto Weights,
    int Count,
    IReadOnlyList<ExportItemDto> Items);
