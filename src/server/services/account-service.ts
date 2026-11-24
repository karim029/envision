// "Who am I and which company am I in?" — what the dashboard header shows.
// Inputs come from requireAuthContext() (server-derived), never from the client.
import { prisma } from "@/server/db/client";

export interface AccountSummary {
  tenantName: string;
  email: string;
}

/** No User with this id in this tenant. Since requireAuthContext() just found the user,
 *  this means a bug or a tenant mismatch, never a normal case — so the page must not render. */
export class AccountNotFoundError extends Error {
  constructor() {
    super("Account not found for this tenant");
    this.name = "AccountNotFoundError";
  }
}

/**
 * Rules (see tests/integration/account-service.test.ts):
 * 1. ONE query: the User where id = userId AND tenantId = tenantId,
 *    selecting only email + the tenant's name (through the relation).
 * 2. No match → throw new AccountNotFoundError().
 * 3. Return exactly { tenantName, email }.
 */
export async function getAccountSummary(input: {
  tenantId: string;
  userId: string;
}): Promise<AccountSummary> {
  const result = await prisma.user.findFirst({
    select: {
      email: true,
      tenant: {
        select: {
          name: true,
        },
      },
    },
    where: {
      id: input.userId,
      tenantId: input.tenantId,
    },
  });
  if (!result) {
    throw new AccountNotFoundError();
  }
  return {
    email: result.email,
    tenantName: result.tenant.name,
  };
}
