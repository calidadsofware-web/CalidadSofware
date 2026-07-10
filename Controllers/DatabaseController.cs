using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Pagina_Web.Services;

namespace Pagina_Web.Controllers;

[Authorize(Roles = "ADMINISTRADOR")]
public class DatabaseController(IDatabaseHealthService databaseHealthService) : Controller
{
    public async Task<IActionResult> Index(CancellationToken cancellationToken)
    {
        var status = await databaseHealthService.CheckAsync(cancellationToken);
        return View(status);
    }
}
