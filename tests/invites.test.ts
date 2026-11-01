import { describe, expect, it, beforeAll } from "vitest";
import { generateInviteToken, tokenFingerprint, createOrgInvite, acceptInvite, listOrgMembers, removeMember } from "../src/lib/invites";
import { ensureDb, db, schema } from "../src/lib/db";
import { seedIfEmpty } from "../src/lib/db/seed";
import { eq } from "drizzle-orm";

describe("team invites", () => {
  beforeAll(async () => {
    process.env.DISABLE_DEMO_PASSWORDS = "false";
    process.env.V77_DEMO_PASSWORD = "demo1234";
    delete process.env.V77_ADMIN_PASSWORD;
    await seedIfEmpty({ force: true });
  });

  it("generates opaque tokens", () => {
    const a = generateInviteToken();
    const b = generateInviteToken();
    expect(a).not.toEqual(b);
    expect(a.length).toBeGreaterThan(20);
    expect(tokenFingerprint(a)).toHaveLength(12);
  });

  it("creates invite link, accepts, and lists member", async () => {
    await ensureDb();
    const orgs = await db.select().from(schema.organisations).limit(1);
    const admins = await db.select().from(schema.users).where(eq(schema.users.email, "admin@v77.local")).limit(1);
    expect(orgs[0] && admins[0]).toBeTruthy();
    const invite = await createOrgInvite({
      orgId: orgs[0].id,
      email: "newhire@example.com",
      role: "auditor",
      invitedBy: admins[0].id,
    });
    expect(invite.acceptUrl).toContain("/invite/");
    const accepted = await acceptInvite({
      token: invite.token,
      name: "New Hire",
      password: "securepass99",
    });
    expect(accepted.role).toBe("auditor");
    const members = await listOrgMembers(orgs[0].id);
    expect(members.some((m) => m.email === "newhire@example.com")).toBe(true);
  });

  it("prevents removing the last admin", async () => {
    await ensureDb();
    const orgs = await db.select().from(schema.organisations).limit(1);
    const members = await listOrgMembers(orgs[0].id);
    const admin = members.find((m) => m.role === "admin");
    expect(admin).toBeTruthy();
    // Only one admin in seed — removal should fail
    await expect(removeMember(orgs[0].id, admin!.membershipId, admin!.userId)).rejects.toThrow(/yourself|last admin/i);
  });
});
