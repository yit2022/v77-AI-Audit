"use client";

import { useState } from "react";
import Link from "next/link";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    const res = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    setMessage(data.message || "If an account exists for that email, we sent a password reset link.");
  }

  return (
    <form onSubmit={onSubmit} className="mt-6 space-y-4">
      <div>
        <label className="mb-1 block text-xs font-semibold text-slate-600">Email</label>
        <input
          className="input"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
        />
      </div>
      {message ? <p className="text-sm text-sky-800">{message}</p> : null}
      <button className="btn btn-primary w-full" disabled={loading}>
        {loading ? "Sending…" : "Send reset link"}
      </button>
      <p className="text-center text-xs text-slate-500">
        <Link className="font-semibold text-sky-800 underline" href="/login">
          Back to sign in
        </Link>
      </p>
    </form>
  );
}
