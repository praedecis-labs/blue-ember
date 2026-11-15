using System.Text.RegularExpressions;

namespace BlueEmber.Api.Features.Agent;

public static partial class OnTopicHypothesis
{
    [GeneratedRegex(
        @"\b(?:fire|burn|flame|combust(?:ion)?|smoke|oxygen|o2|psi|kpa|iss|moon|mars|lunar|marte|lua|habitat|cabin|fabric|cotton|acrylic|pmma|nomex|suppress|extinguish|detect(?:ion)?|alarm|toxic|toxicity|moc|saffire|bass|fogo|chama|queima|fumaca|fumaça|oxigenio|oxigênio|tecido|pano|roupa|algodao|algodão|acrilico|acrílico|plastico|plástico|liquido|líquido|apagar|exting|detectar|sensor|alarme|pressao|pressão|ventila|fluxo|gravidade|microgravidade|prevenc|deteccao|detecção|supress|segur|risco|perig|material|investigac)",
        RegexOptions.IgnoreCase | RegexOptions.CultureInvariant)]
    private static partial Regex DomainRegex();

    [GeneratedRegex(
        @"(\d{2,3}(?:[.,]\d+)?)\s*%|(\d{1,2}(?:[.,]\d+)?)\s*psi|(\d{1,3}(?:[.,]\d+)?)\s*cm\s*/\s*s|\b(?:iss|marte|lua|lunar|esta[cç][aã]o espacial|tecido|pano|roupa|nomex|algod[aã]o|cortina|pl[aá]stico|acr[ií]lico|pmma|l[ií]quido|combust[ií]vel|gota|apag|extin|suprim|detect|fuma[cç]a|sensor|alarme|evitar|prevenir|segur|risco|queima|perig|co2|co₂|h[eé]lio|nitrog|ar parado|sem ventila|sem fluxo|pouca ventila|fire|burn|flame|combust|smoke|oxygen|moon|mars|fabric|cotton|acrylic|suppress|extinguish|habitat|cabin)\b",
        RegexOptions.IgnoreCase | RegexOptions.CultureInvariant)]
    private static partial Regex ParsedSignalRegex();

    public static bool IsOnTopic(string? message)
    {
        if (string.IsNullOrWhiteSpace(message))
            return false;

        var trimmed = message.Trim();
        if (trimmed.Length < 4)
            return false;

        return ParsedSignalRegex().IsMatch(trimmed) || DomainRegex().IsMatch(trimmed);
    }
}
