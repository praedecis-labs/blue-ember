using BlueEmber.Api.Domain.Investigations;

namespace BlueEmber.Api.Features.Investigations;

public static class InvestigationDtos
{
    public static object ToDto(Investigation inv) => new
    {
        id = inv.Id,
        acronym = inv.Acronym,
        title = inv.Title,
        platform = inv.Platform,
        hardware = inv.Hardware,
        hardwareLink = inv.HardwareLink,
        discipline = inv.Discipline,
        subDiscipline = inv.SubDiscipline,
        category = inv.Category,
        objectives = inv.Objectives,
        approach = inv.Approach,
        hypothesis = inv.Hypothesis,
        earthBenefits = inv.EarthBenefits,
        materials = inv.Materials,
        geometry = inv.Geometry,
        o2Range = inv.O2Range,
        pressureKpa = inv.PressureKpa,
        flowSpeedCms = inv.FlowSpeedCms,
        flameSpreadRateMms = inv.FlameSpreadRateMms,
        mocPercent = inv.MocPercent,
        hrrKw = inv.HrrKw,
        coPpm = inv.CoPpm,
        relevanceHabitat = inv.RelevanceHabitat,
        isFeaturedFireSafety = inv.IsFeaturedFireSafety,
        nasaPsiUrl = inv.NasaPsiUrl,
        doi = inv.Doi
    };

    public static object ToSummary(Investigation inv) => new
    {
        id = inv.Id,
        acronym = inv.Acronym,
        title = inv.Title,
        category = inv.Category,
        platform = inv.Platform,
        o2Range = inv.O2Range,
        pressureKpa = inv.PressureKpa,
        isFeaturedFireSafety = inv.IsFeaturedFireSafety,
        nasaPsiUrl = inv.NasaPsiUrl
    };
}
