// Chunk 1 Done Gate: signing up with a valid invite link creates a DEMO tenant with
// 30 minutes and an ADMIN user; invalid, used or expired invites are rejected.
import { createHash, randomBytes, randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import { prisma } from "@/server/db/client";
import {
  InvalidInviteError,
  onboardTenant,
} from "@/server/services/onboarding-service";

const DAY_MS = 24 * 60 * 60 * 1000;

/** Inserts an invite directly (independent of createInvite) and returns its raw token. */
async function seedInvite(
  overrides: { expiresAt?: Date; usedAt?: Date } = {},
): Promise<{ token: string; inviteId: string }> {
  const token = randomBytes(32).toString("base64url");
  const invite = await prisma.invite.create({
    data: {
      tokenHash: createHash("sha256").update(token).digest("hex"),
      label: "Test invite",
      expiresAt: overrides.expiresAt ?? new Date(Date.now() + 14 * DAY_MS),
      usedAt: overrides.usedAt ?? null,
    },
  });
  return { token, inviteId: invite.id };
}

function signupInput(
  inviteToken: string,
  overrides: Partial<Parameters<typeof onboardTenant>[0]> = {},
) {
  return {
    authUserId: randomUUID(),
    email: `hr.${randomUUID().slice(0, 8)}@acme.test`,
    companyName: "Acme Corp",
    inviteToken,
    ...overrides,
  };
}

describe("onboardTenant", () => {
  it("creates a DEMO tenant with 30 minutes and an ADMIN user for a valid invite", async () => {
    const { token, inviteId } = await seedInvite();
    const input = signupInput(token, { email: "hr.lead@acme.test" });

    const result = await onboardTenant(input);

    expect(result.created).toBe(true);
    expect(result.userId).toBe(input.authUserId);

    const tenant = await prisma.tenant.findUniqueOrThrow({
      where: { id: result.tenantId },
    });
    expect(tenant).toMatchObject({
      name: "Acme Corp",
      planTier: "DEMO",
      minutesBalance: 30,
    });

    const user = await prisma.user.findUniqueOrThrow({
      where: { id: input.authUserId },
    });
    expect(user).toMatchObject({
      tenantId: result.tenantId,
      email: "hr.lead@acme.test",
      role: "ADMIN",
    });

    const invite = await prisma.invite.findUniqueOrThrow({
      where: { id: inviteId },
    });
    expect(invite.usedAt).toBeInstanceOf(Date);
    expect(invite.usedByTenantId).toBe(result.tenantId);
  });

  it("rejects an unknown invite token and writes nothing", async () => {
    await expect(
      onboardTenant(signupInput(randomBytes(32).toString("base64url"))),
    ).rejects.toBeInstanceOf(InvalidInviteError);

    expect(await prisma.tenant.count()).toBe(0);
    expect(await prisma.user.count()).toBe(0);
  });

  it("rejects an empty invite token and writes nothing", async () => {
    await expect(onboardTenant(signupInput(""))).rejects.toBeInstanceOf(
      InvalidInviteError,
    );
    expect(await prisma.tenant.count()).toBe(0);
  });

  it("rejects an invite that was already used by someone else", async () => {
    const { token } = await seedInvite();
    await onboardTenant(signupInput(token));

    await expect(onboardTenant(signupInput(token))).rejects.toBeInstanceOf(
      InvalidInviteError,
    );
    expect(await prisma.tenant.count()).toBe(1);
  });

  it("rejects an expired invite and leaves it unused", async () => {
    const { token, inviteId } = await seedInvite({
      expiresAt: new Date(Date.now() - 1000),
    });

    await expect(onboardTenant(signupInput(token))).rejects.toBeInstanceOf(
      InvalidInviteError,
    );

    expect(await prisma.tenant.count()).toBe(0);
    const invite = await prisma.invite.findUniqueOrThrow({
      where: { id: inviteId },
    });
    expect(invite.usedAt).toBeNull();
  });

  it("lets exactly one of two simultaneous signups use the same invite", async () => {
    const { token } = await seedInvite();

    const results = await Promise.allSettled([
      onboardTenant(signupInput(token)),
      onboardTenant(signupInput(token)),
    ]);

    const fulfilled = results.filter((r) => r.status === "fulfilled");
    const rejected = results.filter(
      (r): r is PromiseRejectedResult => r.status === "rejected",
    );
    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);
    expect(rejected[0].reason).toBeInstanceOf(InvalidInviteError);
    expect(await prisma.tenant.count()).toBe(1);
  });

  it("is idempotent: retrying for the same auth user returns the same tenant", async () => {
    const { token } = await seedInvite();
    const input = signupInput(token);

    const first = await onboardTenant(input);
    // The invite is now used — a retry must still succeed, not throw InvalidInviteError.
    const second = await onboardTenant(input);

    expect(second).toEqual({ ...first, created: false });
    expect(await prisma.tenant.count()).toBe(1);
    expect(await prisma.user.count()).toBe(1);
  });

  it("is atomic: if the user can't be created, no tenant remains and the invite stays unused", async () => {
    const first = await seedInvite();
    await onboardTenant(signupInput(first.token, { email: "taken@acme.test" }));

    // A different auth user with an email that is already taken: the User insert fails on
    // the unique email, so the Tenant AND the invite claim in the same transaction roll back.
    const second = await seedInvite();
    await expect(
      onboardTenant(
        signupInput(second.token, {
          email: "taken@acme.test",
          companyName: "Orphan Inc",
        }),
      ),
    ).rejects.toThrow();

    expect(await prisma.tenant.count()).toBe(1);
    expect(
      await prisma.tenant.findFirst({ where: { name: "Orphan Inc" } }),
    ).toBeNull();
    const invite = await prisma.invite.findUniqueOrThrow({
      where: { id: second.inviteId },
    });
    expect(invite.usedAt).toBeNull();
  });

  it("normalises email to lower case", async () => {
    const { token } = await seedInvite();
    const input = signupInput(token, { email: "HR.Lead@ACME.test" });

    await onboardTenant(input);

    const user = await prisma.user.findUniqueOrThrow({
      where: { id: input.authUserId },
    });
    expect(user.email).toBe("hr.lead@acme.test");
  });

  it("rejects invalid input before touching the invite", async () => {
    const { token, inviteId } = await seedInvite();

    await expect(
      onboardTenant(signupInput(token, { companyName: "   " })),
    ).rejects.toThrow();
    await expect(
      onboardTenant(signupInput(token, { authUserId: "not-a-uuid" })),
    ).rejects.toThrow();

    expect(await prisma.tenant.count()).toBe(0);
    const invite = await prisma.invite.findUniqueOrThrow({
      where: { id: inviteId },
    });
    expect(invite.usedAt).toBeNull();
  });
});
