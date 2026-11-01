import type { Metadata } from "next";
import Link from "next/link";
import { MarketingChrome } from "@/components/marketing-chrome";

export const metadata: Metadata = {
  title: "Security & Trust — V77 Trust",
  description: "How V77 Trust protects tenant data: RBAC, CSRF, rate limits, hash-chained evidence and audit logs.",
};

const items = [
  {
    title: "Multi-tenant RBAC",
    body: "Organisation-scoped memberships with admin, AI owner and auditor roles. Sessions bind a user to a single org context.",
  },
  {
    title: "Hash-chained evidence",
    body: "Evidence objects live in Cloudflare R2 with integrity hashing so auditors can detect tampering of stored artefacts.",
  },
  {
    title: "Immutable activity log",
    body: "Security-relevant actions append to a hash-chained audit log. Prior entries are never updated or deleted.",
  },
  {
    title: "Request hardening",
    body: "Security headers, CSRF protections on mutating routes, and rate limits on public endpoints such as pilot requests and login.",
  },
  {
    title: "API keys with roles",
    body: "Org API keys for /api/v1 carry explicit roles and can be revoked. Keys are stored hashed, not in clear text.",
  },
  {
    title: "Infrastructure posture",
    body: "Deployed as a Cloudflare Worker with D1 and R2. Real model providers stay gated behind an explicit enable flag.",
  },
];

export default function SecurityPage() {
  return (
    <MarketingChrome>
      <section className="mx-auto max-w-6xl px-4 pb-14 sm:px-6">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-sky-700">Security & trust</p>
        <h1 className="mt-3 max-w-3xl text-3xl font-semibold tracking-tight text-[#0F2A4A] sm:text-4xl">
          Built for assurance programmes that cannot afford soft edges.
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-relaxed text-slate-600">
          V77 Trust treats governance data as regulated evidence. Access is role-based, evidence is integrity-checked, and
          operational changes leave a verifiable trail.
        </p>
        <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <div key={item.title} className="card p-5">
              <h2 className="font-semibold text-[#0F2A4A]">{item.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{item.body}</p>
            </div>
          ))}
        </div>
        <p className="mt-8 text-sm text-slate-600">
          Questions about our security programme?{" "}
          <Link href="/#request-pilot" className="font-semibold text-sky-700 hover:underline">
            Request a pilot
          </Link>{" "}
          and ask for the trust overview.
        </p>
      </section>
    </MarketingChrome>
  );
}
