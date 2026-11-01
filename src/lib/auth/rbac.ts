import type { Role } from "@/lib/db/schema";

/** Granular enterprise roles. admin = org owner; ai_owner = system owner; reviewer = approvals; auditor = read-only. */
export const ROLE_LABELS: Record<Role, string> = {
  admin: "Owner (admin)",
  ai_owner: "Owner",
  reviewer: "Reviewer",
  auditor: "Auditor (read-only)",
};

const RANK: Record<Role, number> = {
  auditor: 1,
  reviewer: 2,
  ai_owner: 3,
  admin: 4,
};

export function normalizeRole(role: string): Role {
  if (role === "owner") return "ai_owner";
  if (role === "admin" || role === "ai_owner" || role === "reviewer" || role === "auditor") return role;
  return "auditor";
}

export function roleAtLeast(role: Role | string, minimum: Role): boolean {
  const r = normalizeRole(String(role));
  return RANK[r] >= RANK[minimum];
}

export function canRead(_role: Role | string): boolean {
  return true;
}

/** Mutate inventory, evidence, assessments, findings. */
export function canWrite(role: Role | string): boolean {
  return roleAtLeast(role, "ai_owner");
}

/** Approve assessment / sign-off workflow steps (reviewer+). Auditors comment but do not approve. */
export function canApprove(role: Role | string): boolean {
  return roleAtLeast(role, "reviewer");
}

/** Org settings, invites, API keys, trust center publish. */
export function canAdmin(role: Role | string): boolean {
  return roleAtLeast(role, "admin");
}

/** Auditors are explicitly read-only for mutations. */
export function isReadOnly(role: Role | string): boolean {
  return normalizeRole(String(role)) === "auditor";
}

export type Permission =
  | "read"
  | "write"
  | "approve"
  | "admin";

export function hasPermission(role: Role | string, permission: Permission): boolean {
  switch (permission) {
    case "read":
      return canRead(role);
    case "write":
      return canWrite(role);
    case "approve":
      return canApprove(role);
    case "admin":
      return canAdmin(role);
  }
}
