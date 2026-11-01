"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type KeyRow = {
  id: string;
  name: string;
  keyPrefix: string;
  role: string;
  createdAt: string | Date;
  lastUsedAt: string | Date | null;
  revokedAt: string | Date | null;
};

type OrgRow = { id: string; name: string; slug: string; role: string };
type MemberRow = { membershipId: string; userId: string; email: string; name: string; role: string };
type InviteRow = { id: string; email: string; role: string; expiresAt: string | Date; acceptUrl: string };

export function SettingsClient({
  keys,
  orgs,
  members,
  invites,
  currentOrgId,
  isAdmin,
}: {
  keys: KeyRow[];
  orgs: OrgRow[];
  members: MemberRow[];
  invites: InviteRow[];
  currentOrgId: string;
  isAdmin: boolean;
}) {
  const router = useRouter();
  const [revealed, setRevealed] = useState<string | null>(null);
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function createKey() {
    setError("");
    const name = (document.getElementById("key-name") as HTMLInputElement).value;
    const role = (document.getElementById("key-role") as HTMLSelectElement).value;
    const res = await fetch("/api/settings/api-keys", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, role }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(body.error || "Failed");
      return;
    }
    setRevealed(body.key);
    router.refresh();
  }

  async function revoke(id: string) {
    await fetch("/api/settings/api-keys", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    router.refresh();
  }

  async function createOrg() {
    setError("");
    const name = (document.getElementById("org-name") as HTMLInputElement).value;
    const slug = (document.getElementById("org-slug") as HTMLInputElement).value;
    const res = await fetch("/api/orgs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, slug }),
    });
    if (!res.ok) {
      setError((await res.json().catch(() => ({}))).error || "Org create failed");
      return;
    }
    router.refresh();
  }

  async function switchOrg(orgId: string) {
    await fetch("/api/orgs", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "switch", orgId }),
    });
    router.refresh();
  }

  async function createInvite() {
    setError("");
    setInviteUrl(null);
    const email = (document.getElementById("invite-email") as HTMLInputElement).value;
    const role = (document.getElementById("invite-role") as HTMLSelectElement).value;
    const res = await fetch("/api/invites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, role }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(body.error || "Invite failed");
      return;
    }
    setInviteUrl(body.acceptUrl);
    router.refresh();
  }

  async function revokeInvite(id: string) {
    await fetch("/api/invites", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    router.refresh();
  }

  async function removeMember(membershipId: string) {
    setError("");
    const res = await fetch("/api/members", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ membershipId }),
    });
    if (!res.ok) {
      setError((await res.json().catch(() => ({}))).error || "Remove failed");
      return;
    }
    router.refresh();
  }

  async function copyLink(url: string) {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="space-y-8">
      <div className="card p-5">
        <h2 className="text-sm font-semibold text-slate-900">Team members</h2>
        <p className="mt-1 text-sm text-slate-600">People with access to this organisation.</p>
        <ul className="mt-4 space-y-2">
          {members.map((m) => (
            <li key={m.membershipId} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm">
              <div>
                <div className="font-medium text-slate-800">{m.name}</div>
                <div className="text-xs text-slate-500">{m.email} · {m.role}</div>
              </div>
              {isAdmin ? (
                <button type="button" className="btn btn-secondary" onClick={() => removeMember(m.membershipId)}>
                  Remove
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      </div>

      {isAdmin ? (
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-slate-900">Invite by email link</h2>
          <p className="mt-1 text-sm text-slate-600">
            Creates a copyable accept link. Email is not sent — share the link yourself.
          </p>
          {inviteUrl ? (
            <div className="mt-3 rounded-lg border border-teal-200 bg-teal-50 px-3 py-2 text-sm text-teal-900">
              <div className="font-medium">Invite link (copy and share)</div>
              <code className="mt-1 block break-all text-xs">{inviteUrl}</code>
              <button type="button" className="btn btn-secondary mt-2" onClick={() => copyLink(inviteUrl)}>
                Copy link
              </button>
            </div>
          ) : null}
          <div className="mt-4 flex flex-wrap gap-2">
            <input id="invite-email" className="input flex-1" type="email" placeholder="colleague@company.com" />
            <select id="invite-role" className="select w-40" defaultValue="ai_owner">
              <option value="admin">admin</option>
              <option value="ai_owner">ai_owner</option>
              <option value="auditor">auditor</option>
            </select>
            <button type="button" className="btn btn-primary" onClick={createInvite}>
              Create invite
            </button>
          </div>
          <ul className="mt-4 space-y-2">
            {invites.map((i) => (
              <li key={i.id} className="rounded-lg bg-slate-50 px-3 py-2 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="font-medium text-slate-800">{i.email}</div>
                    <div className="text-xs text-slate-500">
                      {i.role} · expires {new Date(i.expiresAt).toISOString().slice(0, 10)}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button type="button" className="btn btn-secondary" onClick={() => copyLink(i.acceptUrl)}>
                      Copy link
                    </button>
                    <button type="button" className="btn btn-secondary" onClick={() => revokeInvite(i.id)}>
                      Revoke
                    </button>
                  </div>
                </div>
                <code className="mt-1 block break-all text-[11px] text-slate-500">{i.acceptUrl}</code>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="card p-5">
        <h2 className="text-sm font-semibold text-slate-900">Organisations</h2>
        <p className="mt-1 text-sm text-slate-600">Multi-tenant memberships with RBAC roles per org.</p>
        <ul className="mt-4 space-y-2">
          {orgs.map((o) => (
            <li key={o.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm">
              <div>
                <div className="font-medium text-slate-800">{o.name}</div>
                <div className="text-xs text-slate-500">
                  {o.slug} · {o.role}
                  {o.id === currentOrgId ? " · current" : ""}
                </div>
              </div>
              {o.id !== currentOrgId ? (
                <button type="button" className="btn btn-secondary" onClick={() => switchOrg(o.id)}>
                  Switch
                </button>
              ) : null}
            </li>
          ))}
        </ul>
        <div className="mt-4 flex flex-wrap gap-2">
          <input id="org-name" className="input flex-1" placeholder="New organisation name" />
          <input id="org-slug" className="input w-40" placeholder="slug" />
          <button type="button" className="btn btn-primary" onClick={createOrg}>
            Create org
          </button>
        </div>
      </div>

      {isAdmin ? (
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-slate-900">API keys</h2>
          <p className="mt-1 text-sm text-slate-600">
            Use <code className="text-xs">Authorization: Bearer v77_…</code> against <code className="text-xs">/api/v1/*</code>. Secrets are shown once.
          </p>
          {revealed ? (
            <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
              Copy now — this is the only time the full key is shown: <code className="break-all">{revealed}</code>
            </div>
          ) : null}
          <div className="mt-4 flex flex-wrap gap-2">
            <input id="key-name" className="input flex-1" placeholder="Key name" defaultValue="CI integration" />
            <select id="key-role" className="select w-40" defaultValue="ai_owner">
              <option value="admin">admin</option>
              <option value="ai_owner">ai_owner</option>
              <option value="auditor">auditor</option>
            </select>
            <button type="button" className="btn btn-primary" onClick={createKey}>
              Create key
            </button>
          </div>
          <ul className="mt-4 space-y-2">
            {keys.map((k) => (
              <li key={k.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm">
                <div>
                  <div className="font-medium text-slate-800">{k.name}</div>
                  <div className="text-xs text-slate-500">
                    {k.keyPrefix}… · {k.role}
                    {k.revokedAt ? " · revoked" : ""}
                    {k.lastUsedAt ? ` · last used ${new Date(k.lastUsedAt).toISOString()}` : ""}
                  </div>
                </div>
                {!k.revokedAt ? (
                  <button type="button" className="btn btn-secondary" onClick={() => revoke(k.id)}>
                    Revoke
                  </button>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="text-sm text-slate-500">API key management is available to admins.</p>
      )}
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
    </div>
  );
}
