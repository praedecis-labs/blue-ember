using BlueEmber.Api.Domain.Investigations;

namespace BlueEmber.Api.Infrastructure.Data;

public interface IInvestigationRepository
{
    IReadOnlyList<Investigation> GetAll();
    Investigation? GetById(string id);
    void ReplaceAll(IEnumerable<Investigation> investigations);
    Task LoadFromDiskAsync(CancellationToken cancellationToken = default);
    Task PersistToDiskAsync(CancellationToken cancellationToken = default);
}
