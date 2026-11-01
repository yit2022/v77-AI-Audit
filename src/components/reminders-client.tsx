"use client";

import { useRouter } from "next/navigation";

type Rem = {
  id: string;
  kind: string;
  title: string;
  body: string;
  href: string;
  dueAt: string | null;
  acknowledgedAt: string | null;
};

export function RemindersClient({ reminders }: { reminders: Rem[] }) {
  const router = useRouter();

  async function ack(id: string) {
    await fetch("/api/reminders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    router.refresh();
  }

  return (
    <ul className="space-y-3">
      {reminders.map((r) => (
        <li key={r.id} className={`card p-4 ${r.acknowledgedAt ? "opacity-60" : ""}`}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-sky-700">{r.kind}</div>
              <div className="mt-1 font-medium text-[#0F2A4A]">{r.title}</div>
              <p className="mt-1 text-sm text-slate-600">{r.body}</p>
              {r.dueAt ? <p className="mt-1 text-xs text-slate-500">Due {new Date(r.dueAt).toLocaleString()}</p> : null}
              {r.href ? (
                <a className="mt-2 inline-block text-sm font-semibold text-sky-700 hover:underline" href={r.href}>
                  Open
                </a>
              ) : null}
            </div>
            {!r.acknowledgedAt ? (
              <button type="button" className="btn btn-secondary" onClick={() => void ack(r.id)}>
                Acknowledge
              </button>
            ) : (
              <span className="text-xs text-slate-500">Acknowledged</span>
            )}
          </div>
        </li>
      ))}
      {reminders.length === 0 ? (
        <li className="text-sm text-slate-600">No in-app reminders. Schedules create reminders here — never by email.</li>
      ) : null}
    </ul>
  );
}
