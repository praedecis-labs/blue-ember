namespace BlueEmber.Api.Features.Agent;

public sealed class GroqOptions
{
    public const string SectionName = "Groq";

    public string BaseUrl { get; set; } = "https://api.groq.com/openai/v1";
    public string ApiKey { get; set; } = "";
    public string Model { get; set; } = "openai/gpt-oss-120b";
    public int MaxToolRounds { get; set; } = 5;
    public int TimeoutSeconds { get; set; } = 180;
}
