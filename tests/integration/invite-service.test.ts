import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { prisma } from "@/server/db/client";
import { checkInvite, createInvite } from "@/server/services/invite-service";

const DAY_MS = 24 * 60 * 60 * 1000;
const sha256Hex = (s: string) => createHash("sha256").update(s).digest("hex");

describe("createInvite", () => {
  it("stores only the hash of the token, never the token itself", async () => {
    const { inviteId, token } = await createInvite({ label: "Sara @ Acme" });

    const invite = await prisma.invite.findUniqueOrThrow({
      where: { id: inviteId },
    });
    expect(invite.tokenHash).toBe(sha256Hex(token));
    expect(JSON.stringify(invite)).not.toContain(token);
  });

  it("creates an unused invite with the trimmed label", async () => {
    const { inviteId } = await createInvite({ label: "  Sara @ Acme  " });

    const invite = await prisma.invite.findUniqueOrThrow({
      where: { id: inviteId },
    });
    expect(invite).toMatchObject({
      label: "Sara @ Acme",
      usedAt: null,
      usedByTenantId: null,
    });
  });

  it("expires in 14 days by default", async () => {
    const before = Date.now();
    const { expiresAt } = await createInvite({ label: "Sara @ Acme" });

    expect(expiresAt.getTime()).toBeGreaterThanOrEqual(before + 14 * DAY_MS);
    expect(expiresAt.getTime()).toBeLessThanOrEqual(Date.now() + 14 * DAY_MS);
  });

  it("accepts a custom expiry", async () => {
    const before = Date.now();
    const { expiresAt } = await createInvite({
      label: "Sara @ Acme",
      expiresInDays: 3,
    });

    expect(expiresAt.getTime()).toBeGreaterThanOrEqual(before + 3 * DAY_MS);
    expect(expiresAt.getTime()).toBeLessThan(before + 4 * DAY_MS);
  });

  it("generates a different token for every invite", async () => {
    const a = await createInvite({ label: "A" });
    const b = await createInvite({ label: "B" });
    expect(a.token).not.toBe(b.token);
  });

  it("rejects an empty label and writes nothing", async () => {
    await expect(createInvite({ label: "   " })).rejects.toThrow();
    expect(await prisma.invite.count()).toBe(0);
  });
});

describe("checkInvite", () => {
  it("says a fresh invite is usable", async () => {
    const { token } = await createInvite({ label: "Sara @ Acme" });

    expect(await checkInvite(token)).toEqual({ usable: true });
  });

  it("ignores whitespace around a pasted token", async () => {
    const { token } = await createInvite({ label: "Sara @ Acme" });

    expect(await checkInvite(`  ${token}\n`)).toEqual({ usable: true });
  });

  it("reports an unknown token as not_found", async () => {
    expect(await checkInvite("this-token-does-not-exist")).toEqual({
      usable: false,
      reason: "not_found",
    });
  });

  it("reports an empty token as not_found", async () => {
    expect(await checkInvite("")).toEqual({
      usable: false,
      reason: "not_found",
    });
  });

  it("reports a used invite as used", async () => {
    const { inviteId, token } = await createInvite({ label: "Sara @ Acme" });
    await prisma.invite.update({
      where: { id: inviteId },
      data: { usedAt: new Date() },
    });

    expect(await checkInvite(token)).toEqual({
      usable: false,
      reason: "used",
    });
  });

  it("reports an expired invite as expired", async () => {
    const { inviteId, token } = await createInvite({ label: "Sara @ Acme" });
    await prisma.invite.update({
      where: { id: inviteId },
      data: { expiresAt: new Date(Date.now() - 1000) },
    });

    expect(await checkInvite(token)).toEqual({
      usable: false,
      reason: "expired",
    });
  });

  it("reports used (not expired) when an invite is both used and expired", async () => {
    const { inviteId, token } = await createInvite({ label: "Sara @ Acme" });
    await prisma.invite.update({
      where: { id: inviteId },
      data: { usedAt: new Date(), expiresAt: new Date(Date.now() - 1000) },
    });

    expect(await checkInvite(token)).toEqual({
      usable: false,
      reason: "used",
    });
  });

  it("is read-only: checking does not use up the invite", async () => {
    const { inviteId, token } = await createInvite({ label: "Sara @ Acme" });

    await checkInvite(token);
    await checkInvite(token);

    const invite = await prisma.invite.findUniqueOrThrow({
      where: { id: inviteId },
    });
    expect(invite.usedAt).toBeNull();
  });

  it("never reveals the invite's private label", async () => {
    const { token } = await createInvite({ label: "Sara — warm lead" });

    expect(JSON.stringify(await checkInvite(token))).not.toContain("warm lead");
  });
});
