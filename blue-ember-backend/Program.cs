using BlueEmber.Api.Domain.Scoring;
using BlueEmber.Api.Features.Agent;
using BlueEmber.Api.Features.Export;
using BlueEmber.Api.Features.Gaps;
using BlueEmber.Api.Features.Health;
using BlueEmber.Api.Features.Investigations;
using BlueEmber.Api.Features.Jev;
using BlueEmber.Api.Features.Nasa;
using BlueEmber.Api.Features.Ranking;
using BlueEmber.Api.Infrastructure.Data;
using BlueEmber.Api.Infrastructure.Jev;
using BlueEmber.Api.Infrastructure.NasaPsi;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
        policy.WithOrigins("http://localhost:3000")
            .AllowAnyHeader()
            .AllowAnyMethod());
});

builder.Services.Configure<NasaPsiOptions>(builder.Configuration.GetSection(NasaPsiOptions.SectionName));
builder.Services.Configure<DataOptions>(builder.Configuration.GetSection(DataOptions.SectionName));
builder.Services.Configure<AgentOptions>(builder.Configuration.GetSection(AgentOptions.SectionName));
builder.Services.Configure<NvidiaOptions>(builder.Configuration.GetSection(NvidiaOptions.SectionName));
builder.Services.Configure<GeminiOptions>(builder.Configuration.GetSection(GeminiOptions.SectionName));
builder.Services.Configure<JevOptions>(builder.Configuration.GetSection(JevOptions.SectionName));

builder.Services.AddHttpClient<JevClient>((sp, client) =>
{
    var opts = sp.GetRequiredService<Microsoft.Extensions.Options.IOptions<JevOptions>>().Value;
    client.BaseAddress = new Uri(opts.BaseUrl);
    client.Timeout = TimeSpan.FromSeconds(opts.TimeoutSeconds);
    client.DefaultRequestHeaders.Accept.ParseAdd("application/json");
    if (!string.IsNullOrWhiteSpace(opts.ApiKey))
        client.DefaultRequestHeaders.Authorization = new("Bearer", opts.ApiKey);
});

builder.Services.AddHttpClient<NasaPsiClient>((sp, client) =>
{
    var opts = sp.GetRequiredService<Microsoft.Extensions.Options.IOptions<NasaPsiOptions>>().Value;
    client.Timeout = TimeSpan.FromSeconds(opts.TimeoutSeconds);
    client.DefaultRequestHeaders.Accept.ParseAdd("application/json");
});

builder.Services.AddHttpClient("nvidia", (sp, client) =>
{
    var opts = sp.GetRequiredService<Microsoft.Extensions.Options.IOptions<NvidiaOptions>>().Value;
    client.BaseAddress = new Uri(opts.BaseUrl);
    client.Timeout = TimeSpan.FromSeconds(opts.TimeoutSeconds);
    client.DefaultRequestHeaders.Accept.ParseAdd("application/json");
    if (!string.IsNullOrWhiteSpace(opts.ApiKey))
        client.DefaultRequestHeaders.Authorization =
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", opts.ApiKey);
});

builder.Services.AddHttpClient("gemini", client =>
{
    client.Timeout = TimeSpan.FromSeconds(180);
    client.DefaultRequestHeaders.Accept.ParseAdd("application/json");
});

builder.Services.AddSingleton<IInvestigationRepository, JsonInvestigationStore>();
builder.Services.AddSingleton<ScoreCalculator>();
builder.Services.AddSingleton<RankingQueryService>();
builder.Services.AddScoped<JevValidationService>();
builder.Services.AddSingleton<GapsQueryService>();
builder.Services.AddSingleton<InvestigationQueryService>();
builder.Services.AddScoped<AgentTools>();
builder.Services.AddSingleton<NvidiaAgentProvider>();
builder.Services.AddSingleton<IAgentProvider>(sp => sp.GetRequiredService<NvidiaAgentProvider>());
builder.Services.AddSingleton<GeminiAgentProvider>();
builder.Services.AddSingleton<IAgentProvider>(sp => sp.GetRequiredService<GeminiAgentProvider>());
builder.Services.AddSingleton<AgentProviderResolver>();
builder.Services.AddScoped<NasaRefreshService>();
builder.Services.AddHostedService<InvestigationCacheRefreshWorker>();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors();
app.UseHttpsRedirection();

app.MapHealthEndpoints();
app.MapInvestigationEndpoints();
app.MapRankingEndpoints();
app.MapGapEndpoints();
app.MapExportEndpoints();
app.MapNasaEndpoints();
app.MapAgentEndpoints();
app.MapJevEndpoints();

await BootstrapInvestigationsAsync(app);

app.Run();

static async Task BootstrapInvestigationsAsync(WebApplication app)
{
    using var scope = app.Services.CreateScope();
    var repo = scope.ServiceProvider.GetRequiredService<IInvestigationRepository>();
    var logger = scope.ServiceProvider.GetRequiredService<ILoggerFactory>().CreateLogger("Bootstrap");

    await repo.LoadFromDiskAsync();
    if (repo.GetAll().Count > 0)
    {
        var info = repo.GetCacheInfo();
        logger.LogInformation(
            "Bootstrapped {Count} investigations from disk cache (source={Source}, loadedAt={LoadedAt})",
            info.Count,
            info.Source,
            info.LastLoadedAtUtc);
        return;
    }

    logger.LogWarning("Disk cache empty; attempting NASA PSI GEODE fallback");
    try
    {
        var refresh = scope.ServiceProvider.GetRequiredService<NasaRefreshService>();
        var result = await refresh.RefreshAsync();
        if (result.Refreshed)
        {
            logger.LogInformation("Bootstrapped {Count} investigations from NASA PSI GEODE", result.Count);
        }
        else
        {
            logger.LogError("NASA PSI GEODE bootstrap failed: {Error}", result.Error);
        }
    }
    catch (Exception ex)
    {
        logger.LogError(ex, "Failed to bootstrap investigations from NASA PSI GEODE");
    }
}
