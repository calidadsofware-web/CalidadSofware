using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.FileProviders;
using Pagina_Web.Data;
using Pagina_Web.Data.Entities;
using Pagina_Web.Security;
using Pagina_Web.Services;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllersWithViews();
builder.Services.AddAuthentication(CookieAuthenticationDefaults.AuthenticationScheme)
    .AddCookie(options =>
    {
        options.LoginPath = "/Account/Login";
        options.AccessDeniedPath = "/Account/AccessDenied";
        options.ExpireTimeSpan = TimeSpan.FromHours(8);
        options.SlidingExpiration = true;
        options.Cookie.HttpOnly = true;
        options.Cookie.SameSite = SameSiteMode.Lax;
        options.Cookie.SecurePolicy = CookieSecurePolicy.SameAsRequest;
    });
builder.Services.AddAuthorization(options =>
{
    options.AddPolicy(AppPolicies.Administration,
        policy => policy.RequireRole(AppRoles.Administrator));
    options.AddPolicy(AppPolicies.Sales,
        policy => policy.RequireRole(AppRoles.Administrator, AppRoles.Cashier));
    options.AddPolicy(AppPolicies.Warehouse,
        policy => policy.RequireRole(AppRoles.Administrator, AppRoles.Warehouse));
    options.AddPolicy(AppPolicies.Procurement,
        policy => policy.RequireRole(AppRoles.Administrator, AppRoles.PurchasingAssistant, AppRoles.Warehouse));
    options.AddPolicy(AppPolicies.Quotations,
        policy => policy.RequireRole(AppRoles.Administrator, AppRoles.PurchasingAssistant));
});

var configuredConnection = builder.Configuration.GetConnectionString("DataCell");
var useLocalFallback = builder.Configuration.GetValue("Database:UseLocalFallback", true);
var usePostgreSql = !string.IsNullOrWhiteSpace(configuredConnection);

if (!usePostgreSql && !useLocalFallback)
{
    throw new InvalidOperationException(
        "Configure ConnectionStrings:DataCell con la cadena PostgreSQL de Supabase.");
}

var runtimeOptions = usePostgreSql
    ? DatabaseRuntimeOptions.ForPostgreSql(configuredConnection!)
    : DatabaseRuntimeOptions.ForSqlite(Path.Combine(builder.Environment.ContentRootPath, "Data", "datacell-dev.db"));

builder.Services.AddSingleton(runtimeOptions);
builder.Services.AddDbContext<DataCellDbContext>(options =>
{
    if (runtimeOptions.IsPostgreSql)
    {
        options.UseNpgsql(runtimeOptions.ConnectionString, postgres =>
            postgres.MigrationsHistoryTable("__ef_migrations_history", DataCellDbContext.Schema));
    }
    else
    {
        options.UseSqlite(runtimeOptions.ConnectionString);
    }
});
builder.Services.AddScoped<IDatabaseHealthService, DatabaseHealthService>();
builder.Services.AddScoped<IDataCellQueryService, DataCellQueryService>();
builder.Services.AddScoped<IDataCellCommandService, DataCellCommandService>();
builder.Services.AddScoped<IUserAccessService, UserAccessService>();
builder.Services.AddScoped<IDatabaseInitializer, DatabaseInitializer>();
builder.Services.AddSingleton<IPasswordHasher<Usuario>, PasswordHasher<Usuario>>();
builder.Services.AddSingleton(TimeProvider.System);

var app = builder.Build();

await using (var scope = app.Services.CreateAsyncScope())
{
    var initializer = scope.ServiceProvider.GetRequiredService<IDatabaseInitializer>();
    await initializer.InitializeAsync();
}

// Configure the HTTP request pipeline.
if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Home/Error");
    // The default HSTS value is 30 days. You may want to change this for production scenarios, see https://aka.ms/aspnetcore-hsts.
    app.UseHsts();
}

if (!app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}
app.UseRouting();

app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new PhysicalFileProvider(Path.Combine(app.Environment.ContentRootPath, "assets")),
    RequestPath = "/assets"
});

app.UseAuthentication();
app.UseAuthorization();

app.MapStaticAssets();

app.MapControllerRoute(
    name: "default",
    pattern: "{controller=Home}/{action=Index}/{id?}")
    .WithStaticAssets();


app.Run();

public partial class Program;
