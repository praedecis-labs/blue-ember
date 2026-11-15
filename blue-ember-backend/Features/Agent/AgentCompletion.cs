using System.Text;

namespace BlueEmber.Api.Features.Agent;

/// <summary>
/// Peças compartilhadas do pipeline do agente: system prompt, contexto do
/// usuário, sanitização de prosa e finalização da resposta (fallback de
/// dashboard + montagem do AgentAskResponse). Providers só implementam o
/// loop de chat-com-tools do seu vendor.
/// </summary>
public static class AgentCompletion
{
    public static string SystemPromptFor(string? locale)
    {
        var pt = DashboardComposer.IsPortuguese(locale);
        if (pt)
        {
            return """
                Você é o assistente Blue Ember de segurança contra fogo em habitats espaciais.
                Responda sempre em português do Brasil.

                Estilo da resposta (obrigatório):
                - No máximo 4 a 6 frases curtas.
                - Texto puro: sem markdown (#, **, listas com - ou *, tabelas, emojis).
                - Sem seções longas; vá direto ao ponto.
                - Termine com uma última linha começando com "Próximo passo:" e um teste ou verificação concreta que reduziria a incerteza (não é recomendação de segurança).

                Dados:
                - Use as ferramentas para ranking, lacunas e fichas NASA PSI.
                - ask_jev é opcional; se falhar ou não estiver disponível, continue só com ranking/gaps/PSI.
                - Cite só o que as tools retornaram; não invente IDs, DOI, scores ou resultados.
                - O score do ranking mede a relevância da investigação para o caso (0–10), não o risco de ignição nem a inflamabilidade do material.
                - Nunca afirme que um material ou cenário é seguro ou inseguro: diga o que os testes da NASA cobrem, o que falta testar e a força da evidência.

                Dashboards:
                - Se o usuário pedir dashboard, painel, visualização, periculosidade ou previsibilidade/predição:
                  1) chame get_fire_safety_ranking e/ou get_coverage_gaps;
                  2) chame compose_dashboard.
                - Widgets permitidos: materialHazard, scenarioPredictability, insight.
                - Sempre inclua um insight com leitura + legendas (o que cada nível/pill significa).
                - Para previsibilidade Iss/Moon/Mars: high na ISS; medium/low em Lua/Marte (gravidade parcial).
                - Títulos e textos do dashboard em português do Brasil.
                - Na prosa do chat: só 1–2 frases introduzindo o painel; o detalhe fica no insight do dashboard.
                """;
        }

        return """
            You are the Blue Ember assistant for fire safety in space habitats.
            Always respond in English.

            Response style (required):
            - At most 4 to 6 short sentences.
            - Plain text only: no markdown (#, **, lists with - or *, tables, emojis).
            - No long sections; get straight to the point.
            - End with a final line starting with "Next step:" naming one concrete test or check that would reduce the uncertainty (not a safety recommendation).

            Data:
            - Use the tools for ranking, gaps, and NASA PSI investigation records.
            - ask_jev is optional; if it fails or is unavailable, continue with ranking/gaps/PSI only.
            - Cite only what the tools returned; do not invent IDs, DOIs, scores, or results.
            - The ranking score measures how relevant an investigation is to the case (0–10), not ignition risk or material flammability.
            - Never state that a material or scenario is safe or unsafe: say what NASA tests cover, what still needs testing, and how strong the evidence is.

            Dashboards:
            - If the user asks for a dashboard, panel, visualization, hazard, or predictability/prediction:
              1) call get_fire_safety_ranking and/or get_coverage_gaps;
              2) call compose_dashboard.
            - Allowed widgets: materialHazard, scenarioPredictability, insight.
            - Always include an insight with reading + legends (what each level/pill means).
            - For Iss/Moon/Mars predictability: high on ISS; medium/low on Moon/Mars (partial gravity).
            - Dashboard titles and copy in English.
            - In chat prose: only 1–2 sentences introducing the panel; detail stays in the dashboard insight.
            """;
    }

