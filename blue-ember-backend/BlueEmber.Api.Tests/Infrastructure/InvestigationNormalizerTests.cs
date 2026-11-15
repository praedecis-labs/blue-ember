using System.Text.Json;
using BlueEmber.Api.Infrastructure.NasaPsi;

namespace BlueEmber.Api.Tests.Infrastructure;

public sealed class InvestigationNormalizerTests
{
    [Fact]
    public void FromJsonElement_does_not_inject_physical_constants_or_synthetic_doi()
    {
        var json = """
            {
              "Acronym": "SAFFIRE-II",
              "Accession": "PSI-99",
              "Title": "Saffire II",
              "Flight Platform": "Cygnus",
              "Research Area": "Combustion",
              "SubResearch Area": "Spacecraft Fire Safety",
              "Objectives": "",
              "Approach": "",
              "Hypothesis": "",
              "Research Impacts/Earth Benefits": "",
              "Experiment Hardware": { "Name": "Saffire", "Link": "" }
            }
            """;

        using var doc = JsonDocument.Parse(json);
        var inv = InvestigationNormalizer.FromJsonElement(doc.RootElement);

        Assert.Empty(inv.O2Range);
        Assert.Empty(inv.PressureKpa);
        Assert.Empty(inv.FlowSpeedCms);
        Assert.Null(inv.FlameSpreadRateMms);
        Assert.Null(inv.MocPercent);
        Assert.Null(inv.HrrKw);
        Assert.Null(inv.CoPpm);
        Assert.Empty(inv.TestConditions);
        Assert.Equal("", inv.Doi);
        Assert.True(inv.IsFeaturedFireSafety);
    }

    [Fact]
    public void SanitizeDoi_strips_synthetic_psi_pattern()
    {
        Assert.Equal("", InvestigationNormalizer.SanitizeDoi("10.25923/nasa.psi-99"));
        Assert.Equal("", InvestigationNormalizer.SanitizeDoi("https://doi.org/10.25923/nasa.psi-99"));
        Assert.Equal("10.60555/2chp-m469", InvestigationNormalizer.SanitizeDoi("10.60555/2chp-m469"));
        Assert.Equal(
            "10.60555/2chp-m469",
            InvestigationNormalizer.SanitizeDoi("https://doi.org/10.60555/2chp-m469"));
    }

    [Fact]
    public void FromCachedJson_loads_test_conditions_and_syncs_aggregates()
    {
        var json = """
            {
              "id": "PSI-69",
              "acronym": "FLEX",
              "title": "FLEX",
              "platform": "ISS",
              "hardware": "CIR",
              "hardware_link": "",
              "discipline": "Combustion",
              "sub_discipline": "Droplet",
              "objectives": "",
              "approach": "",
              "hypothesis": "",
              "earth_benefits": "",
              "materials": ["n-Heptane"],
              "geometry": "Droplet",
              "o2_range": [15.0, 40.0],
              "pressure_kpa": [50.0, 101.3],
              "flow_speed_cms": [0.0],
              "flame_spread_rate_mms": 0.0,
              "moc_percent": 13.0,
              "hrr_kw": 0.8,
              "co_ppm": 85,
              "relevance_habitat": ["Spacecraft"],
              "is_featured_fire_safety": true,
              "nasa_psi_url": "https://psi.nasa.gov/physci/repo/investigations/PSI-69",
              "doi": "10.25923/nasa.psi-69",
              "test_conditions": [
                {
                  "material": "n-Heptane",
                  "geometry": "Droplet",
                  "o2_percent": 15.0,
                  "pressure_kpa": 50.0,
                  "flow_speed_cms": 0.0,
                  "flame_spread_rate_mms": 0.0,
                  "moc_percent": 13.0,
                  "hrr_kw": 0.8,
                  "co_ppm": 85,
                  "provenance": "estimated",
                  "regime": "droplet"
                },
                {
                  "material": "n-Heptane",
                  "geometry": "Droplet",
                  "o2_percent": 40.0,
                  "pressure_kpa": 101.3,
                  "flow_speed_cms": 0.0,
                  "flame_spread_rate_mms": 0.0,
                  "moc_percent": 13.0,
                  "hrr_kw": 0.8,
                  "co_ppm": 85,
                  "provenance": "estimated",
                  "regime": "droplet"
                }
              ]
            }
            """;

        using var doc = JsonDocument.Parse(json);
        var inv = InvestigationNormalizer.FromCachedJson(doc.RootElement);

        Assert.Equal(2, inv.TestConditions.Count);
        Assert.Equal("", inv.Doi);
        Assert.Contains(15.0, inv.O2Range);
        Assert.Contains(40.0, inv.O2Range);
        Assert.Equal(0.0, inv.FlameSpreadRateMms);
    }
}
