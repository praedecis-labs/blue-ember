namespace BlueEmber.Api.Features.Agent;

public sealed class GeminiOptions
{
    public const string SectionName = "Gemini";

    public string ApiKey { get; set; } = "";
    public string Model { get; set; } = "gemma-4-31b-it";
    public int MaxToolRounds { get; set; } = 5;
}
