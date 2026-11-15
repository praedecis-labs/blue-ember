namespace BlueEmber.Api.Domain.Investigations;

public sealed class TestCondition
{
    public string? Material { get; set; }
    public string? Geometry { get; set; }
    public double? O2Percent { get; set; }
    public double? PressureKpa { get; set; }
    public double? FlowSpeedCms { get; set; }
    public double? FlameSpreadRateMms { get; set; }
    public double? MocPercent { get; set; }
    public double? HrrKw { get; set; }
    public double? CoPpm { get; set; }
    /// <summary>measured | estimated | unknown</summary>
    public string Provenance { get; set; } = "estimated";
    /// <summary>solid_panel | droplet | gas | detection</summary>
    public string? Regime { get; set; }

    public double? PpO2Kpa =>
        O2Percent is { } o2 && PressureKpa is { } p
            ? Math.Round(o2 * p / 100.0, 2)
            : null;
}
