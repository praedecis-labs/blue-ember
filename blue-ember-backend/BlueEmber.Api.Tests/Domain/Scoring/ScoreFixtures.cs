using BlueEmber.Api.Domain.Investigations;

namespace BlueEmber.Api.Tests.Domain.Scoring;

internal static class ScoreFixtures
{
    public static Investigation SaffireII() => new()
    {
        Id = "PSI-99",
        Acronym = "SAFFIRE-II",
        O2Range = [21, 34],
        PressureKpa = [101.3, 56.5],
        FlowSpeedCms = [12, 30],
        FlameSpreadRateMms = 3.1,
        MocPercent = 15.5,
        HrrKw = 11.2,
        CoPpm = 620,
        RelevanceHabitat = ["Moon Base", "Pressurized Rover"]
    };

    public static Investigation Same() => new()
    {
        Id = "PSI-102",
        Acronym = "SAME",
        O2Range = [21],
        PressureKpa = [101.3],
        FlowSpeedCms = [5, 15],
        FlameSpreadRateMms = 0,
        MocPercent = 21,
        HrrKw = 0.2,
        CoPpm = 50,
        RelevanceHabitat = ["Spacecraft", "Space Station", "Moon Base"]
    };

    public static Investigation Flex() => new()
    {
        Id = "PSI-69",
        Acronym = "FLEX",
        O2Range = [15, 40],
        PressureKpa = [50, 101.3, 300],
        FlowSpeedCms = [0],
        FlameSpreadRateMms = 0,
        MocPercent = 13,
        HrrKw = 0.8,
        CoPpm = 85,
        RelevanceHabitat = ["Spacecraft", "Space Station"]
    };

    public static Investigation SaffireI() => new()
    {
        Id = "PSI-98",
        Acronym = "SAFFIRE-I",
        O2Range = [21, 30],
        PressureKpa = [101.3, 70],
        FlowSpeedCms = [10, 25],
        FlameSpreadRateMms = 2.4,
        MocPercent = 16,
        HrrKw = 8.5,
        CoPpm = 450,
        RelevanceHabitat = ["Moon Base", "Pressurized Rover", "Spacecraft"]
    };

    public static Investigation SaffireIii() => new()
    {
        Id = "PSI-100",
        Acronym = "SAFFIRE-III",
        O2Range = [21, 32],
        PressureKpa = [95, 70.3],
        FlowSpeedCms = [15, 20],
        FlameSpreadRateMms = 2.8,
        MocPercent = 16.2,
        HrrKw = 9.8,
        CoPpm = 510,
        RelevanceHabitat = ["Space Station", "Moon Base"]
    };
}
