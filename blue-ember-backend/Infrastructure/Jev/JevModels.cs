using System.Text.Json;
using System.Text.Json.Serialization;

namespace BlueEmber.Api.Infrastructure.Jev;

public sealed class JevRequest
{
    [JsonPropertyName("model")]
    public string Model { get; set; } = "";

    [JsonPropertyName("state")]
    public object State { get; set; } = new();

    [JsonPropertyName("questions")]
    public Dictionary<string, JevQuestion> Questions { get; set; } = new(StringComparer.OrdinalIgnoreCase);
}

public sealed class JevQuestion
{
    [JsonPropertyName("type")]
    public string Type { get; set; } = "noul"; // noul | choice | score

    /// <summary>A API aceita string | object | array; mantemos object para não descartar payloads válidos.</summary>
    [JsonPropertyName("instructions")]
    public object? Instructions { get; set; }

    [JsonPropertyName("criteria")]
    public object? Criteria { get; set; }
}

public sealed class JevResponse
{
    [JsonPropertyName("model")]
    public string Model { get; set; } = "";

    [JsonPropertyName("answers")]
    public Dictionary<string, JevAnswer> Answers { get; set; } = new(StringComparer.OrdinalIgnoreCase);

    [JsonPropertyName("usage")]
    public JevUsage Usage { get; set; } = new();
}

[JsonConverter(typeof(JevAnswerConverter))]
public abstract class JevAnswer
{
    [JsonPropertyName("type")]
    public string Type { get; set; } = "";
}

public sealed class NoulAnswer : JevAnswer
{
    [JsonPropertyName("noul")]
    public double Noul { get; set; }
}

public sealed class ChoiceAnswer : JevAnswer
{
    [JsonPropertyName("choice")]
    public string Choice { get; set; } = "";

    [JsonPropertyName("confidence")]
    public double Confidence { get; set; }

    [JsonPropertyName("probabilities")]
    public Dictionary<string, double> Probabilities { get; set; } = new(StringComparer.OrdinalIgnoreCase);
}

public sealed class ScoreAnswer : JevAnswer
{
    [JsonPropertyName("score")]
    public double Score { get; set; }

    [JsonPropertyName("confidence")]
    public double Confidence { get; set; }

    [JsonPropertyName("legend")]
    public Dictionary<string, string> Legend { get; set; } = new(StringComparer.OrdinalIgnoreCase);

    [JsonPropertyName("probabilities")]
    public Dictionary<string, double> Probabilities { get; set; } = new(StringComparer.OrdinalIgnoreCase);
}

public sealed class JevUsage
{
    [JsonPropertyName("input_tokens")]
    public int InputTokens { get; set; }

    [JsonPropertyName("output_tokens")]
    public int OutputTokens { get; set; }
}

public sealed class JevAnswerConverter : JsonConverter<JevAnswer>
{
    public override JevAnswer Read(
        ref Utf8JsonReader reader,
        Type typeToConvert,
        JsonSerializerOptions options)
    {
        if (reader.TokenType != JsonTokenType.StartObject)
            throw new JsonException("Expected StartObject");

        using var doc = JsonDocument.ParseValue(ref reader);
        var root = doc.RootElement;

        var type = root.TryGetProperty("type", out var typeProp)
            ? typeProp.GetString() ?? ""
            : "";

        return type switch
        {
            "noul" => root.Deserialize<NoulAnswer>(options)!,
            "choice" => root.Deserialize<ChoiceAnswer>(options)!,
            "score" => root.Deserialize<ScoreAnswer>(options)!,
            _ => throw new JsonException($"Unknown JevAnswer type: '{type}'")
        };
    }

    public override void Write(
        Utf8JsonWriter writer,
        JevAnswer value,
        JsonSerializerOptions options)
    {
        switch (value)
        {
            case NoulAnswer n:
                JsonSerializer.Serialize(writer, n, options);
                break;
            case ChoiceAnswer c:
                JsonSerializer.Serialize(writer, c, options);
                break;
            case ScoreAnswer s:
                JsonSerializer.Serialize(writer, s, options);
                break;
            default:
                throw new JsonException($"Unknown JevAnswer type: {value.GetType()}");
        }
    }
}
