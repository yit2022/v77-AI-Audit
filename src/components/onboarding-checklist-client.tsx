"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

type Item = { id: string; title: string; body: string; href: string; done: boolean };

export function OnboardingChecklistClient({ items }: { items: Item[] }) {
  const router = useRouter();
  const doneCount = items.filter((i) => i.done).length;

  async function toggle(stepId: string, done: boolean) {
    await fetch("/api/onboarding-checklist", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stepId, done }),
    });
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600">
        {doneCount}/{items.length} complete — persisted per organisation (not only this browser).
      </p>
      <ul className="space-y-3">
        {items.map((item) => (
          <li key={item.id} className="card flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="font-semibold text-[#0F2A4A]">
                {item.done ? "✓ " : ""}
                {item.title}
              </div>
              <p className="mt-1 text-sm text-slate-600">{item.body}</p>
              <Link href={item.href} className="mt-2 inline-block text-sm font-semibold text-sky-700 hover:underline">
                Go to module
              </Link>
            </div>
            <button
              type="button"
              className="btn btn-secondary shrink-0"
              onClick={() => void toggle(item.id, !item.done)}
            >
              {item.done ? "Mark undone" : "Mark done"}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
