namespace Pagina_Web.Models.Requests;

public sealed record OperationItemRequest(string ProductCode, int Quantity);

public sealed record GenerateCdpRequest(
    string ReceiptType,
    string ClientName,
    string? ClientDocument,
    string PaymentMethod,
    IReadOnlyList<OperationItemRequest> Items);

public sealed record RegisterProductEntryRequest(
    string PurchaseNumber,
    string? Guide,
    DateOnly? EntryDate,
    string? Notes,
    IReadOnlyList<OperationItemRequest> Items);

public sealed record RegisterPurchaseRequest(
    string? SupplierName,
    string Priority,
    DateOnly? RequiredDate,
    string? Justification,
    IReadOnlyList<OperationItemRequest> Items);

public sealed record RegisterQuotationRequest(
    DateOnly? Deadline,
    string? Notes,
    IReadOnlyList<string> SupplierNames,
    IReadOnlyList<OperationItemRequest> Items);

public sealed record RegisterCustomerClaimRequest(
    string ClientName,
    string? ReceiptNumber,
    string Reason,
    string Channel,
    string Priority,
    string Description);
