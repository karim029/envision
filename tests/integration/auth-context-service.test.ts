import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import { ZodError } from "zod";
import { prisma } from "@/server/db/client";
import { getAuthContext } from "@/server/services/auth-context-service";

/** Creates a tenant with one user directly (independent of onboardTenant). */
async function seedUser(role: "ADMIN" | "MEMBER" = "ADMIN") {
  const tenant = await prisma.tenant.create({ data: { name: "Acme Corp" } });
  const user = await prisma.user.create({
    data: {
      id: randomUUID(),
      tenantId: tenant.id,
      email: `hr.${randomUUID().slice(0, 8)}@acme.test`,
      role,
    },
  });
  return { tenant, user };
}

describe("getAuthContext", () => {
  it("returns the user's tenant and role for an onboarded user", async () => {
    const { tenant, user } = await seedUser("ADMIN");

    expect(await getAuthContext(user.id)).toEqual({
      status: "ok",
      context: { userId: user.id, tenantId: tenant.id, role: "ADMIN" },
    });
  });

  it("reads the role from the database (not hard-coded)", async () => {
    const { user } = await seedUser("MEMBER");

    const result = await getAuthContext(user.id);

    expect(result.status === "ok" && result.context.role).toBe("MEMBER");
  });

  it("returns exactly userId, tenantId and role — nothing else", async () => {
    const { user } = await seedUser();

    const result = await getAuthContext(user.id);

    expect(result.status).toBe("ok");
    if (result.status === "ok") {
      expect(Object.keys(result.context).sort()).toEqual([
        "role",
        "tenantId",
        "userId",
      ]);
    }
  });

  it("gives each user their own tenant (no mix-ups between tenants)", async () => {
    const a = await seedUser();
    const b = await seedUser();

    const resultA = await getAuthContext(a.user.id);
    const resultB = await getAuthContext(b.user.id);

    expect(resultA.status === "ok" && resultA.context.tenantId).toBe(
      a.tenant.id,
    );
    expect(resultB.status === "ok" && resultB.context.tenantId).toBe(
      b.tenant.id,
    );
  });

  it("says needs_onboarding for a logged-in person with no User row", async () => {
    expect(await getAuthContext(randomUUID())).toEqual({
      status: "needs_onboarding",
    });
  });

  it("throws a validation error for an id that is not a UUID", async () => {
    await expect(getAuthContext("not-a-uuid")).rejects.toThrow(ZodError);
  });
});
