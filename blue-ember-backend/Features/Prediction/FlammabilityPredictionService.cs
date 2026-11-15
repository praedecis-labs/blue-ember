using BlueEmber.Api.Domain.Investigations;
using BlueEmber.Api.Domain.Prediction;
using BlueEmber.Api.Infrastructure.Data;

namespace BlueEmber.Api.Features.Prediction;

/// <summary>
/// Serviço de predição de risco de inflamabilidade (Objetivo 2 do desafio: extract data that supports predictive modeling).
/// Aplica um modelo logístico mínimo sobre ppO2 (pressão parcial de oxigênio), fluxo e regime
/// para cada condição de teste de cada investigação.
/// </summary>
public sealed class FlammabilityPredictionService
{
    private readonly IInvestigationRepository _repo;
    private readonly FlammabilityModel _model = new();

    public FlammabilityPredictionService(IInvestigationRepository repo)
    {
        _repo = repo;
    }

    public PredictionResponse PredictAll(string? category = null, bool featuredOnly = false)
    {
        var query = _repo.GetAll().ToList();
        if (featuredOnly)
            query = query.Where(i => i.IsFeaturedFireSafety).ToList();
        if (!string.IsNullOrWhiteSpace(category))
            query = query.Where(i => i.Category.Equals(category, StringComparison.OrdinalIgnoreCase)).ToList();

        var predictions = new List<InvestigationPrediction>();
        foreach (var inv in query)
        {
            var pred = _model.PredictWorstCase(inv.TestConditions, inv.Id, inv.Title);
            predictions.Add(new InvestigationPrediction(
                inv.Id,
                inv.Title,
                inv.Category,
                pred));
        }

        // Ordena por pior caso (maior probabilidade primeiro)
        predictions = predictions
            .OrderByDescending(p => p.Prediction.IgnitionProbability)
            .ToList();

        var aboveLimit = predictions.Count(p => p.Prediction.AboveFlammabilityLimit);
        var critical = predictions.Count(p => p.Prediction.RiskLevel == "Crítico");

        return new PredictionResponse(
            predictions.Count,
            aboveLimit,
            critical,
            predictions);
    }

    public InvestigationPrediction? PredictOne(string investigationId)
    {
        var inv = _repo.GetById(investigationId);
        if (inv is null) return null;

        var pred = _model.PredictWorstCase(inv.TestConditions, inv.Id, inv.Title);
        return new InvestigationPrediction(inv.Id, inv.Title, inv.Category, pred);
    }
}

public sealed record InvestigationPrediction(
    string InvestigationId,
    string InvestigationTitle,
    string Category,
    FlammabilityPrediction Prediction);

public sealed record PredictionResponse(
    int Count,
    int AboveFlammabilityLimitCount,
    int CriticalCount,
    IReadOnlyList<InvestigationPrediction> Items);
