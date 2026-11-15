namespace BlueEmber.Api.Infrastructure.NasaPsi;

public sealed class NasaPsiOptions
{
    public const string SectionName = "NasaPsi";

    public string BaseUrl { get; set; } = "https://psi.nasa.gov/geode-py/ws/repo/search";
    public string DefaultQuery { get; set; } = "combustion";
    public string DefaultResearchArea { get; set; } = "Combustion Science";
    public int DefaultSize { get; set; } = 150;
    public int TimeoutSeconds { get; set; } = 30;
}
