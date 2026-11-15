using System.Text.Json;
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

        var doi = hwLink.Contains("doi.org", StringComparison.OrdinalIgnoreCase)
            ? hwLink
            : $"10.25923/nasa.{accession.ToLowerInvariant()}";

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
            Materials = ["Amostras Diversas de Pesquisa"],
            Geometry = "Geometria Padrão de Ensaio",
            O2Range = [21.0],
            PressureKpa = [101.3],
            FlowSpeedCms = [5.0],
            FlameSpreadRateMms = 1.0,
            MocPercent = 18.0,
            HrrKw = 1.5,
            CoPpm = 100,
            RelevanceHabitat = ["ISS", "Spacecraft"],
            IsFeaturedFireSafety = TargetAcronyms.Contains(acronym),
            NasaPsiUrl = $"https://psi.nasa.gov/physci/repo/investigations/{accession}",
            Doi = doi
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
            FlameSpreadRateMms = GetDouble(src, "flame_spread_rate_mms"),
            MocPercent = GetDouble(src, "moc_percent"),
            HrrKw = GetDouble(src, "hrr_kw"),
            CoPpm = GetDouble(src, "co_ppm"),
            RelevanceHabitat = GetStringArray(src, "relevance_habitat"),
            IsFeaturedFireSafety = src.TryGetProperty("is_featured_fire_safety", out var f) && f.ValueKind == JsonValueKind.True,
            NasaPsiUrl = GetString(src, "nasa_psi_url"),
            Doi = GetString(src, "doi")
        };

        investigation.Category = CategoryMapper.Map(investigation.Acronym, investigation.SubDiscipline);
        return investigation;
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

    private static double GetDouble(JsonElement el, string name) =>
        el.TryGetProperty(name, out var p) && p.ValueKind == JsonValueKind.Number
            ? p.GetDouble()
            : 0;
}
