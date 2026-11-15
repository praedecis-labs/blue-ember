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
                ILoggerFactory loggerFactory,
                CancellationToken ct) =>
            {
                var logger = loggerFactory.CreateLogger("Agent");
                if (body is null || string.IsNullOrWhiteSpace(body.Message))
                    return Results.BadRequest(new ErrorResponse("message is required."));

                if (body.Message.Trim().Length < 4)
                    return Results.BadRequest(new ErrorResponse("message is too short."));

                var agents = providers.Ordered.Where(a => a.IsConfigured).ToList();
                if (agents.Count == 0)
                {
                    return Results.Json(
                        new ErrorResponse(
                            $"{providers.Current.DisplayName} agent is not configured. Check the provider's API key in configuration."),
                        statusCode: StatusCodes.Status503ServiceUnavailable);
                }

                AgentAskResponse? response = null;
                IAgentProvider? lastTried = null;
                Exception? lastError = null;
                foreach (var agent in agents)
                {
                    lastTried = agent;
                    try
                    {
                        response = await agent.AskAsync(body, ct);
                        break;
                    }
                    catch (OperationCanceledException) when (ct.IsCancellationRequested)
                    {
                        throw;
                    }
                    catch (Exception ex)
                    {
                        logger.LogWarning(
                            ex,
                            "Agent provider {Provider} failed; trying next fallback",
                            agent.DisplayName);
                        lastError = ex;
                    }
                }

                if (response is not null)
                    return Results.Ok(response);

                var failedAgent = lastTried ?? agents[^1];
                return lastError switch
                {
                    OperationCanceledException => Results.Json(
                        new ErrorResponse($"{failedAgent.DisplayName} request timed out."),
                        statusCode: StatusCodes.Status504GatewayTimeout),
                    InvalidOperationException ex => Results.Json(
                        new ErrorResponse(ex.Message),
                        statusCode: StatusCodes.Status502BadGateway),
                    _ => Results.Json(
                        new ErrorResponse(lastError?.Message ?? "Agent request failed."),
                        statusCode: StatusCodes.Status502BadGateway),
                };
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
