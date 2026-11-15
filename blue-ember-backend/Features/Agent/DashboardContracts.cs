using System.Text.Json;

namespace BlueEmber.Api.Features.Agent;

public sealed record DashboardSpec(
    string Title,
    string? Subtitle,
    string Intent,
    IReadOnlyList<DashboardWidgetDto> Widgets);

/// <summary>
/// Polymorphic widget DTO — validated/normalized by DashboardComposer.
/// Unknown types are dropped.
/// </summary>
public sealed class DashboardWidgetDto
{
    public string Type { get; set; } = "";
    public string? Title { get; set; }
    public string? InvestigationId { get; set; }
    public int? Limit { get; set; }
    public string? Body { get; set; }
    public List<DashboardScenarioDto>? Scenarios { get; set; }
}

public sealed class DashboardScenarioDto
{
    public string Label { get; set; } = "";
    public string Environment { get; set; } = "";
    public string? Note { get; set; }
    public string Predictability { get; set; } = "medium";
}

public static class DashboardComposer
{
    private static readonly HashSet<string> AllowedTypes = new(StringComparer.OrdinalIgnoreCase)
    {
        "materialHazard",
        "scenarioPredictability",
        "insight",
    };

    private static readonly HashSet<string> AllowedIntents = new(StringComparer.OrdinalIgnoreCase)
    {
        "hazard", "prediction", "coverage", "ranking", "custom",
    };

    private static readonly HashSet<string> AllowedPredictability = new(StringComparer.OrdinalIgnoreCase)
    {
        "high", "medium", "low",
    };

    private static readonly HashSet<string> AllowedEnvs = new(StringComparer.OrdinalIgnoreCase)
    {
        "Iss", "Moon", "Mars",
    };

    public static bool IsPortuguese(string? locale) =>
        string.Equals(locale, "pt-BR", StringComparison.OrdinalIgnoreCase)
        || string.Equals(locale, "pt", StringComparison.OrdinalIgnoreCase);

    public static DashboardSpec DefaultInterpretive(
        string? environment = null,
        string? locale = null)
    {
        var pt = IsPortuguese(locale);
        return new(
            pt ? "Leitura da hipótese" : "Hypothesis reading",
            environment is null
                ? null
                : pt
                    ? $"Ambiente: {environment}"
                    : $"Environment: {environment}",
            "hazard",
            [
                new DashboardWidgetDto
                {
                    Type = "materialHazard",
                    Title = pt ? "Periculosidade relativa" : "Relative hazard",
                    Limit = 5,
                },
                new DashboardWidgetDto
                {
                    Type = "insight",
                    Title = pt ? "Leitura e legendas" : "Reading and legends",
                    Body = pt
                        ? "Score mais alto indica maior criticidade relativa no ranking fire-safety da API " +
                          "para o perfil e ambiente. Pills: vermelho = criticidade alta; amarelo = média; " +
                          "verde = mais baixa entre os itens listados. Detalhes técnicos (ranking completo, " +
                          "mapa O₂×pressão, C1–C5) ficam nos botões de detalhe abaixo."
                        : "A higher score means higher relative criticality in the API fire-safety ranking " +
                          "for this profile and environment. Pills: red = high criticality; yellow = medium; " +
                          "green = lower among listed items. Technical details (full ranking, O₂×pressure map, " +
                          "C1–C5) stay in the detail buttons below.",
                },
            ]);
    }

    /** @deprecated Use DefaultInterpretive. */
    public static DashboardSpec DefaultRanking(string? environment = null) =>
        DefaultInterpretive(environment);

    public static bool LooksLikeDashboardRequest(string message)
    {
        var s = message.ToLowerInvariant();
        return s.Contains("dashboard", StringComparison.Ordinal)
               || s.Contains("painel", StringComparison.Ordinal)
               || s.Contains("mapa de lacuna", StringComparison.Ordinal)
               || s.Contains("visualiza", StringComparison.Ordinal)
               || s.Contains("heatmap", StringComparison.Ordinal)
               || s.Contains("periculosidade", StringComparison.Ordinal)
               || s.Contains("previsibilidade", StringComparison.Ordinal)
               || s.Contains("predi", StringComparison.Ordinal);
    }

