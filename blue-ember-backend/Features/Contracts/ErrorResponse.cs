namespace BlueEmber.Api.Features.Contracts;

public sealed record ErrorResponse(string Error, IReadOnlyList<string>? Missing = null);
