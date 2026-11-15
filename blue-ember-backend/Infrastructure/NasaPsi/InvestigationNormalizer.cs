using System.Text.Json;
using System.Text.RegularExpressions;
using BlueEmber.Api.Domain.Categories;
using BlueEmber.Api.Domain.Investigations;

namespace BlueEmber.Api.Infrastructure.NasaPsi;

public static class InvestigationNormalizer
{
    private static readonly HashSet<string> TargetAcronyms = new(StringComparer.OrdinalIgnoreCase)
    {
        "SAFFIRE-I", "SAFFIRE-II", "SAFFIRE-III",
        "BASS", "BASS-II",
        "FLEX", "FLEX-2", "CFI",
        "ACME BRE", "ACME CFI-G", "ACME CLD Flame", "ACME E-FIELD Flames", "ACME s-Flame", "ACME/Flame Design",
        "SAME", "SAME-R", "DAFT / DAFT-2",
        "SPICE", "SLICE"
    };

    private static readonly Regex SyntheticDoi = new(
        @"^10\.25923/nasa\.psi-",
        RegexOptions.IgnoreCase | RegexOptions.Compiled);

    public static Investigation FromJsonElement(JsonElement src)
    {
        var acronym = GetString(src, "Acronym").Trim();
        var accession = GetString(src, "Accession");
        if (string.IsNullOrWhiteSpace(accession))
            accession = "PSI-N/A";

        string hwName = "NASA Standard Hardware";
        string hwLink = "";
        if (src.TryGetProperty("Experiment Hardware", out var hw))
        {
            if (hw.ValueKind == JsonValueKind.Object)
            {
                hwName = GetString(hw, "Name");
                if (string.IsNullOrWhiteSpace(hwName)) hwName = "NASA Standard Hardware";
                hwLink = GetString(hw, "Link");
            }
            else if (hw.ValueKind == JsonValueKind.String)
            {
                hwName = hw.GetString() ?? hwName;
            }
        }

        var investigation = new Investigation
        {
            Id = accession,
            Acronym = acronym,
            Title = NullIfEmpty(GetString(src, "Title")) ?? "Investigação sem título",
            Platform = NullIfEmpty(GetString(src, "Flight Platform")) ?? "ISS / Ground Facility",
            Hardware = hwName,
            HardwareLink = hwLink,
            Discipline = GetString(src, "Research Area"),
            SubDiscipline = GetString(src, "SubResearch Area"),
            Objectives = GetString(src, "Objectives"),
            Approach = GetString(src, "Approach"),
            Hypothesis = GetString(src, "Hypothesis"),
            EarthBenefits = GetString(src, "Research Impacts/Earth Benefits"),
            Materials = [],
            Geometry = "",
            O2Range = [],
            PressureKpa = [],
            FlowSpeedCms = [],
            FlameSpreadRateMms = null,
            MocPercent = null,
            HrrKw = null,
            CoPpm = null,
            RelevanceHabitat = [],
            IsFeaturedFireSafety = TargetAcronyms.Contains(acronym),
            NasaPsiUrl = $"https://psi.nasa.gov/physci/repo/investigations/{accession}",
            Doi = ExtractRealDoi(hwLink, src),
            TestConditions = []
        };

        investigation.Category = CategoryMapper.Map(investigation.Acronym, investigation.SubDiscipline);
        return investigation;
    }

    public static Investigation FromCachedJson(JsonElement src)
    {
        var investigation = new Investigation
        {
            Id = GetString(src, "id"),
            Acronym = GetString(src, "acronym"),
            Title = GetString(src, "title"),
            Platform = GetString(src, "platform"),
            Hardware = GetString(src, "hardware"),
            HardwareLink = GetString(src, "hardware_link"),
            Discipline = GetString(src, "discipline"),
            SubDiscipline = GetString(src, "sub_discipline"),
            Objectives = GetString(src, "objectives"),
            Approach = GetString(src, "approach"),
            Hypothesis = GetString(src, "hypothesis"),
            EarthBenefits = GetString(src, "earth_benefits"),
            Materials = GetStringArray(src, "materials"),
            Geometry = GetString(src, "geometry"),
            O2Range = GetDoubleArray(src, "o2_range"),
            PressureKpa = GetDoubleArray(src, "pressure_kpa"),
            FlowSpeedCms = GetDoubleArray(src, "flow_speed_cms"),
            FlameSpreadRateMms = GetNullableDouble(src, "flame_spread_rate_mms"),
            MocPercent = GetNullableDouble(src, "moc_percent"),
            HrrKw = GetNullableDouble(src, "hrr_kw"),
            CoPpm = GetNullableDouble(src, "co_ppm"),
            RelevanceHabitat = GetStringArray(src, "relevance_habitat"),
            IsFeaturedFireSafety = src.TryGetProperty("is_featured_fire_safety", out var f) && f.ValueKind == JsonValueKind.True,
            NasaPsiUrl = GetString(src, "nasa_psi_url"),
            Doi = SanitizeDoi(GetString(src, "doi")),
            TestConditions = ParseTestConditions(src)
        };

        if (investigation.TestConditions.Count > 0)
            investigation.SyncAggregatesFromConditions();

        investigation.Category = CategoryMapper.Map(investigation.Acronym, investigation.SubDiscipline);
        return investigation;
    }

