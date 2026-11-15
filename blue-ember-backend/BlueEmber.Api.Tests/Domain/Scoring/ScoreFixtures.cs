using BlueEmber.Api.Domain.Categories;
using BlueEmber.Api.Domain.Investigations;

namespace BlueEmber.Api.Tests.Domain.Scoring;

internal static class ScoreFixtures
{
    public static Investigation SaffireII()
    {
        var inv = new Investigation
        {
            Id = "PSI-99",
            Acronym = "SAFFIRE-II",
            Category = "prevencao",
            RelevanceHabitat = ["Moon Base", "Pressurized Rover"],
            TestConditions =
            [
                new TestCondition
                {
                    Material = "PMMA",
                    Geometry = "Solid Samples Array",
                    O2Percent = 21,
                    PressureKpa = 101.3,
                    FlowSpeedCms = 12,
                    FlameSpreadRateMms = 3.1,
                    MocPercent = 15.5,
                    HrrKw = 11.2,
                    CoPpm = 620,
                    Provenance = "estimated",
                    Regime = "solid_panel"
                },
                new TestCondition
                {
                    Material = "PMMA",
                    Geometry = "Solid Samples Array",
                    O2Percent = 34,
                    PressureKpa = 56.5,
                    FlowSpeedCms = 30,
                    FlameSpreadRateMms = 3.1,
                    MocPercent = 15.5,
                    HrrKw = 11.2,
                    CoPpm = 620,
                    Provenance = "estimated",
                    Regime = "solid_panel"
                }
            ]
        };
        inv.SyncAggregatesFromConditions();
        inv.Category = CategoryMapper.Map(inv.Acronym, inv.SubDiscipline);
        return inv;
    }

    public static Investigation Same()
    {
        var inv = new Investigation
        {
            Id = "PSI-102",
            Acronym = "SAME",
            Category = "deteccao",
            RelevanceHabitat = ["Spacecraft", "Space Station", "Moon Base"],
            TestConditions =
            [
                new TestCondition
                {
                    Material = "Combustion Aerosols",
                    Geometry = "Particulate Cloud in Flow Loop",
                    O2Percent = 21,
                    PressureKpa = 101.3,
                    FlowSpeedCms = 5,
                    FlameSpreadRateMms = 0,
                    MocPercent = 21,
                    HrrKw = 0.2,
                    CoPpm = 50,
                    Provenance = "estimated",
                    Regime = "detection"
                },
                new TestCondition
                {
                    Material = "Combustion Aerosols",
                    Geometry = "Particulate Cloud in Flow Loop",
                    O2Percent = 21,
                    PressureKpa = 101.3,
                    FlowSpeedCms = 15,
                    FlameSpreadRateMms = 0,
                    MocPercent = 21,
                    HrrKw = 0.2,
                    CoPpm = 50,
                    Provenance = "estimated",
                    Regime = "detection"
                }
            ]
        };
        inv.SyncAggregatesFromConditions();
        inv.Category = CategoryMapper.Map(inv.Acronym, inv.SubDiscipline);
        return inv;
    }

    public static Investigation Flex()
    {
        var inv = new Investigation
        {
            Id = "PSI-69",
            Acronym = "FLEX",
            Category = "supressao",
            RelevanceHabitat = ["Spacecraft", "Space Station"],
            TestConditions =
            [
                new TestCondition
                {
                    Material = "n-Heptane",
                    Geometry = "Free & Tethered Liquid Droplets (1-5mm)",
                    O2Percent = 15,
                    PressureKpa = 50,
                    FlowSpeedCms = 0,
                    FlameSpreadRateMms = 0,
                    MocPercent = 13,
                    HrrKw = 0.8,
                    CoPpm = 85,
                    Provenance = "estimated",
                    Regime = "droplet"
                },
                new TestCondition
                {
                    Material = "n-Heptane",
                    Geometry = "Free & Tethered Liquid Droplets (1-5mm)",
                    O2Percent = 40,
                    PressureKpa = 101.3,
                    FlowSpeedCms = 0,
                    FlameSpreadRateMms = 0,
                    MocPercent = 13,
                    HrrKw = 0.8,
                    CoPpm = 85,
                    Provenance = "estimated",
                    Regime = "droplet"
                },
                new TestCondition
                {
                    Material = "n-Heptane",
                    Geometry = "Free & Tethered Liquid Droplets (1-5mm)",
                    O2Percent = 40,
                    PressureKpa = 300,
                    FlowSpeedCms = 0,
                    FlameSpreadRateMms = 0,
                    MocPercent = 13,
                    HrrKw = 0.8,
                    CoPpm = 85,
                    Provenance = "estimated",
                    Regime = "droplet"
                }
            ]
        };
        inv.SyncAggregatesFromConditions();
        inv.Category = CategoryMapper.Map(inv.Acronym, inv.SubDiscipline);
        return inv;
    }

