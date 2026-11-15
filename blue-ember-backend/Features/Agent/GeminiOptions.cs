namespace BlueEmber.Api.Features.Agent;

public sealed class GeminiOptions
{
    public const string SectionName = "Gemini";

    public string ApiKey { get; set; } = "";
    public string Model { get; set; } = "gemini-3.1-flash-lite";
    public int MaxToolRounds { get; set; } = 5;
}
