using BlueEmber.Api.Domain.Prediction;
using BlueEmber.Api.Features.Contracts;
using BlueEmber.Api.Features.Prediction;
using Microsoft.AspNetCore.Mvc;

namespace BlueEmber.Api.Features.Prediction;

public static class PredictionEndpoints
{
    public static IEndpointRouteBuilder MapPredictionEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/prediction").WithTags("Predição de inflamabilidade (Objetivo 2)");

        group.MapGet("/flammability", (
            FlammabilityPredictionService service,
            string? category,
            bool featured = true) =>
        {
            var response = service.PredictAll(category, featured);
            return Results.Ok(new PredictionResponseDto(
                response.Count,
                response.AboveFlammabilityLimitCount,
                response.CriticalCount,
                response.Items.Select(p => new PredictionItemDto(
                    p.InvestigationId,
                    p.InvestigationTitle,
                    p.Category,
                    p.Prediction.ConditionMaterial,
                    p.Prediction.ConditionRegime,
                    p.Prediction.O2Percent,
                    p.Prediction.PressureKpa,
                    p.Prediction.FlowSpeedCms,
                    p.Prediction.PpO2Kpa,
                    p.Prediction.IgnitionProbability,
                    p.Prediction.RiskLevel,
                    p.Prediction.AboveFlammabilityLimit,
                    p.Prediction.FlammabilityLimitPpO2Kpa,
                    p.Prediction.Provenance)).ToList()));
        })
        .WithName("GetFlammabilityPredictions")
        .Produces<PredictionResponseDto>(StatusCodes.Status200OK)
        .WithOpenApi(op =>
        {
            op.Summary = "Predição de risco de inflamabilidade (Objetivo 2 do desafio).";
            op.Description = "Aplica regressão logística mínima sobre ppO2 (pressão parcial de O2), fluxo e regime para cada investigação. " +
                             "Retorna o pior caso (maior probabilidade de ignição) por investigação.";
            return op;
        });

        group.MapGet("/flammability/{investigationId}", (
            FlammabilityPredictionService service,
            string investigationId) =>
        {
            var pred = service.PredictOne(investigationId);
            if (pred is null)
                return Results.NotFound(new { error = $"Investigation '{investigationId}' not found." });

            return Results.Ok(new PredictionItemDto(
                pred.InvestigationId,
                pred.InvestigationTitle,
                pred.Category,
                pred.Prediction.ConditionMaterial,
                pred.Prediction.ConditionRegime,
                pred.Prediction.O2Percent,
                pred.Prediction.PressureKpa,
                pred.Prediction.FlowSpeedCms,
                pred.Prediction.PpO2Kpa,
                pred.Prediction.IgnitionProbability,
                pred.Prediction.RiskLevel,
                pred.Prediction.AboveFlammabilityLimit,
                pred.Prediction.FlammabilityLimitPpO2Kpa,
                pred.Prediction.Provenance));
        })
        .WithName("GetFlammabilityPredictionById")
        .Produces<PredictionItemDto>(StatusCodes.Status200OK)
        .Produces(StatusCodes.Status404NotFound)
        .WithOpenApi(op =>
        {
            op.Summary = "Predição de risco de inflamabilidade para uma investigação específica.";
            return op;
        });

        return app;
    }
}
