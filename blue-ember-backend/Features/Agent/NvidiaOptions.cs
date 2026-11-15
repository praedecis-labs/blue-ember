namespace BlueEmber.Api.Features.Agent;

public sealed class NvidiaOptions
{
    public const string SectionName = "Nvidia";

    public string BaseUrl { get; set; } = "https://integrate.api.nvidia.com/v1";
    public string ApiKey { get; set; } = "";
    public string Model { get; set; } = "nvidia/nemotron-3.5-super-vl-120b-a12b";
    public int MaxToolRounds { get; set; } = 5;
    public int TimeoutSeconds { get; set; } = 180;
}
