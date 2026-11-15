using BlueEmber.Api.Domain.Environments;
using BlueEmber.Api.Domain.Investigations;
using BlueEmber.Api.Domain.Profiles;
using BlueEmber.Api.Domain.Scoring;
using BlueEmber.Api.Features.Contracts;
using BlueEmber.Api.Features.Jev;
using BlueEmber.Api.Infrastructure.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.OpenApi.Models;

namespace BlueEmber.Api.Features.Jev;

public static class JevEndpoints
{
    public static IEndpointRouteBuilder MapJevEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/jev").WithTags("Jev (TypeSafe AI)");

        group.MapPost("/validate", async (
            IInvestigationRepository repo,
            JevValidationService validation,
            string? profile,
            string? environment,
            string investigationId,
            double? w1, double? w2, double? w3, double? w4, double? w5,
            CancellationToken ct) =>
        {
            if (string.IsNullOrWhiteSpace(investigationId))
                return Results.BadRequest(new ErrorResponse("investigationId is required."));

            var inv = repo.GetById(investigationId);
            if (inv is null)
                return Results.NotFound(new ErrorResponse($"Investigation '{investigationId}' not found."));

            if (!UserProfileCatalog.TryParse(profile, out var userProfile))
                return Results.BadRequest(new ErrorResponse("Invalid profile. Use Student, Researcher, or ShipEngineer."));

            if (!MissionEnvironmentCatalog.TryParse(environment, out var missionEnv))
                return Results.BadRequest(new ErrorResponse("Invalid environment. Use Iss, Moon, or Mars."));

            var weights = ScoreWeights.TryFromOverrides(w1, w2, w3, w4, w5)
                          ?? ScoreWeights.For(userProfile);

            var result = await validation.ValidateAsync(inv, missionEnv, weights, ct);

            return Results.Ok(result);
        })
        .WithName("ValidateWithJev")
        .Produces<JevValidationResult>(StatusCodes.Status200OK)
        .Produces<ErrorResponse>(StatusCodes.Status400BadRequest)
        .Produces<ErrorResponse>(StatusCodes.Status404NotFound)
        .WithOpenApi(op =>
        {
            op.Summary = "Validate an investigation score with TypeSafe Jev atomic judgments (C1-C5).";
            DescribeQuery(op, "investigationId", "Obrigatório. ID da investigação (ex.: PSI-99).");
            DescribeQuery(op, "profile", "Opcional. Default: Student. Valores: Student, Researcher, ShipEngineer.");
            DescribeQuery(op, "environment", "Opcional. Default: Moon. Valores: Iss, Moon, Mars.");
            DescribeQuery(op, "w1", "Opcional. Override peso C1.");
            DescribeQuery(op, "w2", "Opcional. Override peso C2.");
            DescribeQuery(op, "w3", "Opcional. Override peso C3.");
            DescribeQuery(op, "w4", "Opcional. Override peso C4.");
            DescribeQuery(op, "w5", "Opcional. Override peso C5.");
            return op;
        });

        return app;
    }

    private static void DescribeQuery(OpenApiOperation op, string name, string description)
    {
        var param = op.Parameters?.FirstOrDefault(p => p.Name == name);
        if (param is not null)
            param.Description = description;
    }
}
