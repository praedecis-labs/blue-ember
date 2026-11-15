using BlueEmber.Api.Features.Contracts;
using Microsoft.OpenApi.Models;

namespace BlueEmber.Api.Features.Gaps;

public static class GapEndpoints
{
    public static IEndpointRouteBuilder MapGapEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapGet("/api/gaps", (GapsQueryService gaps, string? environment) =>
        {
            if (!gaps.TryBuild(environment, out var response, out var error))
                return Results.BadRequest(new ErrorResponse(error!));

            return Results.Ok(response);
        })
        .WithName("GetGaps")
        .WithTags("Gaps")
        .Produces<GapsResponse>(StatusCodes.Status200OK)
        .Produces<ErrorResponse>(StatusCodes.Status400BadRequest)
        .WithOpenApi(op =>
        {
            op.Summary = "Grade O2×pressão e gaps (sempre featured fire-safety).";
            DescribeQuery(op, "environment", "Opcional. Default: Moon. Valores: Iss, Moon, Mars.");
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
