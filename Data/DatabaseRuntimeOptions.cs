namespace Pagina_Web.Data;

public sealed record DatabaseRuntimeOptions(string Provider, string ConnectionString)
{
    public bool IsPostgreSql => Provider == "PostgreSQL";

    public static DatabaseRuntimeOptions ForPostgreSql(string connectionString) =>
        new("PostgreSQL", connectionString);

    public static DatabaseRuntimeOptions ForSqlite(string databasePath) =>
        new("SQLite (desarrollo local)", $"Data Source={databasePath}");
}
