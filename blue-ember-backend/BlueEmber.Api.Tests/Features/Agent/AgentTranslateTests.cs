using System.Net;
using System.Text;
using BlueEmber.Api.Features.Agent;
using Microsoft.Extensions.Options;

namespace BlueEmber.Api.Tests.Features.Agent;

public sealed class AgentTranslateTests
{
    private sealed class StubHandler(Func<HttpRequestMessage, HttpResponseMessage> respond)
        : HttpMessageHandler
    {
        public readonly List<Uri?> RequestedUris = [];

        protected override Task<HttpResponseMessage> SendAsync(
            HttpRequestMessage request, CancellationToken cancellationToken)
        {
            RequestedUris.Add(request.RequestUri);
            return Task.FromResult(respond(request));
        }
    }

    private sealed class StubFactory(Dictionary<string, StubHandler> handlers)
        : IHttpClientFactory
    {
        public HttpClient CreateClient(string name) =>
            new(handlers[name]) { BaseAddress = new Uri("https://stub.local") };
    }

    private static HttpResponseMessage Json(string body, HttpStatusCode status = HttpStatusCode.OK) =>
        new(status)
        {
            Content = new StringContent(body, Encoding.UTF8, "application/json"),
        };

    private static AgentTranslator CreateTranslator(
        StubFactory factory,
        string? nvidiaKey = null,
        string? geminiKey = null,
        string agentProvider = "nvidia") =>
        new(
            factory,
            Options.Create(new AgentOptions { Provider = agentProvider }),
            Options.Create(new GeminiOptions { ApiKey = geminiKey ?? "" }),
            Options.Create(new NvidiaOptions { ApiKey = nvidiaKey ?? "" }));

    [Fact]
    public async Task TranslateAsync_prefers_gemini_when_both_providers_have_keys()
    {
        var gemini = new StubHandler(_ => Json("""
            {"candidates":[{"content":{"parts":[{"text":"Olá mundo"}]}}]}
            """));
        var nvidia = new StubHandler(_ => Json("""
            {"choices":[{"message":{"content":"Hi world"}}]}
            """));
        var translator = CreateTranslator(
            new StubFactory(new() { ["gemini"] = gemini, ["nvidia"] = nvidia }),
            nvidiaKey: "nv-key",
            geminiKey: "gm-key");

        var result = await translator.TranslateAsync("Hello world", "pt-BR", CancellationToken.None);

        Assert.Equal("Olá mundo", result.Text);
        Assert.Equal("gemini", result.Provider);
        Assert.Single(gemini.RequestedUris);
        Assert.Empty(nvidia.RequestedUris);
    }

    [Fact]
    public async Task TranslateAsync_falls_back_to_nvidia_when_gemini_fails()
    {
        var gemini = new StubHandler(_ => Json("""{"error":{"message":"quota exceeded"}}""", HttpStatusCode.TooManyRequests));
        var nvidia = new StubHandler(_ => Json("""
            {"choices":[{"message":{"content":"Olá mundo"}}]}
            """));
        var translator = CreateTranslator(
            new StubFactory(new() { ["gemini"] = gemini, ["nvidia"] = nvidia }),
            nvidiaKey: "nv-key",
            geminiKey: "gm-key");

        var result = await translator.TranslateAsync("Hello world", "pt-BR", CancellationToken.None);

        Assert.Equal("Olá mundo", result.Text);
        Assert.Equal("nvidia", result.Provider);
        Assert.Single(nvidia.RequestedUris);
    }

    [Fact]
    public async Task TranslateAsync_uses_nvidia_when_only_nvidia_is_configured()
    {
        var nvidia = new StubHandler(_ => Json("""
            {"choices":[{"message":{"content":"Hello world"}}]}
            """));
        var translator = CreateTranslator(
            new StubFactory(new() { ["gemini"] = new StubHandler(_ => throw new InvalidOperationException("must not be called")), ["nvidia"] = nvidia }),
            nvidiaKey: "nv-key");

        var result = await translator.TranslateAsync("Olá mundo", "en", CancellationToken.None);

        Assert.Equal("Hello world", result.Text);
        Assert.Equal("nvidia", result.Provider);
        Assert.Single(nvidia.RequestedUris);
        Assert.Contains("/chat/completions", nvidia.RequestedUris[0]!.ToString());
    }

    [Fact]
    public async Task TranslateAsync_throws_when_no_provider_is_configured()
    {
        var translator = CreateTranslator(
            new StubFactory(new()),
            agentProvider: "nvidia");

        await Assert.ThrowsAsync<InvalidOperationException>(
            () => translator.TranslateAsync("Hello", "pt-BR", CancellationToken.None));
    }
}
