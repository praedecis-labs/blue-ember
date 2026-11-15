using Microsoft.Extensions.Options;

namespace BlueEmber.Api.Features.Agent;

/// <summary>Configuração de seleção do provedor de LLM do agente.</summary>
public sealed class AgentOptions
{
    public const string SectionName = "Agent";

    /// <summary>Chave do provedor registrado (ex.: "nvidia"). Case-insensitive.</summary>
    public string Provider { get; set; } = "nvidia";

    /// <summary>Chaves de provedores tentadas em ordem se o principal falhar.</summary>
    public List<string> Fallbacks { get; set; } = [];
}

/// <summary>
/// Provedor de LLM com tool calling. Cada implementação encapsula um vendor
/// (NVIDIA, OpenAI, Anthropic...) e seu formato de wire; tools e orquestração
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
    private IAgentProvider? Resolve(string? key)
    {
        if (string.IsNullOrWhiteSpace(key)) return null;
        return providers.FirstOrDefault(p =>
            p.ProviderKey.Equals(key, StringComparison.OrdinalIgnoreCase));
    }

    public IAgentProvider Current => Resolve(options.Value.Provider)
        ?? providers.FirstOrDefault()
        ?? throw new InvalidOperationException(
            $"No agent provider registered (Agent:Provider='{options.Value.Provider}').");

    /// <summary>Provedor principal seguido dos fallbacks configurados, sem duplicatas.</summary>
    public IReadOnlyList<IAgentProvider> Ordered
    {
        get
        {
            var list = new List<IAgentProvider>();
            var primary = Resolve(options.Value.Provider) ?? providers.FirstOrDefault();
            if (primary is not null) list.Add(primary);
            foreach (var key in options.Value.Fallbacks)
            {
                var p = Resolve(key);
                if (p is not null && !list.Contains(p)) list.Add(p);
            }
            return list;
        }
    }
}
