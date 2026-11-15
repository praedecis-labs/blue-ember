namespace BlueEmber.Api.Domain.Categories;

public enum InvestigationCategory
{
    Prevencao,
    Deteccao,
    Supressao,
    Outro,
}

public static class InvestigationCategoryExtensions
{
    public static string ToApiValue(this InvestigationCategory category) => category switch
    {
        InvestigationCategory.Prevencao => "prevencao",
        InvestigationCategory.Deteccao => "deteccao",
        InvestigationCategory.Supressao => "supressao",
        _ => "outro",
    };
}
