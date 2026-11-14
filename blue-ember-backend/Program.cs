using BlueEmber.Api.Domain.Scoring;
using BlueEmber.Api.Features.Export;
using BlueEmber.Api.Features.Gaps;
using BlueEmber.Api.Features.Health;
using BlueEmber.Api.Features.Investigations;
using BlueEmber.Api.Features.Nasa;
using BlueEmber.Api.Features.Ranking;
using BlueEmber.Api.Infrastructure.Data;
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

builder.Services.AddHttpClient<NasaPsiClient>((sp, client) =>
{
    var opts = sp.GetRequiredService<Microsoft.Extensions.Options.IOptions<NasaPsiOptions>>().Value;
    client.Timeout = TimeSpan.FromSeconds(opts.TimeoutSeconds);
    client.DefaultRequestHeaders.Accept.ParseAdd("application/json");
});

builder.Services.AddSingleton<IInvestigationRepository, JsonInvestigationStore>();
builder.Services.AddSingleton<ScoreCalculator>();

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
        logger.LogInformation("Bootstrapped {Count} investigations from disk cache", repo.GetAll().Count);
        return;
    }

    logger.LogWarning("Disk cache empty; attempting NASA PSI GEODE fallback");
    try
    {
        var client = scope.ServiceProvider.GetRequiredService<NasaPsiClient>();
        var fetched = await client.FetchInvestigationsAsync();
        if (fetched.Count > 0)
        {
            repo.ReplaceAll(fetched);
            logger.LogInformation("Bootstrapped {Count} investigations from NASA PSI GEODE", fetched.Count);
        }
        else
        {
            logger.LogError("NASA PSI GEODE returned zero investigations");
        }
    }
    catch (Exception ex)
    {
        logger.LogError(ex, "Failed to bootstrap investigations from NASA PSI GEODE");
    }
}
