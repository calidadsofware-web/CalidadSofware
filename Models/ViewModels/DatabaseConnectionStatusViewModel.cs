namespace Pagina_Web.Models.ViewModels;

public class DatabaseConnectionStatusViewModel
{
    public bool IsConfigured { get; set; }
    public bool CanConnect { get; set; }
    public string? ProviderName { get; set; }
    public string? Server { get; set; }
    public string? Port { get; set; }
    public string? DatabaseName { get; set; }
    public string? ServerVersion { get; set; }
    public string? ErrorMessage { get; set; }
    public DateTime CheckedAt { get; set; } = DateTime.Now;
    public IReadOnlyList<TableCountViewModel> TableCounts { get; set; } = [];
}

public record TableCountViewModel(string TableName, int Count);
