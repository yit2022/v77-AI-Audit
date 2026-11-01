"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";

export default function AcceptInvitePage() {
  const params = useParams<{ token: string }>();
  const router = useRouter();
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const res = await fetch("/api/invites/accept", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: params.token, name, password }),
    });
    const body = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      setError(body.error || "Could not accept invite");
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-12">
      <div className="card p-6">
        <div className="text-xs font-bold uppercase tracking-[0.16em] text-sky-700">V77</div>
        <h1 className="mt-2 text-xl font-semibold text-slate-900">Accept team invite</h1>
        <p className="mt-2 text-sm text-slate-600">
          Create your password to join the organisation. No email is sent — use the link your admin shared.
        </p>
        <form onSubmit={onSubmit} className="mt-6 space-y-3">
          <input className="input w-full" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} required />
          <input
            className="input w-full"
            type="password"
            placeholder="Password (min 10 chars)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={10}
            required
          />
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <button type="submit" className="btn btn-primary w-full" disabled={busy}>
            {busy ? "Joining…" : "Join organisation"}
          </button>
        </form>
      </div>
    </main>
  );
}
