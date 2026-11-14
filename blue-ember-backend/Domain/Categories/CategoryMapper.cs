namespace BlueEmber.Api.Domain.Categories;

public static class CategoryMapper
{
    public static string Map(string? acronym, string? subDiscipline)
    {
        var a = (acronym ?? "").Trim().ToUpperInvariant();
        var sub = (subDiscipline ?? "").ToLowerInvariant();

        if (a.StartsWith("SAFFIRE") || a.StartsWith("BASS") || a.Contains("BRE") ||
            sub.Contains("flammability") || sub.Contains("spacecraft fire"))
        {
            return "prevencao";
        }

        if (a.StartsWith("SAME") || a.StartsWith("DAFT") ||
            sub.Contains("aerosol") || sub.Contains("detection") || sub.Contains("smoke"))
        {
            return "deteccao";
        }

        if (a.StartsWith("FLEX") || a.Contains("SPICE") || a.Contains("SLICE") ||
            sub.Contains("suppress") || sub.Contains("extinct") || sub.Contains("droplet"))
        {
            return "supressao";
        }

        return "outro";
    }
}
