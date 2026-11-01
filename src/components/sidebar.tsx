"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const links = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/compliance", label: "Compliance" },
  { href: "/systems", label: "AI Inventory" },
  { href: "/controls", label: "Control Crosswalk" },
  { href: "/assessments", label: "Assessments" },
  { href: "/evidence", label: "Evidence Vault" },
  { href: "/tests/fairness", label: "Fairness Tests" },
  { href: "/tests/redteam", label: "LLM Red-Team" },
  { href: "/tests/evals", label: "Eval Suites" },
  { href: "/impact", label: "FRIA / DPIA" },
  { href: "/monitoring", label: "Monitoring" },
  { href: "/findings", label: "Findings" },
  { href: "/auditor", label: "Auditor Workspace" },
  { href: "/settings", label: "Settings" },
];

export function Sidebar({ userName, orgName, role }: { userName: string; orgName: string; role: string }) {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <aside className="flex h-full w-64 flex-col border-r border-[#d7e6ef] bg-white">
      <div className="border-b border-[#d7e6ef] px-5 py-4">
        <div className="text-xs font-bold uppercase tracking-[0.14em] text-sky-700">V77</div>
        <div className="mt-1 text-sm font-semibold text-slate-900">AI Auditor</div>
        <div className="mt-2 truncate text-xs text-slate-500">{orgName}</div>
      </div>
      <nav className="flex-1 space-y-0.5 p-3">
        {links.map((l) => {
          const active = pathname === l.href || pathname.startsWith(l.href + "/");
          return (
            <Link key={l.href} href={l.href} className={`block rounded-full px-3 py-2 text-sm ${active ? "bg-sky-50 font-semibold text-[#0F2A4A]" : "text-slate-600 hover:bg-sky-50/60"}`}>
              {l.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-[#d7e6ef] p-4">
        <div className="text-sm font-medium text-slate-800">{userName}</div>
        <div className="text-xs capitalize text-slate-500">{role.replace("_", " ")}</div>
        <button type="button" onClick={logout} className="btn btn-secondary mt-3 w-full">Sign out</button>
      </div>
    </aside>
  );
}
