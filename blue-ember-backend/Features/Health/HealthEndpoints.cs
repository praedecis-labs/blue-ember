namespace BlueEmber.Api.Features.Health;

public static class HealthEndpoints
{
    public static IEndpointRouteBuilder MapHealthEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapGet("/api/health", () => Results.Ok(new HealthResponse("ok", "BlueEmber.Api")))
            .WithName("Health")
            .WithTags("Health")
            .WithOpenApi();

        return app;
    }
}
