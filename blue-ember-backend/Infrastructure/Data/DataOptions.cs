namespace BlueEmber.Api.Infrastructure.Data;

public sealed class DataOptions
{
    public const string SectionName = "Data";

    public string NormalizedInvestigationsPath { get; set; } = "data/normalized_investigations.json";
}
