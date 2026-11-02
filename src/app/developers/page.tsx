import type { Metadata } from "next";
import { MarketingChrome } from "@/components/marketing-chrome";
import { COMPANY } from "@/lib/company";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "API & integrations — V77 Trust",
  description: "REST API documentation for V77 Trust. Authenticate with org API keys from Settings.",
};

const endpoints = [
  {
    method: "GET",
    path: "/api/v1/systems",
    desc: "List AI systems in the key’s organisation.",
  },
  {
    method: "POST",
    path: "/api/v1/systems",
    desc: "Create an AI system (requires owner+ role on the key).",
  },
  {
    method: "GET",
    path: "/api/v1/controls",
    desc: "List control catalogue / crosswalk rows.",
  },
  {
    method: "GET",
    path: "/api/v1/findings",
    desc: "List findings for the organisation.",
  },
];

export default function DevelopersPage() {
  return (
    <MarketingChrome>
      <article className="mx-auto max-w-3xl px-4 pb-14 sm:px-6">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-sky-700">Developers</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-[#0F2A4A]">REST API</h1>
        <p className="mt-4 text-base leading-relaxed text-slate-600">
          Integrate V77 Trust with your GRC stack using org-scoped API keys. Keys are created in Settings by an admin —
          secrets are shown once. Base URL: your deployment origin (e.g. https://v77trust.com).
        </p>

        <h2 className="mt-10 text-lg font-semibold text-[#0F2A4A]">Authentication</h2>
        <pre className="card mt-3 overflow-x-auto p-4 text-xs text-slate-800">{`Authorization: Bearer v77_…`}</pre>
        <p className="mt-2 text-sm text-slate-600">
          Role on the key mirrors RBAC: auditor (read-only), reviewer, owner (<code>ai_owner</code>), admin.
        </p>

        <h2 className="mt-10 text-lg font-semibold text-[#0F2A4A]">Endpoints</h2>
        <ul className="mt-3 space-y-3">
          {endpoints.map((e) => (
            <li key={e.path + e.method} className="card p-4">
              <div className="font-mono text-sm text-[#0F2A4A]">
                <span className="font-bold text-sky-700">{e.method}</span> {e.path}
              </div>
              <p className="mt-1 text-sm text-slate-600">{e.desc}</p>
            </li>
          ))}
        </ul>

        <h2 className="mt-10 text-lg font-semibold text-[#0F2A4A]">Example</h2>
        <pre className="card mt-3 overflow-x-auto p-4 text-xs leading-relaxed text-slate-800">{`curl -s \\\n  -H "Authorization: Bearer v77_YOUR_KEY" \\\n  https://v77trust.com/api/v1/systems`}</pre>

        <p className="mt-8 text-sm text-slate-600">
          Need a higher-volume integration? Email{" "}
          <a className="font-semibold text-sky-700 hover:underline" href={`mailto:${COMPANY.salesEmail}`}>
            {COMPANY.salesEmail}
          </a>
          .
        </p>
      </article>
    </MarketingChrome>
  );
}