    public static string SanitizeDoi(string? doi)
    {
        if (string.IsNullOrWhiteSpace(doi))
            return "";
        var trimmed = doi.Trim();
        if (SyntheticDoi.IsMatch(trimmed) ||
            trimmed.Contains("nasa.psi-", StringComparison.OrdinalIgnoreCase))
            return "";
        if (trimmed.Contains("doi.org", StringComparison.OrdinalIgnoreCase))
        {
            var idx = trimmed.IndexOf("10.", StringComparison.Ordinal);
            return idx >= 0 ? trimmed[idx..] : "";
        }
        return trimmed.StartsWith("10.", StringComparison.Ordinal) ? trimmed : "";
    }

    private static string ExtractRealDoi(string hwLink, JsonElement src)
    {
        var fromLink = SanitizeDoi(hwLink);
        if (!string.IsNullOrEmpty(fromLink))
            return fromLink;

        foreach (var key in new[] { "DOI", "Doi", "doi" })
        {
            var candidate = SanitizeDoi(GetString(src, key));
            if (!string.IsNullOrEmpty(candidate))
                return candidate;
        }

        return "";
    }

    private static List<TestCondition> ParseTestConditions(JsonElement src)
    {
        if (!src.TryGetProperty("test_conditions", out var arr) || arr.ValueKind != JsonValueKind.Array)
            return [];

        var list = new List<TestCondition>();
        foreach (var el in arr.EnumerateArray())
        {
            if (el.ValueKind != JsonValueKind.Object)
                continue;

            list.Add(new TestCondition
            {
                Material = NullIfEmpty(GetString(el, "material")),
                Geometry = NullIfEmpty(GetString(el, "geometry")),
                O2Percent = GetNullableDouble(el, "o2_percent"),
                PressureKpa = GetNullableDouble(el, "pressure_kpa"),
                FlowSpeedCms = GetNullableDouble(el, "flow_speed_cms"),
                FlameSpreadRateMms = GetNullableDouble(el, "flame_spread_rate_mms"),
                MocPercent = GetNullableDouble(el, "moc_percent"),
                HrrKw = GetNullableDouble(el, "hrr_kw"),
                CoPpm = GetNullableDouble(el, "co_ppm"),
                Provenance = NullIfEmpty(GetString(el, "provenance")) ?? "estimated",
                Regime = NullIfEmpty(GetString(el, "regime"))
            });
        }

        return list;
    }

    private static string GetString(JsonElement el, string name) =>
        el.TryGetProperty(name, out var p) && p.ValueKind == JsonValueKind.String
            ? p.GetString() ?? ""
            : "";

    private static string? NullIfEmpty(string s) => string.IsNullOrWhiteSpace(s) ? null : s;

    private static List<string> GetStringArray(JsonElement el, string name)
    {
        if (!el.TryGetProperty(name, out var p) || p.ValueKind != JsonValueKind.Array)
            return [];
        return p.EnumerateArray()
            .Where(x => x.ValueKind == JsonValueKind.String)
            .Select(x => x.GetString() ?? "")
            .Where(x => x.Length > 0)
            .ToList();
    }

    private static List<double> GetDoubleArray(JsonElement el, string name)
    {
        if (!el.TryGetProperty(name, out var p) || p.ValueKind != JsonValueKind.Array)
            return [];
        return p.EnumerateArray()
            .Where(x => x.ValueKind == JsonValueKind.Number)
            .Select(x => x.GetDouble())
            .ToList();
    }

    private static double? GetNullableDouble(JsonElement el, string name)
    {
        if (!el.TryGetProperty(name, out var p))
            return null;
        if (p.ValueKind == JsonValueKind.Null || p.ValueKind == JsonValueKind.Undefined)
            return null;
        if (p.ValueKind == JsonValueKind.Number)
            return p.GetDouble();
        return null;
    }
}
