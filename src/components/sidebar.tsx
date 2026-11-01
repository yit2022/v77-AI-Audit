"use client";

import { LogoMark } from "@/components/logo-mark";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

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
  { href: "/activity", label: "Activity log" },
  { href: "/settings", label: "Settings" },
];

export function Sidebar({ userName, orgName, role }: { userName: string; orgName: string; role: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const navLinks = role === "admin" ? [...links.slice(0, -1), { href: "/leads", label: "Pilot leads" }, links[links.length - 1]] : links;

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  const nav = (
    <>
      <div className="border-b border-[#d7e6ef] px-5 py-4">
        <LogoMark href="/dashboard" />
        <div className="mt-2 truncate text-xs text-slate-500">{orgName}</div>
      </div>
      <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
        {navLinks.map((l) => {
          const active = pathname === l.href || pathname.startsWith(l.href + "/");
          return (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className={`block rounded-full px-3 py-2 text-sm ${active ? "bg-sky-50 font-semibold text-[#0F2A4A]" : "text-slate-600 hover:bg-sky-50/60"}`}
            >
              {l.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-[#d7e6ef] p-4">
        <div className="text-sm font-medium text-slate-800">{userName}</div>
        <div className="text-xs capitalize text-slate-500">{role.replace("_", " ")}</div>
        <button type="button" onClick={logout} className="btn btn-secondary mt-3 w-full">
          Sign out
        </button>
      </div>
    </>
  );

  return (
    <>
      <div className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-[#d7e6ef] bg-white px-4 py-3 lg:hidden">
        <LogoMark href="/dashboard" className="scale-90" />
        <button type="button" className="btn btn-secondary px-3 py-2" aria-label="Open menu" onClick={() => setOpen(true)}>
          Menu
        </button>
      </div>
      {open ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button type="button" className="absolute inset-0 bg-slate-900/40" aria-label="Close menu" onClick={() => setOpen(false)} />
          <aside className="absolute left-0 top-0 flex h-full w-72 max-w-[85vw] flex-col bg-white shadow-xl">{nav}</aside>
        </div>
      ) : null}
      <aside className="hidden h-full w-64 shrink-0 flex-col border-r border-[#d7e6ef] bg-white lg:flex">{nav}</aside>
    </>
  );
}
