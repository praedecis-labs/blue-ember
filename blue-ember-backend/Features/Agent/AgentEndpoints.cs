using BlueEmber.Api.Features.Contracts;
using Microsoft.AspNetCore.Mvc;

namespace BlueEmber.Api.Features.Agent;

public static class AgentEndpoints
{
    public static IEndpointRouteBuilder MapAgentEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapPost("/api/agent/ask", async (
                [FromBody] AgentAskRequest? body,
                AgentProviderResolver providers,
                CancellationToken ct) =>
            {
                if (body is null || string.IsNullOrWhiteSpace(body.Message))
                    return Results.BadRequest(new ErrorResponse("message is required."));

                if (body.Message.Trim().Length < 4)
                    return Results.BadRequest(new ErrorResponse("message is too short."));

                var agent = providers.Current;

                if (!agent.IsConfigured)
                {
                    return Results.Json(
                        new ErrorResponse(
                            $"{agent.DisplayName} agent is not configured. Check the provider's API key in configuration."),
                        statusCode: StatusCodes.Status503ServiceUnavailable);
                }

                try
                {
                    var response = await agent.AskAsync(body, ct);
                    return Results.Ok(response);
                }
                catch (OperationCanceledException) when (!ct.IsCancellationRequested)
                {
                    return Results.Json(
                        new ErrorResponse($"{agent.DisplayName} request timed out."),
                        statusCode: StatusCodes.Status504GatewayTimeout);
                }
                catch (InvalidOperationException ex)
                {
                    return Results.Json(
                        new ErrorResponse(ex.Message),
                        statusCode: StatusCodes.Status502BadGateway);
                }
            })
            .WithName("AgentAsk")
            .WithTags("Agent")
            .Produces<AgentAskResponse>(StatusCodes.Status200OK)
            .Produces<ErrorResponse>(StatusCodes.Status400BadRequest)
            .Produces<ErrorResponse>(StatusCodes.Status502BadGateway)
            .Produces<ErrorResponse>(StatusCodes.Status503ServiceUnavailable)
            .WithOpenApi(op =>
            {
                op.Summary =
                    "Agente com LLM + tools (ranking, gaps, investigations, Jev). Provedor via Agent:Provider.";
                return op;
            });

        return app;
    }
}
