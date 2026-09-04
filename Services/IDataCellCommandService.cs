using Pagina_Web.Models.Requests;

namespace Pagina_Web.Services;

public interface IDataCellCommandService
{
    Task<OperationResult> RegisterCdpAsync(GenerateCdpRequest request, string userEmail, CancellationToken cancellationToken = default);
    Task<OperationResult> RegisterProductEntryAsync(RegisterProductEntryRequest request, string userEmail, CancellationToken cancellationToken = default);
    Task<OperationResult> RegisterPurchaseRequestAsync(RegisterPurchaseRequest request, string userEmail, CancellationToken cancellationToken = default);
    Task<OperationResult> RegisterCustomerClaimAsync(RegisterCustomerClaimRequest request, string userEmail, CancellationToken cancellationToken = default);
    Task<OperationResult> RegisterQuotationRequestAsync(RegisterQuotationRequest request, string userEmail, CancellationToken cancellationToken = default);
}

public sealed record OperationResult(bool Succeeded, string Message)
{
    public static OperationResult Success(string message) => new(true, message);
    public static OperationResult Failure(string message) => new(false, message);
}
