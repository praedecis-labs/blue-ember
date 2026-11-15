using System.Text.Json.Serialization;

namespace BlueEmber.Api.Features.Agent;

/// <summary>
/// Declaração de tool neutra (JSON Schema subset). O formato serializado é
/// compatível com function calling do Gemini; outros provedores podem
/// traduzir estes specs para o próprio schema.
/// </summary>
public sealed class AgentToolDeclaration
{
    [JsonPropertyName("name")]
    public string Name { get; set; } = "";

    [JsonPropertyName("description")]
    public string Description { get; set; } = "";

    [JsonPropertyName("parameters")]
    public AgentToolSchema Parameters { get; set; } = new();
}

public sealed class AgentToolSchema
{
    [JsonPropertyName("type")]
    public string Type { get; set; } = "object";

    [JsonPropertyName("properties")]
    public Dictionary<string, AgentToolSchemaProperty> Properties { get; set; } = new();

    [JsonPropertyName("required")]
    public List<string>? Required { get; set; }
}

public sealed class AgentToolSchemaProperty
{
    [JsonPropertyName("type")]
    public string Type { get; set; } = "string";

    [JsonPropertyName("description")]
    public string? Description { get; set; }
}
