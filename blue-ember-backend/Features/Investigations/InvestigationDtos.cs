using BlueEmber.Api.Domain.Investigations;
using BlueEmber.Api.Features.Contracts;

namespace BlueEmber.Api.Features.Investigations;

public static class InvestigationDtos
{
    public static TestConditionDto ToCondition(TestCondition c) => new(
        c.Material,
        c.Geometry,
        c.O2Percent,
        c.PressureKpa,
        c.FlowSpeedCms,
        c.FlameSpreadRateMms,
        c.MocPercent,
        c.HrrKw,
        c.CoPpm,
        c.Provenance,
        c.Regime,
        c.PpO2Kpa);

    public static InvestigationDetailDto ToDetail(Investigation inv) => new(
        inv.Id,
        inv.Acronym,
        inv.Title,
        inv.Platform,
        inv.Hardware,
        inv.HardwareLink,
        inv.Discipline,
        inv.SubDiscipline,
        inv.Category,
        inv.Objectives,
        inv.Approach,
        inv.Hypothesis,
        inv.EarthBenefits,
        inv.Materials,
        inv.Geometry,
        inv.O2Range,
        inv.PressureKpa,
        inv.FlowSpeedCms,
        inv.FlameSpreadRateMms,
        inv.MocPercent,
        inv.HrrKw,
        inv.CoPpm,
        inv.RelevanceHabitat,
        inv.IsFeaturedFireSafety,
        inv.NasaPsiUrl,
        inv.Doi,
        inv.TestConditions.Select(ToCondition).ToList());

    public static InvestigationSummaryDto ToSummary(Investigation inv) => new(
        inv.Id,
        inv.Acronym,
        inv.Title,
        inv.Category,
        inv.Platform,
        inv.O2Range,
        inv.PressureKpa,
        inv.IsFeaturedFireSafety,
        inv.NasaPsiUrl,
        inv.TestConditions.Count);
}
