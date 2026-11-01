export type DbBackend = "postgres" | "pglite";

/** Pure helper: choose Postgres when DATABASE_URL is set, otherwise PGlite. */
export function resolveDbBackend(env: NodeJS.ProcessEnv = process.env): DbBackend {
  const url = env.DATABASE_URL?.trim();
  if (url && /^postgres(ql)?:\/\//i.test(url)) return "postgres";
  return "pglite";
}
