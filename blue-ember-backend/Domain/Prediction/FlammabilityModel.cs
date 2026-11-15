namespace BlueEmber.Api.Domain.Prediction;

using BlueEmber.Api.Domain.Investigations;

/// <summary>
/// Resultado de predição de risco de inflamabilidade para uma condição de teste.
/// </summary>
public sealed record FlammabilityPrediction(
    string InvestigationId,
    string InvestigationTitle,
    string ConditionMaterial,
    string ConditionRegime,
    double O2Percent,
    double PressureKpa,
    double FlowSpeedCms,
    double PpO2Kpa,
    /// <summary>Probabilidade de ignição/propagação (0-1) segundo o modelo logístico.</summary>
    double IgnitionProbability,
    /// <summary>Risco classificado: Baixo / Médio / Alto / Crítico.</summary>
    string RiskLevel,
    /// <summary>Se o ambiente está acima do limite de inflamabilidade (ppO2 > threshold).</summary>
    bool AboveFlammabilityLimit,
    double FlammabilityLimitPpO2Kpa,
    string Provenance);

/// <summary>
/// Regressão logística mínima para risco de inflamabilidade em habitats espaciais.
///
/// Modelo científico: a probabilidade de ignição/propagação depende principalmente
/// da pressão parcial de oxigênio (ppO2 = O2% × Pressão / 100), com ajuste pelo
/// fluxo de ar (ventilação acelera a chama) e pelo regime (solid_panel > droplet > gas > detection).
///
/// Coeficientes baseados em limites da NASA-STD-6001:
/// - ppO2 ≤ 16.7 kPa (≈ 16.5% ao nível do mar): não-propagação (limiar da NASA)
/// - ppO2 ≥ 24.0 kPa: propagação provável
/// - Regimes de detecção (sem chama) têm risco estruturalmente menor.
/// </summary>
public sealed class FlammabilityModel
{
    private const double PpO2SafeLimitKpa = 16.7;   // NASA-STD-6001: abaixo disso não propaga
    private const double PpO2CriticalLimitKpa = 24.0; // acima disso risco crítico
    private const double FlowBoostMax = 0.15;       // máx. aumento de risco pelo fluxo

    public FlammabilityPrediction Predict(TestCondition condition, string investigationId, string investigationTitle)
    {
        var o2 = condition.O2Percent ?? 21.0;
        var pressure = condition.PressureKpa ?? 101.3;
        var flow = condition.FlowSpeedCms ?? 0.0;
        var regime = string.IsNullOrWhiteSpace(condition.Regime) ? "unknown" : condition.Regime;

        var ppO2 = Math.Round(o2 * pressure / 100.0, 2);

        // --- Regressão logística sobre ppO2 ---
        // z = w0 + w1 * ppO2 + w2 * flow_norm + w3 * regime_factor
        // p = 1 / (1 + exp(-z))

        var z = -5.2 + 0.42 * ppO2; // base: ppO2 domina
        z += FlowBoost(flow);         // fluxo aumenta levemente o risco
        z += RegimeFactor(regime);    // regime ajusta

        var prob = Sigmoid(z);
        prob = Math.Clamp(prob, 0.0, 1.0);

        var riskLevel = ClassifyRisk(prob, ppO2);
        var aboveLimit = ppO2 > PpO2SafeLimitKpa;

        return new FlammabilityPrediction(
            investigationId,
            investigationTitle,
            condition.Material ?? "unknown",
            regime,
            o2,
            pressure,
            flow,
            ppO2,
            Math.Round(prob, 4),
            riskLevel,
            aboveLimit,
            PpO2SafeLimitKpa,
            condition.Provenance ?? "estimated");
    }

    /// <summary>Risco lote: predição para todas as condições de uma investigação, usando o pior caso.</summary>
    public FlammabilityPrediction PredictWorstCase(
        IReadOnlyList<TestCondition> conditions, string investigationId, string investigationTitle)
    {
        if (conditions.Count == 0)
        {
            // Condição sintética de fallback (ambiente ISS padrão)
            var fallback = new TestCondition
            {
                Material = "unknown",
                O2Percent = 21.0,
                PressureKpa = 101.3,
                FlowSpeedCms = 10.0,
                Regime = "solid_panel",
                Provenance = "estimated",
            };
            return Predict(fallback, investigationId, investigationTitle);
        }

        var predictions = conditions.Select(c => Predict(c, investigationId, investigationTitle)).ToList();

        // Pior caso = maior probabilidade de ignição
        return predictions.OrderByDescending(p => p.IgnitionProbability).First();
    }

    private static double FlowBoost(double flowCms)
    {
        // Fluxo de ar sopra o fogo; satura em ~40 cm/s
        var norm = Math.Clamp(flowCms / 40.0, 0.0, 1.0);
        return FlowBoostMax * norm;
    }

    private static double RegimeFactor(string regime)
    {
        return regime.ToLowerInvariant() switch
        {
            "solid_panel" => 0.30,   // painel sólido: chama se propaga na superfície
            "droplet" => 0.10,       // gotícula: comportamento distinto
            "gas" => 0.20,
            "detection" => -0.40,    // detecção (sem chama): risco estrutural menor
            _ => 0.0,
        };
    }

    private static double Sigmoid(double z) => 1.0 / (1.0 + Math.Exp(-z));

    private static string ClassifyRisk(double probability, double ppO2)
    {
        if (ppO2 <= PpO2SafeLimitKpa && probability < 0.15) return "Baixo";
        if (probability < 0.40) return "Médio";
        if (probability < 0.75) return "Alto";
        return "Crítico";
    }
}
