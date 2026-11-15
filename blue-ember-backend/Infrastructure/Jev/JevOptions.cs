namespace BlueEmber.Api.Infrastructure.Jev;

public sealed class JevOptions
{
    public const string SectionName = "Jev";
    public string BaseUrl { get; set; } = "https://api.typesafe.ai";
    public string ApiKey { get; set; } = "";
    public string Model { get; set; } = "jev-latest";
    public int TimeoutSeconds { get; set; } = 30;
}
