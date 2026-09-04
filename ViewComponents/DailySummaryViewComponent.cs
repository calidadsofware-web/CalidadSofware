using Microsoft.AspNetCore.Mvc;
using Pagina_Web.Services;

namespace Pagina_Web.ViewComponents;

public sealed class DailySummaryViewComponent(IDataCellQueryService queryService) : ViewComponent
{
    public async Task<IViewComponentResult> InvokeAsync(CancellationToken cancellationToken)
    {
        var dashboard = await queryService.GetDashboardAsync(cancellationToken);
        return View(dashboard.Metrics.Take(3));
    }
}
