using System.Diagnostics;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Pagina_Web.Models;
using Pagina_Web.Services;

namespace Pagina_Web.Controllers;

public class HomeController(IAppStateService appStateService) : Controller
{
    [Authorize]
    public IActionResult Index()
    {
        return View(appStateService.GetDashboard());
    }

    [Authorize]
    public IActionResult Privacy()
    {
        return View();
    }

    [ResponseCache(Duration = 0, Location = ResponseCacheLocation.None, NoStore = true)]
    public IActionResult Error()
    {
        return View(new ErrorViewModel { RequestId = Activity.Current?.Id ?? HttpContext.TraceIdentifier });
    }
}
