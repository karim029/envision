import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import { prisma } from "@/server/db/client";
import {
  AccountNotFoundError,
  getAccountSummary,
} from "@/server/services/account-service";

/** Creates a tenant with one user directly (independent of onboardTenant). */
async function seedUser(tenantName: string) {
  const tenant = await prisma.tenant.create({ data: { name: tenantName } });
  const user = await prisma.user.create({
    data: {
      id: randomUUID(),
      tenantId: tenant.id,
      email: `hr.${randomUUID().slice(0, 8)}@acme.test`,
      role: "ADMIN",
    },
  });
  return { tenant, user };
}

describe("getAccountSummary", () => {
  it("returns the tenant's name and the user's email", async () => {
    const { tenant, user } = await seedUser("Acme Corp");

    expect(
      await getAccountSummary({ tenantId: tenant.id, userId: user.id }),
    ).toEqual({ tenantName: "Acme Corp", email: user.email });
  });

  it("returns exactly tenantName and email — nothing else", async () => {
    const { tenant, user } = await seedUser("Acme Corp");

    const summary = await getAccountSummary({
      tenantId: tenant.id,
      userId: user.id,
    });

    expect(Object.keys(summary).sort()).toEqual(["email", "tenantName"]);
  });

  it("refuses a user id from ANOTHER tenant (tenant isolation)", async () => {
    const a = await seedUser("Acme Corp");
    const b = await seedUser("Globex");

    // Tenant A's id + tenant B's user: must not leak Globex or B's email.
    await expect(
      getAccountSummary({ tenantId: a.tenant.id, userId: b.user.id }),
    ).rejects.toThrow(AccountNotFoundError);
  });

  it("throws AccountNotFoundError for a user that doesn't exist", async () => {
    const { tenant } = await seedUser("Acme Corp");

    await expect(
      getAccountSummary({ tenantId: tenant.id, userId: randomUUID() }),
    ).rejects.toThrow(AccountNotFoundError);
  });
});
