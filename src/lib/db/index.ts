import path from "path";
import fs from "fs";
import { createClient, type Client } from "@libsql/client";
import { drizzle as drizzleLibsql, type LibSQLDatabase } from "drizzle-orm/libsql";
import { drizzle as drizzleD1 } from "drizzle-orm/d1";
import * as schema from "./schema";
import { SQLITE_DDL } from "./ddl-sqlite";
import { resolveDbBackend } from "./backend";

// Use LibSQLDatabase as the shared typing surface; D1 instance is cast at runtime.
// Minimal Workers D1 typing so Next build works without workers-types package.
type D1PreparedStatement = {
  bind: (...values: unknown[]) => D1PreparedStatement;
  run: () => Promise<unknown>;
  all: <T = unknown>() => Promise<{ results: T[] }>;
  first: <T = unknown>() => Promise<T | null>;
};
type D1Database = {
  prepare: (query: string) => D1PreparedStatement;
  batch: <T = unknown>(statements: D1PreparedStatement[]) => Promise<T[]>;
  exec: (query: string) => Promise<unknown>;
};

export type V77Db = LibSQLDatabase<typeof schema>;

declare global {
  var __v77_libsql: Client | undefined;
  var __v77_db: V77Db | undefined;
  var __v77_ready: Promise<void> | undefined;
  var __v77_backend: "d1" | "sqlite" | undefined;
  var __v77_d1: D1Database | undefined;
}

const dataDir = process.env.V77_DATA_DIR
  ? path.resolve(process.env.V77_DATA_DIR)
  : path.join(process.cwd(), "data");

async function getD1Binding(): Promise<D1Database | null> {
  if (global.__v77_d1) return global.__v77_d1;
  try {
    const { getCloudflareContext } = await import("@opennextjs/cloudflare");
    const ctx = await getCloudflareContext({ async: true });
    const binding = (ctx.env as { DB?: D1Database }).DB;
    if (binding) {
      global.__v77_d1 = binding;
      return binding;
    }
  } catch {
    // not running under OpenNext / Workers
  }
  return null;
}

function createLocalSqlite(): LibSQLDatabase<typeof schema> {
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  const dbPath = path.join(dataDir, "v77.sqlite");
  if (!global.__v77_libsql) {
    global.__v77_libsql = createClient({ url: `file:${dbPath}` });
  }
  return drizzleLibsql(global.__v77_libsql, { schema });
}

let _db: V77Db | undefined = global.__v77_db;

function getActiveDb(): V77Db {
  if (global.__v77_db) return global.__v77_db;
  if (_db) return _db;
  // Lazy local sqlite only — never mkdir at module load (Workers forbid FS).
  _db = createLocalSqlite();
  global.__v77_db = _db;
  global.__v77_backend = "sqlite";
  return _db;
}

// Proxy so ensureDb() can swap D1/libsql without updating every import binding.
export const db = new Proxy({} as object, {
  get(_t, prop, receiver) {
    const target = getActiveDb() as object;
    const value = Reflect.get(target, prop, receiver);
    return typeof value === "function" ? (value as (...a: unknown[]) => unknown).bind(target) : value;
  },
}) as unknown as V77Db;

async function execDdl(backend: "d1" | "sqlite") {
  const statements = SQLITE_DDL.split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && !s.startsWith("--"));
  if (backend === "d1") {
    const d1 = global.__v77_d1!;
    for (const stmt of statements) {
      await d1.prepare(stmt).run();
    }
    return;
  }
  const client = global.__v77_libsql!;
  for (const stmt of statements) {
    await client.execute(stmt);
  }
}

export async function ensureDb() {
  if (!global.__v77_ready) {
    global.__v77_ready = (async () => {
      const forceSqlite =
        process.env.V77_FORCE_SQLITE === "true" || Boolean(process.env.V77_DATA_DIR);
      const d1 = forceSqlite ? null : await getD1Binding();
      if (d1) {
        _db = drizzleD1(d1, { schema }) as unknown as V77Db;
        global.__v77_db = _db;
        global.__v77_backend = "d1";
        await execDdl("d1");
        return;
      }
      _db = createLocalSqlite();
      global.__v77_db = _db;
      global.__v77_backend = "sqlite";
      await execDdl("sqlite");
    })();
  }
  await global.__v77_ready;
}

export function getDbBackend() {
  return global.__v77_backend || resolveDbBackend();
}

export { schema, resolveDbBackend };