    /// <summary>Contexto estruturado da UI + mensagem do usuário, em texto puro.</summary>
    public static string BuildUserContext(AgentAskRequest request)
    {
        var context = new StringBuilder();
        context.AppendLine("Contexto estruturado da UI (já parseado):");
        context.AppendLine($"- profile: {request.Profile ?? "Student"}");
        context.AppendLine($"- environment: {request.Environment ?? request.Query?.Env ?? "Moon"}");
        if (!string.IsNullOrWhiteSpace(request.Category))
            context.AppendLine($"- category: {request.Category}");
        if (request.Query is { } q)
        {
            context.AppendLine(
                $"- query: env={q.Env}, material={q.Material}, o2={q.O2}, psi={q.Psi}, flow={q.Flow}, goal={q.Goal}, claim={q.Claim}");
        }

        context.AppendLine();
        context.AppendLine("Mensagem do usuário:");
        context.Append(request.Message.Trim());

        return context.ToString();
    }

    /// <summary>Strip common markdown so the chat bubble stays plain and short.</summary>
    public static string SanitizeProse(string text)
    {
        if (string.IsNullOrWhiteSpace(text)) return text;
        var lines = text.Replace("\r\n", "\n").Split('\n');
        var cleaned = new List<string>();
        foreach (var raw in lines)
        {
            var line = raw.Trim();
            if (line.Length == 0) continue;
            while (line.StartsWith('#'))
                line = line.TrimStart('#').TrimStart();
            if (line.StartsWith("- ") || line.StartsWith("* "))
                line = line[2..].TrimStart();
            line = line.Replace("**", "").Replace("__", "").Replace("`", "");
            if (line.Length > 0)
                cleaned.Add(line);
        }

        // Keep at most ~6 sentences worth of lines.
        if (cleaned.Count > 6)
            cleaned = cleaned.Take(6).ToList();

        return string.Join(" ", cleaned).Trim();
    }

    /// <summary>
    /// Monta o AgentAskResponse final: fallback de texto, dashboard default
    /// quando o modelo esqueceu compose_dashboard, e coleta das tools usadas.
    /// </summary>
    public static async Task<AgentAskResponse> FinalizeAsync(
        AgentAskRequest request,
        AgentTools tools,
        string? finalText,
        CancellationToken ct)
    {
        var dashboard = tools.LastDashboard;
        if (dashboard is null && DashboardComposer.LooksLikeDashboardRequest(request.Message))
        {
            // Ensure we have data for the default dashboard when the model skipped compose_dashboard.
            if (tools.LastRanking is null)
            {
                await tools.ExecuteAsync("get_fire_safety_ranking", new Dictionary<string, object?>
                {
                    ["profile"] = request.Profile ?? "Student",
                    ["environment"] = request.Environment ?? request.Query?.Env ?? "Moon",
                    ["category"] = request.Category,
                });
            }

            if (tools.LastGaps is null)
            {
                await tools.ExecuteAsync("get_coverage_gaps", new Dictionary<string, object?>
                {
                    ["environment"] = request.Environment ?? request.Query?.Env ?? "Moon",
                });
            }

            dashboard = DashboardComposer.DefaultInterpretive(
                tools.LastRanking?.Environment ?? request.Environment,
                request.Locale);
        }

        if (string.IsNullOrWhiteSpace(finalText))
        {
            var pt = DashboardComposer.IsPortuguese(request.Locale);
            if (dashboard is not null)
            {
                finalText = pt
                    ? "Montei o painel com o ranking e as lacunas disponíveis. " +
                      "A leitura e as legendas estão no dashboard abaixo."
                    : "I built the panel from the available ranking and gaps. " +
                      "The reading and legends are in the dashboard below.";
            }
            else if (tools.LastRanking is not null || tools.LastGaps is not null)
            {
                finalText = pt
                    ? "Consultei ranking e lacunas, mas o modelo não fechou a prosa. " +
                      "Use os detalhes e as fontes abaixo, ou peça um dashboard."
                    : "I pulled ranking and gaps, but the model did not finish the prose. " +
                      "Use the details and sources below, or ask for a dashboard.";
            }
            else
            {
                finalText = pt
                    ? "Consultei as ferramentas disponíveis, mas não consegui fechar uma resposta em prosa. " +
                      "Tente reformular a hipótese com ambiente e material."
                    : "I used the available tools but could not finish a prose answer. " +
                      "Try rephrasing the hypothesis with environment and material.";
            }
        }

        return new AgentAskResponse(
            SanitizeProse(finalText),
            tools.LastRanking,
            tools.LastGaps,
            tools.ToolsUsed.Distinct().ToList(),
            dashboard);
    }
}
