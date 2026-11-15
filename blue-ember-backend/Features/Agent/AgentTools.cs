using System.Text.Json;
using BlueEmber.Api.Features.Contracts;
using BlueEmber.Api.Features.Gaps;
using BlueEmber.Api.Features.Investigations;
using BlueEmber.Api.Features.Ranking;
using BlueEmber.Api.Infrastructure.Jev;

namespace BlueEmber.Api.Features.Agent;

public sealed class AgentTools(
    RankingQueryService ranking,
    GapsQueryService gaps,
    InvestigationQueryService investigations,
    JevClient jev)
{
    private readonly JevClient _jev = jev;
    private static readonly JsonSerializerOptions JsonOpts = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        DefaultIgnoreCondition = System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull,
    };

    public RankingResponse? LastRanking { get; private set; }
    public GapsResponse? LastGaps { get; private set; }
    public DashboardSpec? LastDashboard { get; private set; }
    public JevResponse? LastJev { get; private set; }
    public List<string> ToolsUsed { get; } = [];

    public static List<AgentToolDeclaration> Declarations() =>
    [
        new()
        {
            Name = "get_fire_safety_ranking",
            Description =
                "Ranking ponderado das investigações NASA PSI fire-safety (C1–C5) para um perfil e ambiente de missão.",
            Parameters = new AgentToolSchema
            {
                Type = "object",
                Properties = new Dictionary<string, AgentToolSchemaProperty>
                {
                    ["profile"] = new()
                    {
                        Type = "string",
                        Description = "Student | Researcher | ShipEngineer",
                    },
                    ["environment"] = new()
                    {
                        Type = "string",
                        Description = "Iss | Moon | Mars",
                    },
                    ["category"] = new()
                    {
                        Type = "string",
                        Description = "Opcional: prevencao | deteccao | supressao | outro",
                    },
                },
            },
        },
        new()
        {
            Name = "get_coverage_gaps",
            Description =
                "Lacunas de cobertura O2×pressão e aviso de gravidade parcial para um ambiente.",
            Parameters = new AgentToolSchema
            {
                Type = "object",
                Properties = new Dictionary<string, AgentToolSchemaProperty>
                {
                    ["environment"] = new()
                    {
                        Type = "string",
                        Description = "Iss | Moon | Mars",
                    },
                },
                Required = ["environment"],
            },
        },
        new()
        {
            Name = "get_investigation",
            Description = "Ficha completa de uma investigação pelo id (ex.: PSI-99).",
            Parameters = new AgentToolSchema
            {
                Type = "object",
                Properties = new Dictionary<string, AgentToolSchemaProperty>
                {
                    ["id"] = new()
                    {
                        Type = "string",
                        Description = "Id da investigação no catálogo Blue Ember / PSI",
                    },
                },
                Required = ["id"],
            },
        },
        new()
        {
            Name = "search_investigations",
            Description = "Busca investigações por texto e filtros de O2/pressão/categoria.",
            Parameters = new AgentToolSchema
            {
                Type = "object",
                Properties = new Dictionary<string, AgentToolSchemaProperty>
                {
                    ["q"] = new() { Type = "string", Description = "Termo de busca" },
                    ["category"] = new()
                    {
                        Type = "string",
                        Description = "prevencao | deteccao | supressao | outro",
                    },
                    ["o2Min"] = new() { Type = "number", Description = "O2 % mínimo" },
                    ["o2Max"] = new() { Type = "number", Description = "O2 % máximo" },
                    ["pressureMin"] = new() { Type = "number", Description = "Pressão kPa mínima" },
                    ["pressureMax"] = new() { Type = "number", Description = "Pressão kPa máxima" },
                    ["limit"] = new() { Type = "number", Description = "Máximo de itens (default 8)" },
                },
            },
        },
        new()
        {
            Name = "compose_dashboard",
            Description =
                "Monta um dashboard interpretativo no chat. Use para dashboard/painel/visualização/" +
                "periculosidade/previsibilidade. Widgets permitidos somente: materialHazard, " +
                "scenarioPredictability, insight. Sempre inclua insight com leitura + legendas. " +
                "Não use rankingTop3, gapsHeatmap nem criteriaBars. Não invente números.",
            Parameters = new AgentToolSchema
            {
                Type = "object",
                Properties = new Dictionary<string, AgentToolSchemaProperty>
                {
                    ["title"] = new() { Type = "string", Description = "Título do dashboard" },
                    ["subtitle"] = new() { Type = "string", Description = "Subtítulo opcional" },
                    ["intent"] = new()
                    {
                        Type = "string",
                        Description = "hazard | prediction | custom",
                    },
                    ["widgetsJson"] = new()
                    {
                        Type = "string",
                        Description =
                            "JSON array. Ex.: [{\"type\":\"materialHazard\",\"title\":\"Periculosidade\",\"limit\":5}," +
                            "{\"type\":\"insight\",\"title\":\"Leitura e legendas\"," +
                            "\"body\":\"…inclua legendas dos pills/níveis…\"}] ou " +
                            "[{\"type\":\"scenarioPredictability\",\"scenarios\":[{\"label\":\"ISS\"," +
                            "\"environment\":\"Iss\",\"predictability\":\"high\",\"note\":\"…\"}]}," +
                            "{\"type\":\"insight\",\"body\":\"…legendas Alta/Média/Baixa…\"}].",
                    },
                },
                Required = ["title", "intent", "widgetsJson"],
            },
        },
        new()
        {
            Name = "ask_jev",
            Description =
                "Consulta o TypeSafe Jev (modelo de decisão calibrado) para obter julgamentos " +
                "atômicos e probabilidades sobre segurança contra incêndio em habitats espaciais. " +
                "Use quando precisar avaliar critérios específicos (proximidade de atmosfera, " +
                "margem de MOC, cinética de chama, severidade térmica, toxicidade) com probabilidade " +
                "calibrada em vez de score determinístico.",
            Parameters = new AgentToolSchema
            {
                Type = "object",
                Properties = new Dictionary<string, AgentToolSchemaProperty>
                {
                    ["state"] = new()
                    {
                        Type = "object",
                        Description = "Contexto da investigação/cenário: ambiente, O2, pressão, " +
                                      "material, fluxo, métricas técnicas e qualquer dado relevante.",
                    },
                    ["questions"] = new()
                    {
                        Type = "object",
                        Description =
                            "Dicionário de perguntas tipadas. Cada chave é um nome de pergunta. " +
                            "Cada valor: { type, instructions, criteria }. " +
                            "type=noul: criteria = { \"true\": \"o que conta como sim\", \"false\": \"o que conta como não\" }. " +
                            "type=choice: criteria = { \"nome_da_opcao\": \"descrição\" }. " +
                            "type=score: criteria = [\"nível 0\", \"nível 1\", ...] (array ordenado de descrições). " +
                            "NUNCA envie criteria como string solta.",
                    },
                },
                Required = ["state", "questions"],
            },
        },
    ];

    public async Task<object> ExecuteAsync(string name, Dictionary<string, object?>? args)
    {
        ToolsUsed.Add(name);
        args ??= new Dictionary<string, object?>();

        return await (name switch
        {
            "get_fire_safety_ranking" => Task.FromResult<object>(GetRanking(args)),
            "get_coverage_gaps" => Task.FromResult<object>(GetGaps(args)),
            "get_investigation" => Task.FromResult<object>(GetInvestigation(args)),
            "search_investigations" => Task.FromResult<object>(Search(args)),
            "compose_dashboard" => Task.FromResult<object>(ComposeDashboard(args)),
            "ask_jev" => AskJev(args),
            _ => Task.FromResult<object>(new { error = $"Unknown tool '{name}'" }),
        });
    }

    private object ComposeDashboard(Dictionary<string, object?> args)
    {
        var spec = DashboardComposer.TryParse(args, out var error);
        if (spec is null)
            return new { error };

        LastDashboard = spec;
        return new
        {
            ok = true,
            title = spec.Title,
            intent = spec.Intent,
            widgetCount = spec.Widgets.Count,
            types = spec.Widgets.Select(w => w.Type).ToList(),
        };
    }

    private object GetRanking(Dictionary<string, object?> args)
    {
        var profile = Str(args, "profile");
        var environment = Str(args, "environment");
        var category = Str(args, "category");

        if (!ranking.TryBuild(
                profile, environment, category, featuredOnly: true,
                null, null, null, null, null,
                out var response, out var error))
            return new { error };

        LastRanking = response;
        return CompactRanking(response!);
    }

    private object GetGaps(Dictionary<string, object?> args)
    {
        var environment = Str(args, "environment");
        if (!gaps.TryBuild(environment, out var response, out var error))
            return new { error };

        LastGaps = response;
        return CompactGaps(response!);
    }

    private object GetInvestigation(Dictionary<string, object?> args)
    {
        var id = Str(args, "id");
        if (string.IsNullOrWhiteSpace(id))
            return new { error = "id is required" };

        var detail = investigations.GetById(id);
        return detail is null
            ? new { error = $"Investigation '{id}' not found" }
            : detail;
    }

    private object Search(Dictionary<string, object?> args)
    {
        var limit = (int)(Num(args, "limit") ?? 8);
        return investigations.Search(
            Str(args, "q"),
            Str(args, "category"),
            featured: true,
            Num(args, "o2Min"),
            Num(args, "o2Max"),
            Num(args, "pressureMin"),
            Num(args, "pressureMax"),
            limit);
    }

    private static object CompactRanking(RankingResponse full)
    {
        var top = full.Items.Take(3).Select(i => new
        {
            i.Rank,
            i.Score,
            id = i.Investigation.Id,
            acronym = i.Investigation.Acronym,
            title = i.Investigation.Title,
            category = i.Investigation.Category,
            platform = i.Investigation.Platform,
            o2Range = i.Investigation.O2Range,
            pressureKpa = i.Investigation.PressureKpa,
            nasaPsiUrl = i.Investigation.NasaPsiUrl,
        }).ToList();

        return new
        {
            full.Profile,
            full.Environment,
            full.Featured,
            count = full.Count,
            top,
        };
    }

    private static object CompactGaps(GapsResponse full)
    {
        var emptyCells = full.CoverageCells
            .Where(c => c.CoverageCount == 0)
            .Take(6)
            .Select(c => new
            {
                c.O2Min,
                c.O2Max,
                c.PressureMinKpa,
                c.PressureMaxKpa,
            })
            .ToList();

        return new
        {
            full.Environment,
            targets = full.Targets,
            partialGravityWarning = full.PartialGravityWarning,
            nearTargetInvestigationIds = full.NearTargetInvestigationIds.Take(5).ToList(),
            emptyCoverageCells = emptyCells,
            featuredCount = full.FeaturedCount,
        };
    }

    private async Task<object> AskJev(Dictionary<string, object?> args)
    {
        if (!args.TryGetValue("state", out var stateRaw) || stateRaw is null)
            return new { error = "state is required for ask_jev" };
        if (!args.TryGetValue("questions", out var questionsRaw) || questionsRaw is null)
            return new { error = "questions is required for ask_jev" };

        var questions = new Dictionary<string, JevQuestion>();

        if (questionsRaw is JsonElement jeQuestions)
        {
            foreach (var prop in jeQuestions.EnumerateObject())
            {
                JevQuestion? q = null;
                try { q = prop.Value.Deserialize<JevQuestion>(JsonOpts); }
                catch (JsonException) { /* pergunta malformada: ignora */ }
                if (q is not null)
                    questions[prop.Name] = q;
            }
        }
        else if (questionsRaw is Dictionary<string, object?> qDict)
        {
            foreach (var kv in qDict)
            {
                JevQuestion? q = null;
                try
                {
                    q = kv.Value is JsonElement jeQ
                        ? jeQ.Deserialize<JevQuestion>(JsonOpts)
                        : JsonSerializer.Deserialize<JevQuestion>(JsonSerializer.Serialize(kv.Value), JsonOpts);
                }
                catch (JsonException) { /* pergunta malformada: ignora */ }
                if (q is not null)
                    questions[kv.Key] = q;
            }
        }

        if (questions.Count == 0)
            return new { error = "No valid questions parsed for ask_jev" };

        var state = stateRaw is JsonElement jeState
            ? jeState.Deserialize<object>(JsonOpts) ?? stateRaw
            : stateRaw;

        JevResponse response;
        try
        {
            response = await _jev.EvaluateAsync(state, questions);
        }
        catch (Exception ex)
        {
            return new { error = $"Jev evaluation failed: {ex.Message}" };
        }
        LastJev = response;

        var answersDict = new Dictionary<string, object?>(StringComparer.OrdinalIgnoreCase);
        foreach (var kv in response.Answers)
        {
            answersDict[kv.Key] = kv.Value.Type switch
            {
                "noul" => new { type = "noul", noul = ((NoulAnswer)kv.Value).Noul },
                "choice" => new { type = "choice", choice = ((ChoiceAnswer)kv.Value).Choice, confidence = ((ChoiceAnswer)kv.Value).Confidence },
                "score" => new { type = "score", score = ((ScoreAnswer)kv.Value).Score, confidence = ((ScoreAnswer)kv.Value).Confidence },
                _ => new { type = kv.Value.Type },
            };
        }

        return new
        {
            ok = true,
            model = response.Model,
            answers = answersDict,
            usage = response.Usage,
        };
    }

    private static string? Str(Dictionary<string, object?> args, string key)
    {
        if (!args.TryGetValue(key, out var raw) || raw is null)
            return null;
        if (raw is JsonElement je)
            return je.ValueKind == JsonValueKind.String ? je.GetString() : je.ToString();
        return raw.ToString();
    }

    private static double? Num(Dictionary<string, object?> args, string key)
    {
        if (!args.TryGetValue(key, out var raw) || raw is null)
            return null;
        if (raw is JsonElement je)
        {
            if (je.ValueKind == JsonValueKind.Number && je.TryGetDouble(out var d))
                return d;
            if (je.ValueKind == JsonValueKind.String && double.TryParse(je.GetString(), out var ds))
                return ds;
            return null;
        }

        return double.TryParse(raw.ToString(), out var n) ? n : null;
    }

    public static string Serialize(object value) =>
        JsonSerializer.Serialize(value, JsonOpts);
}
