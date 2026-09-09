import { Pool, type PoolClient, type QueryResultRow } from "pg";

declare const Netlify: {
  env: { get(name: string): string | undefined };
};

let pool: Pool | undefined;

function databaseUrl(): string {
  const value = Netlify.env.get("DATABASE_URL");
  if (!value) {
    throw new Error("DATABASE_URL no está configurada en Netlify.");
  }
  return value;
}

export function getPool(): Pool {
  pool ??= new Pool({
    connectionString: databaseUrl(),
    // Supabase transaction poolers use a provider chain that Node cannot validate
    // in this runtime. Traffic remains encrypted; the database URL stays server-only.
    ssl: { rejectUnauthorized: false },
    max: 2,
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 10_000,
    allowExitOnIdle: true,
  });
  return pool;
}

export async function query<T extends QueryResultRow>(text: string, values: unknown[] = []): Promise<T[]> {
  const result = await getPool().query<T>(text, values);
  return result.rows;
}

export async function withTransaction<T>(operation: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await getPool().connect();
  try {
    await client.query("begin isolation level serializable");
    const result = await operation(client);
    await client.query("commit");
    return result;
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
}
