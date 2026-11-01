"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export function SignupForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        orgName: fd.get("orgName"),
        name: fd.get("name"),
        email: fd.get("email"),
        password: fd.get("password"),
      }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Signup failed");
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className="mb-1 block text-xs font-semibold text-slate-600">Organisation name</label>
        <input name="orgName" className="input" required placeholder="Acme Governance Ltd" />
      </div>
      <div>
        <label className="mb-1 block text-xs font-semibold text-slate-600">Your name</label>
        <input name="name" className="input" required />
      </div>
      <div>
        <label className="mb-1 block text-xs font-semibold text-slate-600">Work email</label>
        <input name="email" type="email" className="input" required />
      </div>
      <div>
        <label className="mb-1 block text-xs font-semibold text-slate-600">Password</label>
        <input name="password" type="password" className="input" minLength={8} required />
      </div>
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      <button className="btn btn-primary w-full" disabled={loading}>
        {loading ? "Creating workspace…" : "Create organisation"}
      </button>
      <p className="text-center text-xs text-slate-500">
        Already have an account? <Link className="font-semibold text-sky-800 underline" href="/login">Sign in</Link>
      </p>
    </form>
  );
}
