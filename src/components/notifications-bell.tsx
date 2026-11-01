"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type N = { id: string; title: string; body: string; href: string; read: boolean };

export function NotificationsBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<N[]>([]);

  async function load() {
    const res = await fetch("/api/notifications");
    if (!res.ok) return;
    const body = await res.json();
    setItems(body.notifications || []);
  }

  useEffect(() => {
    void load();
  }, []);

  const unread = items.filter((i) => !i.read).length;

  async function markAll() {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ all: true }),
    });
    void load();
  }

  return (
    <div className="relative">
      <button
        type="button"
        className="btn btn-secondary relative px-3 py-2 text-xs"
        aria-label="Notifications"
        onClick={() => {
          setOpen((v) => !v);
          void load();
        }}
      >
        Alerts
        {unread > 0 ? (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-sky-600 px-1 text-[10px] text-white">
            {unread}
          </span>
        ) : null}
      </button>
      {open ? (
        <div className="absolute right-0 z-50 mt-2 w-[min(100vw-2rem,22rem)] rounded-2xl border border-[#d7e6ef] bg-white p-3 shadow-lg">
          <div className="mb-2 flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-[#0F2A4A]">Notification centre</span>
            <button type="button" className="text-xs font-semibold text-sky-700" onClick={() => void markAll()}>
              Mark all read
            </button>
          </div>
          <ul className="max-h-72 space-y-2 overflow-y-auto">
            {items.length === 0 ? <li className="text-xs text-slate-500">No notifications yet.</li> : null}
            {items.slice(0, 8).map((n) => (
              <li key={n.id} className={`rounded-xl border px-3 py-2 text-xs ${n.read ? "border-slate-100" : "border-sky-100 bg-sky-50/60"}`}>
                <div className="font-semibold text-[#0F2A4A]">{n.title}</div>
                {n.body ? <p className="mt-0.5 text-slate-600">{n.body}</p> : null}
                {n.href ? (
                  <Link href={n.href} className="mt-1 inline-block font-semibold text-sky-700" onClick={() => setOpen(false)}>
                    Open
                  </Link>
                ) : null}
              </li>
            ))}
          </ul>
          <Link href="/notifications" className="mt-2 block text-center text-xs font-semibold text-sky-800" onClick={() => setOpen(false)}>
            View all
          </Link>
        </div>
      ) : null}
    </div>
  );
}
