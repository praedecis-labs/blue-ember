using BlueEmber.Api.Domain.Investigations;

namespace BlueEmber.Api.Infrastructure.Data;

public interface IInvestigationRepository
{
    IReadOnlyList<Investigation> GetAll();
    Investigation? GetById(string id);
    InvestigationCacheInfo GetCacheInfo();
    void ReplaceAll(
        IEnumerable<Investigation> investigations,
        string source = "memory",
        DateTimeOffset? loadedAtUtc = null);
    Task LoadFromDiskAsync(CancellationToken cancellationToken = default);
    Task PersistToDiskAsync(CancellationToken cancellationToken = default);
}
