namespace BlueEmber.Api.Domain.Investigations;

public sealed class Investigation
{
    public string Id { get; set; } = "";
    public string Acronym { get; set; } = "";
    public string Title { get; set; } = "";
    public string Platform { get; set; } = "";
    public string Hardware { get; set; } = "";
    public string HardwareLink { get; set; } = "";
    public string Discipline { get; set; } = "";
    public string SubDiscipline { get; set; } = "";
    public string Objectives { get; set; } = "";
    public string Approach { get; set; } = "";
    public string Hypothesis { get; set; } = "";
    public string EarthBenefits { get; set; } = "";
    public List<string> Materials { get; set; } = [];
    public string Geometry { get; set; } = "";
    public List<double> O2Range { get; set; } = [];
    public List<double> PressureKpa { get; set; } = [];
    public List<double> FlowSpeedCms { get; set; } = [];
    public double FlameSpreadRateMms { get; set; }
    public double MocPercent { get; set; }
    public double HrrKw { get; set; }
    public double CoPpm { get; set; }
    public List<string> RelevanceHabitat { get; set; } = [];
    public bool IsFeaturedFireSafety { get; set; }
    public string NasaPsiUrl { get; set; } = "";
    public string Doi { get; set; } = "";
    public string Category { get; set; } = "outro";
}
