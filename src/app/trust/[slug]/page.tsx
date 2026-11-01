export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { eq, and, sql } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db, ensureDb, schema } from "@/lib/db";
import { MarketingChrome } from "@/components/marketing-chrome";
import { COMPANY } from "@/lib/company";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  return {
    title: `Trust Center — ${slug} · V77 Trust`,
    description: `Public compliance status for ${slug} on V77 Trust.`,
  };
}

export default async function TrustCenterPage({ params }: Props) {
  const { slug } = await params;
  await ensureDb();
  const orgs = await db.select().from(schema.organisations).where(eq(schema.organisations.slug, slug)).limit(1);
  const org = orgs[0];
  if (!org || !org.trustPublic) notFound();

  const systems = await db
    .select({
      id: schema.aiSystems.id,
      name: schema.aiSystems.name,
      riskTier: schema.aiSystems.riskTier,
      roleInValueChain: schema.aiSystems.roleInValueChain,
    })
    .from(schema.aiSystems)
    .where(eq(schema.aiSystems.orgId, org.id));

  const findingsOpen = await db
    .select({ n: sql<number>`count(*)` })
    .from(schema.findings)
    .where(and(eq(schema.findings.orgId, org.id), eq(schema.findings.status, "open")));

  const contact = org.trustContactEmail || COMPANY.salesEmail;

  return (
    <MarketingChrome>
      <section className="mx-auto max-w-3xl px-4 pb-14 sm:px-6">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-sky-700">Trust Center</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-[#0F2A4A]">{org.name}</h1>
        <p className="mt-2 text-sm text-slate-500">
          Shareable compliance status published via V77 Trust (operated by {COMPANY.legalName}). Not a notified-body
          certificate.
        </p>
        {org.trustSummary ? (
          <div className="card mt-6 p-5 text-sm leading-relaxed text-slate-700 whitespace-pre-wrap">{org.trustSummary}</div>
        ) : null}

        <h2 className="mt-10 text-lg font-semibold text-[#0F2A4A]">AI inventory snapshot</h2>
        <ul className="mt-3 space-y-2">
          {systems.map((s) => (
            <li key={s.id} className="card flex flex-wrap items-center justify-between gap-2 p-4 text-sm">
              <span className="font-medium text-[#0F2A4A]">{s.name}</span>
              <span className="text-slate-500">
                {s.roleInValueChain} · {s.riskTier || "unclassified"}
              </span>
            </li>
          ))}
          {systems.length === 0 ? <li className="text-sm text-slate-600">No systems published yet.</li> : null}
        </ul>

        <div className="card mt-6 grid gap-3 p-5 sm:grid-cols-2">
          <div>
            <div className="text-xs font-semibold uppercase text-slate-500">Registered systems</div>
            <div className="mt-1 text-2xl font-semibold text-[#0F2A4A]">{systems.length}</div>
          </div>
          <div>
            <div className="text-xs font-semibold uppercase text-slate-500">Open findings</div>
            <div className="mt-1 text-2xl font-semibold text-[#0F2A4A]">{Number(findingsOpen[0]?.n || 0)}</div>
          </div>
        </div>

        <p className="mt-8 text-sm text-slate-600">
          Questions about this Trust Center?{" "}
          <a className="font-semibold text-sky-700 hover:underline" href={`mailto:${contact}`}>
            {contact}
          </a>
        </p>
      </section>
    </MarketingChrome>
  );
}
