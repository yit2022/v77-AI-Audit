export const dynamic = "force-dynamic";

import { db, ensureDb, schema } from "@/lib/db";
import { PageHeader } from "@/components/ui";
import { syncControlCatalogue } from "@/lib/db/sync-controls";
import { getRequestLocale } from "@/lib/i18n/locale";
import { t } from "@/lib/i18n/dictionaries";

export default async function ControlsPage() {
  await syncControlCatalogue();
  await ensureDb();
  const locale = await getRequestLocale();
  const controls = await db.select().from(schema.controls);
  const byArea = controls.reduce<Record<string, typeof controls>>((acc, c) => {
    (acc[c.area] ??= []).push(c);
    return acc;
  }, {});

  return (
    <div>
      <PageHeader title={t(locale, "controls.title")} subtitle={t(locale, "controls.subtitle")} />
      <div className="space-y-6">
        {Object.entries(byArea).map(([area, list]) => (
          <section key={area} className="card overflow-hidden">
            <div className="border-b border-slate-200 bg-slate-50 px-5 py-3 text-sm font-semibold text-slate-800">
              {area}
            </div>
            <div className="divide-y divide-slate-100">
              {list.map((c) => (
                <div key={c.id} className="px-5 py-4">
                  <div className="flex flex-wrap items-baseline gap-2">
                    <span className="font-mono text-xs text-sky-700">{c.code}</span>
                    <h3 className="text-sm font-semibold text-slate-900">{c.title}</h3>
                  </div>
                  <p className="mt-1 text-sm text-slate-600">{c.description}</p>
                  <dl className="mt-3 grid gap-2 text-xs text-slate-500 md:grid-cols-3 xl:grid-cols-6">
                    <div>
                      <dt className="font-semibold text-slate-700">🇪🇺 EU AI Act</dt>
                      <dd>{c.euRef || "—"}</dd>
                    </div>
                    <div>
                      <dt className="font-semibold text-slate-700">GDPR (Reg. 2016/679)</dt>
                      <dd>{c.gdprRef || "—"}</dd>
                    </div>
                    <div>
                      <dt className="font-semibold text-slate-700">DORA (Banking/Insurance)</dt>
                      <dd>{c.doraRef || "—"}</dd>
                    </div>
                    <div>
                      <dt className="font-semibold text-slate-700">EN ISO/IEC 42001</dt>
                      <dd>{c.isoRef || "—"}</dd>
                    </div>
                    <div>
                      <dt className="font-semibold text-slate-700">EN ISO/IEC 27001</dt>
                      <dd>{c.iso27001Ref || "—"}</dd>
                    </div>
                    <div>
                      <dt className="font-semibold text-slate-700">NIST AI RMF</dt>
                      <dd>{c.nistRef || "—"}</dd>
                    </div>
                  </dl>
                  <p className="mt-2 text-xs text-slate-400">Applies to: {c.appliesTo}</p>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
