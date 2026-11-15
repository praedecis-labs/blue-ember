using BlueEmber.Api.Features.Contracts;

namespace BlueEmber.Api.Features.Agent;

public sealed record AgentAskRequest(
    string Message,
    string? Profile,
    string? Environment,
    string? Category,
    AgentQueryStateDto? Query,
    IReadOnlyList<AgentHistoryTurnDto>? History,
    string? Locale = null);

public sealed record AgentQueryStateDto(
    string? Env,
    string? Material,
    double? O2,
    double? Psi,
    double? Flow,
    string? Goal,
    string? Claim);

public sealed record AgentHistoryTurnDto(string Role, string Text);

public sealed record AgentAskResponse(
    string Text,
    RankingResponse? Ranking,
    GapsResponse? Gaps,
    IReadOnlyList<string> ToolsUsed,
    DashboardSpec? Dashboard);
