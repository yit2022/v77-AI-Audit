export const dynamic = "force-dynamic";

import { eq, desc } from "drizzle-orm";
import { db, ensureDb, schema } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { PageHeader } from "@/components/ui";
import { EvidenceUpload } from "@/components/evidence-upload";

export default async function EvidencePage() {
  const session = await getSession();
  if (!session) return null;
  await ensureDb();
  const items = await db
    .select()
    .from(schema.evidenceItems)
    .where(eq(schema.evidenceItems.orgId, session.orgId))
    .orderBy(desc(schema.evidenceItems.createdAt));
  const systems = await db
    .select()
    .from(schema.aiSystems)
    .where(eq(schema.aiSystems.orgId, session.orgId));
  const controls = await db.select().from(schema.controls);

  return (
    <div>
      <PageHeader
        title="Evidence vault"
        subtitle="Upload artefacts linked to systems and controls. SHA-256 is recorded for chain-of-custody."
      />
      <EvidenceUpload
        systems={systems.map((s) => ({ id: s.id, name: s.name }))}
        controls={controls.map((c) => ({ id: c.id, code: c.code, title: c.title }))}
      />
      <div className="mt-6 card overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-5 py-2">Title</th>
              <th className="px-5 py-2">File</th>
              <th className="px-5 py-2">SHA-256</th>
              <th className="px-5 py-2">Uploaded</th>
            </tr>
          </thead>
          <tbody>
            {items.map((i) => (
              <tr key={i.id} className="border-t border-slate-100">
                <td className="px-5 py-3 font-medium">{i.title}</td>
                <td className="px-5 py-3 text-slate-600">{i.filename}</td>
                <td className="px-5 py-3 font-mono text-xs text-slate-500">{i.sha256.slice(0, 16)}…</td>
                <td className="px-5 py-3 text-slate-500">
                  {i.createdAt ? new Date(i.createdAt).toISOString().slice(0, 10) : "—"}
                </td>
              </tr>
            ))}
            {items.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-5 py-8 text-center text-slate-500">
                  No evidence uploaded yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
