import { eq } from "drizzle-orm";
import { CONTROL_SEEDS } from "@/lib/crosswalk";
import { db, ensureDb, schema } from "@/lib/db";

/** Upsert control catalogue from CONTROL_SEEDS (insert missing, refresh crosswalk refs only when changed). */
export async function syncControlCatalogue(): Promise<{ inserted: number; updated: number }> {
  await ensureDb();
  const existing = await db.select().from(schema.controls);
  const byCode = new Map(existing.map((c) => [c.code, c]));
  let inserted = 0;
  let updated = 0;
  for (const c of CONTROL_SEEDS) {
    const row = byCode.get(c.code);
    if (!row) {
      await db.insert(schema.controls).values({
        id: c.id,
        code: c.code,
        title: c.title,
        description: c.description,
        area: c.area,
        euRef: c.euRef,
        nistRef: c.nistRef,
        isoRef: c.isoRef,
        gdprRef: c.gdprRef,
        doraRef: c.doraRef,
        iso27001Ref: c.iso27001Ref,
        appliesTo: c.appliesTo,
      });
      inserted++;
      continue;
    }
    const unchanged =
      row.title === c.title &&
      row.description === c.description &&
      row.area === c.area &&
      row.euRef === c.euRef &&
      row.nistRef === c.nistRef &&
      row.isoRef === c.isoRef &&
      row.gdprRef === c.gdprRef &&
      row.doraRef === c.doraRef &&
      row.iso27001Ref === c.iso27001Ref &&
      row.appliesTo === c.appliesTo;
    if (unchanged) continue;

    await db
      .update(schema.controls)
      .set({
        title: c.title,
        description: c.description,
        area: c.area,
        euRef: c.euRef,
        nistRef: c.nistRef,
        isoRef: c.isoRef,
        gdprRef: c.gdprRef,
        doraRef: c.doraRef,
        iso27001Ref: c.iso27001Ref,
        appliesTo: c.appliesTo,
      })
      .where(eq(schema.controls.id, row.id));
    updated++;
  }
  return { inserted, updated };
}