    public static DashboardSpec? TryParse(Dictionary<string, object?>? args, out string? error)
    {
        error = null;
        if (args is null || args.Count == 0)
        {
            error = "compose_dashboard requires title, intent, and widgets.";
            return null;
        }

        // Accept either flat args or nested { "spec": { ... } }
        var root = args;
        if (args.TryGetValue("spec", out var nested) && nested is not null)
        {
            if (nested is JsonElement je && je.ValueKind == JsonValueKind.Object)
            {
                root = JsonSerializer.Deserialize<Dictionary<string, object?>>(je.GetRawText())
                       ?? args;
            }
            else if (nested is Dictionary<string, object?> dict)
            {
                root = dict;
            }
        }

        var title = GetStr(root, "title") ?? "Dashboard";
        var subtitle = GetStr(root, "subtitle");
        var intentRaw = GetStr(root, "intent") ?? "custom";
        var intent = AllowedIntents.Contains(intentRaw) ? intentRaw.ToLowerInvariant() : "custom";

        object? widgetsRaw = null;
        if (root.TryGetValue("widgetsJson", out var widgetsJson) && widgetsJson is not null)
        {
            var asStr = widgetsJson is JsonElement wj && wj.ValueKind == JsonValueKind.String
                ? wj.GetString()
                : widgetsJson.ToString();
            if (!string.IsNullOrWhiteSpace(asStr))
            {
                try
                {
                    widgetsRaw = JsonDocument.Parse(asStr).RootElement.Clone();
                }
                catch (JsonException)
                {
                    error = "widgetsJson must be a valid JSON array.";
                    return null;
                }
            }
        }
        else if (root.TryGetValue("widgets", out var widgetsDirect) && widgetsDirect is not null)
        {
            widgetsRaw = widgetsDirect;
        }

        if (widgetsRaw is null)
        {
            error = "widgetsJson (or widgets) is required.";
            return null;
        }

        var widgets = ParseWidgets(widgetsRaw);
        if (widgets.Count == 0)
        {
            error = "widgets must contain at least one known type.";
            return null;
        }

        return new DashboardSpec(title, subtitle, intent, widgets);
    }

    private static List<DashboardWidgetDto> ParseWidgets(object widgetsRaw)
    {
        JsonElement arrayEl;
        if (widgetsRaw is JsonElement je)
            arrayEl = je;
        else
        {
            var json = JsonSerializer.Serialize(widgetsRaw);
            arrayEl = JsonDocument.Parse(json).RootElement;
        }

        if (arrayEl.ValueKind != JsonValueKind.Array)
            return [];

        var list = new List<DashboardWidgetDto>();
        foreach (var item in arrayEl.EnumerateArray())
        {
            if (item.ValueKind != JsonValueKind.Object) continue;
            var type = item.TryGetProperty("type", out var t) ? t.GetString() ?? "" : "";
            if (!AllowedTypes.Contains(type)) continue;

            var canonical = CanonicalType(type);
            var widget = new DashboardWidgetDto
            {
                Type = canonical,
                Title = item.TryGetProperty("title", out var title) ? title.GetString() : null,
            };

            if (canonical is "materialHazard" && item.TryGetProperty("limit", out var lim)
                && lim.ValueKind == JsonValueKind.Number)
                widget.Limit = lim.GetInt32();

            if (canonical is "insight" && item.TryGetProperty("body", out var body))
                widget.Body = body.GetString() ?? "";

            if (canonical is "scenarioPredictability" && item.TryGetProperty("scenarios", out var sc)
                && sc.ValueKind == JsonValueKind.Array)
            {
                widget.Scenarios = [];
                foreach (var s in sc.EnumerateArray())
                {
                    if (s.ValueKind != JsonValueKind.Object) continue;
                    var env = s.TryGetProperty("environment", out var e) ? e.GetString() ?? "" : "";
                    if (!AllowedEnvs.Contains(env)) continue;
                    var pred = s.TryGetProperty("predictability", out var p)
                        ? p.GetString() ?? "medium"
                        : "medium";
                    if (!AllowedPredictability.Contains(pred)) pred = "medium";
                    widget.Scenarios.Add(new DashboardScenarioDto
                    {
                        Label = s.TryGetProperty("label", out var l) ? l.GetString() ?? env : env,
                        Environment = CanonicalEnv(env),
                        Note = s.TryGetProperty("note", out var n) ? n.GetString() : null,
                        Predictability = pred.ToLowerInvariant(),
                    });
                }

                if (widget.Scenarios.Count == 0) continue;
            }

            if (canonical is "insight" && string.IsNullOrWhiteSpace(widget.Body))
                continue;

            list.Add(widget);
        }

        // Cap interpretive dashboards; ensure insight is present when possible.
        return list.Take(4).ToList();
    }

    private static string CanonicalType(string type) => type switch
    {
        _ when type.Equals("materialHazard", StringComparison.OrdinalIgnoreCase) => "materialHazard",
        _ when type.Equals("scenarioPredictability", StringComparison.OrdinalIgnoreCase) => "scenarioPredictability",
        _ when type.Equals("insight", StringComparison.OrdinalIgnoreCase) => "insight",
        _ => type,
    };

    private static string CanonicalEnv(string env) => env.ToLowerInvariant() switch
    {
        "iss" => "Iss",
        "moon" => "Moon",
        "mars" => "Mars",
        _ => env,
    };

    private static string? GetStr(Dictionary<string, object?> args, string key)
    {
        if (!args.TryGetValue(key, out var raw) || raw is null) return null;
        if (raw is JsonElement je)
            return je.ValueKind == JsonValueKind.String ? je.GetString() : je.ToString();
        return raw.ToString();
    }
}
