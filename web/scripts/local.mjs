import { readFile, mkdir } from "node:fs/promises";
import { randomBytes, scryptSync } from "node:crypto";
import { fileURLToPath } from "node:url";
import { PGlite } from "@electric-sql/pglite";
import { PGLiteSocketServer } from "@electric-sql/pglite-socket";
import { createServer } from "vite";

// Isolated development environment. Never loads Netlify or production secrets.
const root = fileURLToPath(new URL("../", import.meta.url));
await mkdir(`${root}/.local-data`, { recursive: true });
const db = await PGlite.create(`${root}/.local-data/postgres`);
const existing = await db.query("select to_regclass('public.usuarios') as table_name");
if (!existing.rows[0].table_name) {
  await db.exec("create role anon; create role authenticated;");
  await db.exec(await readFile(new URL("../../supabase/schema.sql", import.meta.url), "utf8"));
}
// Disposable local-only identities. They never exist in the deployed database.
for (const [name, role] of [
  ["admin", "ADMINISTRADOR"],
  ["caja", "CAJERO"],
  ["almacen", "ALMACEN"],
  ["compras", "ASISTENTE_COMPRAS"],
]) {
  const salt = randomBytes(16);
  const key = scryptSync("Local-demo-2026!", salt, 64, { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 });
  const hash = `scrypt$16384$8$1$${salt.toString("base64url")}$${key.toString("base64url")}`;
  await db.query(
    "insert into public.usuarios(nombres,apellidos,correo,password_hash,id_rol) values($1,'Local',$2,$3,(select id_rol from public.roles where nombre=$4)) on conflict(correo) do nothing",
    [name, `${name}@local.test`, hash, role],
  );
}
const dbServer = new PGLiteSocketServer({ db, host: "127.0.0.1", port: 55432 });
await dbServer.start();
const localEnv = {
  DATABASE_URL: "postgresql://postgres:postgres@127.0.0.1:55432/postgres",
  APP_SESSION_SECRET: randomBytes(48).toString("base64url"),
  DATACELL_LOCAL: "true",
};
globalThis.Netlify = { env: { get: (name) => localEnv[name] } };
const vite = await createServer({
  root,
  server: {
    host: "127.0.0.1",
    port: 5173,
    strictPort: true,
    watch: {
      ignored: ["**/.local-data/**"],
      awaitWriteFinish: { stabilityThreshold: 200, pollInterval: 50 },
    },
  },
  plugins: [
    {
      name: "local-api",
      configureServer(server) {
        server.middlewares.use(async (req, res, next) => {
          if (req.url?.split("?")[0] !== "/api/datacell") return next();
          try {
            const chunks = [];
            let size = 0;
            for await (const chunk of req) {
              size += chunk.length;
              if (size > 256_000) {
                res.writeHead(413);
                res.end();
                return;
              }
              chunks.push(chunk);
            }
            const { default: handler } = await server.ssrLoadModule("/netlify/functions/datacell.ts");
            const request = new Request(`http://127.0.0.1:5173${req.url}`, {
              method: req.method,
              headers: req.headers,
              ...(chunks.length ? { body: Buffer.concat(chunks) } : {}),
            });
            const response = await handler(request);
            res.writeHead(response.status, Object.fromEntries(response.headers));
            res.end(Buffer.from(await response.arrayBuffer()));
          } catch (error) {
            console.error("Local API:", error.message);
            res.writeHead(500, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ ok: false, message: "No se pudo procesar la operación local." }));
          }
        });
      },
    },
  ],
});
await vite.listen();
console.info("Entorno LOCAL: http://127.0.0.1:5173 — datos aislados de producción.");
for (const signal of ["SIGINT", "SIGTERM"]) {
  process.once(signal, async () => {
    await vite.close();
    await dbServer.stop();
    await db.close();
    process.exit(0);
  });
}
