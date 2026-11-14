namespace BlueEmber.Api.Domain.Environments;

public enum MissionEnvironment
{
    Iss,
    Moon,
    Mars
}

public sealed record EnvironmentTargets(double TargetO2Percent, double TargetPressureKpa, double TargetFlowCms);

public static class MissionEnvironmentCatalog
{
    public static EnvironmentTargets Targets(MissionEnvironment env) => env switch
    {
        MissionEnvironment.Moon => new(30.0, 70.3, 15.0),
        MissionEnvironment.Mars => new(30.0, 70.0, 15.0),
        _ => new(21.0, 101.3, 10.0)
    };

    public static IReadOnlyList<object> List() =>
    [
        Describe(MissionEnvironment.Iss, "ISS / estação"),
        Describe(MissionEnvironment.Moon, "Base lunar"),
        Describe(MissionEnvironment.Mars, "Base marciana")
    ];

    private static object Describe(MissionEnvironment env, string label)
    {
        var t = Targets(env);
        return new
        {
            id = env.ToString(),
            label,
            targetO2Percent = t.TargetO2Percent,
            targetPressureKpa = t.TargetPressureKpa,
            targetFlowCms = t.TargetFlowCms
        };
    }

    public static bool TryParse(string? value, out MissionEnvironment environment)
    {
        environment = MissionEnvironment.Moon;
        if (string.IsNullOrWhiteSpace(value))
            return true;

        return Enum.TryParse(value, ignoreCase: true, out environment);
    }
}
