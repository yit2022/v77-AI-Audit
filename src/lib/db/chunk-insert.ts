import { db } from "./index";

/** D1 caps bound variables (~100). Chunk multi-row inserts safely. */
export async function insertInChunks<T extends Record<string, unknown>>(
  table: Parameters<typeof db.insert>[0],
  rows: T[],
  chunkSize = 5,
) {
  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);
    if (chunk.length) await db.insert(table).values(chunk as never);
  }
}
