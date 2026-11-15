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
    public double? FlameSpreadRateMms { get; set; }
    public double? MocPercent { get; set; }
    public double? HrrKw { get; set; }
    public double? CoPpm { get; set; }
    public List<string> RelevanceHabitat { get; set; } = [];
    public bool IsFeaturedFireSafety { get; set; }
    public string NasaPsiUrl { get; set; } = "";
    public string Doi { get; set; } = "";
    public string Category { get; set; } = "outro";
    public List<TestCondition> TestConditions { get; set; } = [];

    /// <summary>
    /// Rebuilds flat aggregate fields from test conditions for FE/API compatibility.
    /// </summary>
    public void SyncAggregatesFromConditions()
    {
        if (TestConditions.Count == 0)
            return;

        O2Range = TestConditions
            .Where(c => c.O2Percent.HasValue)
            .Select(c => c.O2Percent!.Value)
            .Distinct()
            .OrderBy(x => x)
            .ToList();
        PressureKpa = TestConditions
            .Where(c => c.PressureKpa.HasValue)
            .Select(c => c.PressureKpa!.Value)
            .Distinct()
            .OrderBy(x => x)
            .ToList();
        FlowSpeedCms = TestConditions
            .Where(c => c.FlowSpeedCms.HasValue)
            .Select(c => c.FlowSpeedCms!.Value)
            .Distinct()
            .OrderBy(x => x)
            .ToList();

        FlameSpreadRateMms = MaxOrNull(TestConditions.Select(c => c.FlameSpreadRateMms));
        MocPercent = MinOrNull(TestConditions.Select(c => c.MocPercent));
        HrrKw = MaxOrNull(TestConditions.Select(c => c.HrrKw));
        CoPpm = MaxOrNull(TestConditions.Select(c => c.CoPpm));

        var materials = TestConditions
            .Select(c => c.Material)
            .Where(m => !string.IsNullOrWhiteSpace(m))
            .Cast<string>()
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();
        if (materials.Count > 0)
            Materials = materials;

        var geometry = TestConditions
            .Select(c => c.Geometry)
            .FirstOrDefault(g => !string.IsNullOrWhiteSpace(g));
        if (!string.IsNullOrWhiteSpace(geometry))
            Geometry = geometry!;
    }

    private static double? MaxOrNull(IEnumerable<double?> values)
    {
        var present = values.Where(v => v.HasValue).Select(v => v!.Value).ToList();
        return present.Count == 0 ? null : present.Max();
    }

    private static double? MinOrNull(IEnumerable<double?> values)
    {
        var present = values.Where(v => v.HasValue).Select(v => v!.Value).ToList();
        return present.Count == 0 ? null : present.Min();
    }
}
