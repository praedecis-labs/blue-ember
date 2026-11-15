using System.Text.Json;
using System.Text.Json.Serialization;
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

public sealed class GeminiGenerateRequest
{
    [JsonPropertyName("system_instruction")]
    public GeminiContent? SystemInstruction { get; set; }

    [JsonPropertyName("contents")]
    public List<GeminiContent> Contents { get; set; } = [];

    [JsonPropertyName("tools")]
    public List<GeminiTool>? Tools { get; set; }
}

public sealed class GeminiContent
{
    [JsonPropertyName("role")]
    public string? Role { get; set; }

    [JsonPropertyName("parts")]
    public List<GeminiPart> Parts { get; set; } = [];
}

public sealed class GeminiPart
{
    [JsonPropertyName("text")]
    public string? Text { get; set; }

    [JsonPropertyName("functionCall")]
    public GeminiFunctionCall? FunctionCall { get; set; }

    [JsonPropertyName("functionResponse")]
    public GeminiFunctionResponse? FunctionResponse { get; set; }

    /// <summary>Required by Gemini 3+ tool calling; must be echoed unchanged.</summary>
    [JsonPropertyName("thoughtSignature")]
    public string? ThoughtSignature { get; set; }

    [JsonExtensionData]
    public Dictionary<string, JsonElement>? ExtensionData { get; set; }
}

public sealed class GeminiFunctionCall
{
    [JsonPropertyName("name")]
    public string Name { get; set; } = "";

    [JsonPropertyName("args")]
    public Dictionary<string, object?>? Args { get; set; }

    [JsonPropertyName("thoughtSignature")]
    public string? ThoughtSignature { get; set; }

    [JsonExtensionData]
    public Dictionary<string, JsonElement>? ExtensionData { get; set; }
}

public sealed class GeminiFunctionResponse
{
    [JsonPropertyName("name")]
    public string Name { get; set; } = "";

    [JsonPropertyName("response")]
    public object Response { get; set; } = new { };
}

public sealed class GeminiTool
{
    [JsonPropertyName("function_declarations")]
    public List<GeminiFunctionDeclaration> FunctionDeclarations { get; set; } = [];
}

public sealed class GeminiFunctionDeclaration
{
    [JsonPropertyName("name")]
    public string Name { get; set; } = "";

    [JsonPropertyName("description")]
    public string Description { get; set; } = "";

    [JsonPropertyName("parameters")]
    public GeminiSchema Parameters { get; set; } = new();
}

public sealed class GeminiSchema
{
    [JsonPropertyName("type")]
    public string Type { get; set; } = "object";

    [JsonPropertyName("properties")]
    public Dictionary<string, GeminiSchemaProperty> Properties { get; set; } = new();

    [JsonPropertyName("required")]
    public List<string>? Required { get; set; }
}

public sealed class GeminiSchemaProperty
{
    [JsonPropertyName("type")]
    public string Type { get; set; } = "string";

    [JsonPropertyName("description")]
    public string? Description { get; set; }
}

public sealed class GeminiGenerateResponse
{
    [JsonPropertyName("candidates")]
    public List<GeminiCandidate>? Candidates { get; set; }

    [JsonPropertyName("error")]
    public GeminiApiError? Error { get; set; }
}

public sealed class GeminiCandidate
{
    [JsonPropertyName("content")]
    public GeminiContent? Content { get; set; }
}

public sealed class GeminiApiError
{
    [JsonPropertyName("message")]
    public string? Message { get; set; }

    [JsonPropertyName("status")]
    public string? Status { get; set; }
}
