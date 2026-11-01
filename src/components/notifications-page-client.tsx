"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

type N = { id: string; title: string; body: string; href: string; kind: string; read: boolean; createdAt: string };

export function NotificationsPageClient({ initial }: { initial: N[] }) {
  const [items, setItems] = useState(initial);
  const router = useRouter();

  async function mark(id: string) {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    router.refresh();
  }

  async function markAll() {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ all: true }),
    });
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    router.refresh();
  }

  return (
    <div className="space-y-3">
      <button type="button" className="btn btn-secondary" onClick={() => void markAll()}>
        Mark all read
      </button>
      <ul className="space-y-2">
        {items.map((n) => (
          <li key={n.id} className={`card p-4 ${n.read ? "" : "ring-1 ring-sky-200"}`}>
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <div className="text-xs uppercase text-slate-500">{n.kind}</div>
                <div className="font-semibold text-[#0F2A4A]">{n.title}</div>
                {n.body ? <p className="mt-1 text-sm text-slate-600">{n.body}</p> : null}
                <p className="mt-1 text-xs text-slate-400">{n.createdAt}</p>
              </div>
              <div className="flex gap-2">
                {n.href ? (
                  <Link href={n.href} className="btn btn-secondary px-3 py-1 text-xs">
                    Open
                  </Link>
                ) : null}
                {!n.read ? (
                  <button type="button" className="btn btn-secondary px-3 py-1 text-xs" onClick={() => void mark(n.id)}>
                    Mark read
                  </button>
                ) : null}
              </div>
            </div>
          </li>
        ))}
        {items.length === 0 ? <li className="text-sm text-slate-600">No notifications yet.</li> : null}
      </ul>
    </div>
  );
}
