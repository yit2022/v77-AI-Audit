"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

export function LoginForm() {
  const router = useRouter();
  const search = useSearchParams();
  const [email, setEmail] = useState("admin@v77.local");
  const [password, setPassword] = useState("");
  const [csrfToken, setCsrfToken] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [ssoEnabled, setSsoEnabled] = useState(false);

  useEffect(() => {
    const err = search.get("error");
    if (err) setError(`SSO error: ${err.replaceAll("_", " ")}`);
    fetch("/api/auth/oidc/status")
      .then((r) => r.json())
      .then((data) => setSsoEnabled(Boolean(data.enabled)))
      .catch(() => undefined);
    fetch("/api/auth/login", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => setCsrfToken(String(data.csrfToken || "")))
      .catch(() => undefined);
  }, [search]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/auth/login", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...(csrfToken ? { "x-csrf-token": csrfToken } : {}),
      },
      body: JSON.stringify({ email, password, csrfToken }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Login failed");
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6">
      <div className="card p-8">
        <Link href="/" className="text-xs font-bold uppercase tracking-[0.14em] text-teal-700">
          V77 AI Auditor
        </Link>
        <h1 className="mt-3 text-2xl font-semibold text-slate-900">Sign in</h1>
        <p className="mt-1 text-sm text-slate-500">
          Use your organisation credentials. Local development seeds are documented in the README only.
        </p>
        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-600">Email</label>
            <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-600">Password</label>
            <input
              className="input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error ? <p className="text-sm text-red-700">{error}</p> : null}
          <button className="btn btn-primary w-full" disabled={loading}>
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>
        {ssoEnabled ? (
          <a className="btn btn-secondary mt-4 w-full text-center" href="/api/auth/oidc/start">
            Continue with SSO
          </a>
        ) : (
          <p className="mt-4 text-center text-xs text-slate-400">
            SSO available when OIDC_ISSUER, OIDC_CLIENT_ID, OIDC_CLIENT_SECRET and OIDC_REDIRECT_URI are set.
          </p>
        )}
      </div>
    </main>
  );
}
