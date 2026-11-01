export type DbBackend = "d1" | "sqlite" | "postgres" | "pglite";

/** Local default is sqlite (libsql file). Postgres URL retained for Contabo compose. */
export function resolveDbBackend(env: NodeJS.ProcessEnv = process.env): DbBackend {
  const url = env.DATABASE_URL?.trim();
  if (url?.startsWith("postgres://") || url?.startsWith("postgresql://")) return "postgres";
  return "sqlite";
}