    public static Investigation SaffireI()
    {
        var inv = new Investigation
        {
            Id = "PSI-98",
            Acronym = "SAFFIRE-I",
            RelevanceHabitat = ["Moon Base", "Pressurized Rover", "Spacecraft"],
            TestConditions =
            [
                new TestCondition
                {
                    Material = "Cotton/Fiberglass (SIBAL fabric)",
                    O2Percent = 21,
                    PressureKpa = 101.3,
                    FlowSpeedCms = 10,
                    FlameSpreadRateMms = 2.4,
                    MocPercent = 16,
                    HrrKw = 8.5,
                    CoPpm = 450,
                    Provenance = "estimated",
                    Regime = "solid_panel"
                },
                new TestCondition
                {
                    Material = "Cotton/Fiberglass (SIBAL fabric)",
                    O2Percent = 30,
                    PressureKpa = 70,
                    FlowSpeedCms = 25,
                    FlameSpreadRateMms = 2.4,
                    MocPercent = 16,
                    HrrKw = 8.5,
                    CoPpm = 450,
                    Provenance = "estimated",
                    Regime = "solid_panel"
                }
            ]
        };
        inv.SyncAggregatesFromConditions();
        inv.Category = CategoryMapper.Map(inv.Acronym, inv.SubDiscipline);
        return inv;
    }

    public static Investigation SaffireIii()
    {
        var inv = new Investigation
        {
            Id = "PSI-100",
            Acronym = "SAFFIRE-III",
            RelevanceHabitat = ["Space Station", "Moon Base"],
            TestConditions =
            [
                new TestCondition
                {
                    Material = "SIBAL Fabric",
                    O2Percent = 21,
                    PressureKpa = 95,
                    FlowSpeedCms = 15,
                    FlameSpreadRateMms = 2.8,
                    MocPercent = 16.2,
                    HrrKw = 9.8,
                    CoPpm = 510,
                    Provenance = "estimated",
                    Regime = "solid_panel"
                },
                new TestCondition
                {
                    Material = "SIBAL Fabric",
                    O2Percent = 32,
                    PressureKpa = 70.3,
                    FlowSpeedCms = 20,
                    FlameSpreadRateMms = 2.8,
                    MocPercent = 16.2,
                    HrrKw = 9.8,
                    CoPpm = 510,
                    Provenance = "estimated",
                    Regime = "solid_panel"
                }
            ]
        };
        inv.SyncAggregatesFromConditions();
        inv.Category = CategoryMapper.Map(inv.Acronym, inv.SubDiscipline);
        return inv;
    }

    public static Investigation Daft()
    {
        var inv = new Investigation
        {
            Id = "PSI-DAFT",
            Acronym = "DAFT / DAFT-2",
            RelevanceHabitat = ["Moon Base", "Pressurized Rover"],
            TestConditions =
            [
                new TestCondition
                {
                    Material = "Lunar Regolith Simulant",
                    O2Percent = 21,
                    PressureKpa = 101.3,
                    FlowSpeedCms = 10,
                    FlameSpreadRateMms = 0,
                    MocPercent = 21,
                    HrrKw = 0,
                    CoPpm = 10,
                    Provenance = "estimated",
                    Regime = "detection"
                }
            ]
        };
        inv.SyncAggregatesFromConditions();
        inv.Category = CategoryMapper.Map(inv.Acronym, inv.SubDiscipline);
        return inv;
    }
}
