import path from "path";
import fs from "fs";
import { drizzle as drizzlePglite } from "drizzle-orm/pglite";
import { PGlite } from "@electric-sql/pglite";
import { drizzle as drizzlePg } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";
import { DDL } from "./ddl";
import { resolveDbBackend } from "./backend";

const backend = resolveDbBackend();

const dataDir = process.env.V77_DATA_DIR
  ? path.resolve(process.env.V77_DATA_DIR)
  : path.join(process.cwd(), "data");

declare global {
  var __v77_pglite: PGlite | undefined;
  var __v77_pg: ReturnType<typeof postgres> | undefined;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  var __v77_db: any;
  var __v77_ready: Promise<void> | undefined;
  var __v77_backend: string | undefined;
}

function createDb() {
  if (backend === "postgres") {
    const url = process.env.DATABASE_URL!;
    if (!global.__v77_pg) {
      global.__v77_pg = postgres(url, { max: 5 });
    }
    return drizzlePg(global.__v77_pg, { schema });
  }
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  const dbPath = path.join(dataDir, "v77-pglite");
  if (!global.__v77_pglite) global.__v77_pglite = new PGlite(dbPath);
  return drizzlePglite(global.__v77_pglite, { schema });
}

export const db = global.__v77_db ?? createDb();
if (!global.__v77_db) {
  global.__v77_db = db;
  global.__v77_backend = backend;
}

async function execDdl() {
  if (backend === "postgres") {
    const sql = global.__v77_pg!;
    await sql.unsafe(DDL);
    return;
  }
  await global.__v77_pglite!.exec(DDL);
}

export async function ensureDb() {
  if (!global.__v77_ready) {
    global.__v77_ready = execDdl();
  }
  await global.__v77_ready;
}

export function getDbBackend() {
  return (global.__v77_backend as "postgres" | "pglite") || backend;
}

export { schema, resolveDbBackend };
