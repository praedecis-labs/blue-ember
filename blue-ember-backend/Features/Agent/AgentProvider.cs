using Microsoft.Extensions.Options;

namespace BlueEmber.Api.Features.Agent;

/// <summary>Configuração de seleção do provedor de LLM do agente.</summary>
public sealed class AgentOptions
{
    public const string SectionName = "Agent";

    /// <summary>Chave do provedor registrado (ex.: "gemini"). Case-insensitive.</summary>
    public string Provider { get; set; } = "gemini";
}

/// <summary>
/// Provedor de LLM com tool calling. Cada implementação encapsula um vendor
/// (Gemini, OpenAI, Anthropic...) e seu formato de wire; tools e orquestração
/// de resposta ficam fora.
/// </summary>
public interface IAgentProvider
{
    /// <summary>Chave usada em Agent:Provider para selecionar este provedor.</summary>
    string ProviderKey { get; }

    /// <summary>Nome amigável para logs e mensagens de erro.</summary>
    string DisplayName { get; }

    bool IsConfigured { get; }

    Task<AgentAskResponse> AskAsync(AgentAskRequest request, CancellationToken ct);
}

/// <summary>
/// Resolve o provedor configurado em Agent:Provider. Se a chave não existir,
/// cai no primeiro provedor registrado (útil quando só há um).
/// </summary>
public sealed class AgentProviderResolver(
    IOptions<AgentOptions> options,
    IEnumerable<IAgentProvider> providers)
{
    public IAgentProvider Current
    {
        get
        {
            var key = options.Value.Provider;
            var match = providers.FirstOrDefault(p =>
                p.ProviderKey.Equals(key, StringComparison.OrdinalIgnoreCase));
            if (match is not null) return match;

            var fallback = providers.FirstOrDefault();
            if (fallback is not null) return fallback;

            throw new InvalidOperationException(
                $"No agent provider registered (Agent:Provider='{key}').");
        }
    }
}
