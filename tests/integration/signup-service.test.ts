// signUpWithInvite against the real test database, with a FAKE auth provider injected.
// Each test decides what "Supabase" answers — no real accounts, no emails.
import { randomUUID } from "node:crypto";
import { describe, expect, it, vi } from "vitest";
import { prisma } from "@/server/db/client";
import { createInvite } from "@/server/services/invite-service";
import { onboardTenant } from "@/server/services/onboarding-service";
import {
  signUpWithInvite,
  type SignUpAuthResult,
  type SignUpFn,
} from "@/server/services/signup-service";

/** A fake signUp that always answers `result` and records how it was called. */
function fakeSignUp(result: SignUpAuthResult) {
  return vi.fn<SignUpFn>(async () => result);
}

function created() {
  return fakeSignUp({ status: "created", authUserId: randomUUID() });
}

async function validForm(overrides: Record<string, unknown> = {}) {
  const { token } = await createInvite({ label: "Sara @ Acme" });
  return {
    email: "Sara@Acme.test",
    password: "correct-horse-battery",
    companyName: "Acme Corp",
    inviteToken: token,
    ...overrides,
  };
}

describe("signUpWithInvite", () => {
  it("creates the account, onboards the tenant and says check_email", async () => {
    const authUserId = randomUUID();
    const signUp = fakeSignUp({ status: "created", authUserId });

    const outcome = await signUpWithInvite(await validForm(), { signUp });

    expect(outcome).toEqual({ status: "check_email" });
    // The VALIDATED values go to the provider (email lowercased).
    expect(signUp).toHaveBeenCalledWith(
      "sara@acme.test",
      "correct-horse-battery",
    );
    const user = await prisma.user.findUniqueOrThrow({
      where: { id: authUserId },
    });
    expect(user).toMatchObject({ email: "sara@acme.test", role: "ADMIN" });
    expect(await prisma.invite.count({ where: { usedAt: null } })).toBe(0);
  });

  it("rejects invalid input per field and never calls signUp", async () => {
    const signUp = created();

    const outcome = await signUpWithInvite(
      await validForm({
        email: "not-an-email",
        password: "short",
        companyName: "  ",
      }),
      { signUp },
    );

    expect(outcome.status).toBe("invalid_input");
    if (outcome.status === "invalid_input") {
      expect(Object.keys(outcome.fieldErrors).sort()).toEqual([
        "companyName",
        "email",
        "password",
      ]);
    }
    expect(signUp).not.toHaveBeenCalled();
    expect(await prisma.tenant.count()).toBe(0);
  });

  it("rejects input that is not even an object", async () => {
    const signUp = created();

    const outcome = await signUpWithInvite(null, { signUp });

    expect(outcome.status).toBe("invalid_input");
    expect(signUp).not.toHaveBeenCalled();
  });

  it.each([
    ["not_found", async () => ({ inviteToken: "no-such-token" })],
    [
      "used",
      async () => {
        const { inviteId, token } = await createInvite({ label: "used" });
        await prisma.invite.update({
          where: { id: inviteId },
          data: { usedAt: new Date() },
        });
        return { inviteToken: token };
      },
    ],
    [
      "expired",
      async () => {
        const { inviteId, token } = await createInvite({ label: "expired" });
        await prisma.invite.update({
          where: { id: inviteId },
          data: { expiresAt: new Date(Date.now() - 1000) },
        });
        return { inviteToken: token };
      },
    ],
  ] as const)(
    "stops a %s invite BEFORE creating an account",
    async (reason, makeOverrides) => {
      const signUp = created();

      const outcome = await signUpWithInvite(
        await validForm(await makeOverrides()),
        { signUp },
      );

      expect(outcome).toEqual({ status: "invite_unusable", reason });
      expect(signUp).not.toHaveBeenCalled();
      expect(await prisma.tenant.count()).toBe(0);
    },
  );

  it.each(["email_taken", "rate_limited", "failed"] as const)(
    "passes the provider's %s through and onboards nothing",
    async (status) => {
      const form = await validForm();

      const outcome = await signUpWithInvite(form, {
        signUp: fakeSignUp({ status }),
      });

      expect(outcome).toEqual({ status });
      expect(await prisma.tenant.count()).toBe(0);
      // The invite is still usable for a second attempt.
      expect(await prisma.invite.count({ where: { usedAt: null } })).toBe(1);
    },
  );

  it("reports invite_claimed_meanwhile when someone uses the invite between the pre-check and onboarding", async () => {
    const form = await validForm();
    // While "Supabase" is creating Sara's account, someone else signs up with the same link.
    const signUp = vi.fn<SignUpFn>(async () => {
      await onboardTenant({
        authUserId: randomUUID(),
        email: "someone.else@acme.test",
        companyName: "Someone Else Inc",
        inviteToken: form.inviteToken,
      });
      return { status: "created", authUserId: randomUUID() };
    });

    const outcome = await signUpWithInvite(form, { signUp });

    expect(outcome).toEqual({ status: "invite_claimed_meanwhile" });
    expect(await prisma.tenant.count()).toBe(1); // only the other person's
  });

  it("does not disguise unexpected errors as an outcome", async () => {
    // Our database already has a user with this email, but the provider says "created":
    // onboarding fails on the unique email — a real problem, so it must propagate.
    const tenant = await prisma.tenant.create({ data: { name: "Existing" } });
    await prisma.user.create({
      data: { id: randomUUID(), tenantId: tenant.id, email: "sara@acme.test" },
    });

    // The SPECIFIC database error (Postgres unique violation, Prisma code P2002) —
    // a bare `.rejects.toThrow()` would also pass for a TODO stub (false positive).
    await expect(
      signUpWithInvite(await validForm(), { signUp: created() }),
    ).rejects.toMatchObject({
      name: "PrismaClientKnownRequestError",
      code: "P2002",
    });
  });
});
