// Creates a new tenant and its first ADMIN user for a freshly signed-up Supabase auth user,
// consuming a single-use invite. Called by the signup flow in Slice 1d — never from the browser.
import { z } from "zod";
import { prisma } from "@/server/db/client";
import { hashInviteToken } from "./invite-token";

export const onboardTenantInputSchema = z.object({
  /** Supabase auth.users.id — becomes User.id. */
  authUserId: z.uuid(),
  email: z.email().transform((e) => e.toLowerCase()),
  companyName: z.string().trim().min(1).max(100),
  /** The raw token from the signup link (?invite=<token>). */
  inviteToken: z.string(),
});

export type OnboardTenantInput = z.input<typeof onboardTenantInputSchema>;

export interface OnboardTenantResult {
  tenantId: string;
  userId: string;
  /** false when this auth user was already onboarded (a retry) — nothing new was written. */
  created: boolean;
}

/** Unknown, already used, or expired invite. One error for all three on purpose. */
export class InvalidInviteError extends Error {
  constructor() {
    super("This invite link is invalid, already used, or expired");
    this.name = "InvalidInviteError";
  }
}

/**
 * Rules (see tests/integration/onboarding.test.ts):
 * 1. Validate input with onboardTenantInputSchema.
 * 2. Already onboarded (a User with id = authUserId exists) → return its tenant,
 *    created: false. This must happen BEFORE touching the invite: on a retry the
 *    invite is already used.
 * 3. Otherwise, in ONE transaction:
 *    a. Claim the invite with a single conditional update — matching tokenHash, still
 *       unused, not expired — and require that exactly 1 row changed. 0 rows →
 *       throw InvalidInviteError (the transaction rolls back, nothing is written).
 *    b. Create the Tenant (name = companyName; planTier and minutesBalance come from
 *       the schema defaults) and its User (id = authUserId, role ADMIN).
 *    c. Record which tenant used the invite (Invite.usedByTenantId).
 *    If any step fails, none of them may remain — including the claim on the invite.
 */
export async function onboardTenant(
  input: OnboardTenantInput,
): Promise<OnboardTenantResult> {
  const parsedInput = onboardTenantInputSchema.parse(input);
  const now = new Date();
  const hashedToken = hashInviteToken(parsedInput.inviteToken);
  const user = await prisma.user.findUnique({
    where: {
      id: parsedInput.authUserId,
    },
  });
  if (user) {
    return { created: false, tenantId: user.tenantId, userId: user.id };
  }
  try {
    const result = await prisma.$transaction(
      async (tx): Promise<OnboardTenantResult> => {
        const rowsUpdated = await tx.invite.updateMany({
          where: {
            tokenHash: hashedToken,
            expiresAt: { gt: now },
            usedAt: null,
          },
          data: {
            usedAt: now,
          },
        });
        if (rowsUpdated.count === 0) {
          throw new InvalidInviteError();
        }
        const tenant = await tx.tenant.create({
          data: {
            name: parsedInput.companyName,
          },
        });
        const newUser = await tx.user.create({
          data: {
            id: parsedInput.authUserId,
            email: parsedInput.email,
            role: "ADMIN",
            tenantId: tenant.id,
          },
        });
        await tx.invite.update({
          where: {
            tokenHash: hashedToken,
          },
          data: {
            usedByTenantId: tenant.id,
          },
        });
        return { tenantId: tenant.id, userId: newUser.id, created: true };
      },
    );
    return result;
  } catch (error) {
    if (error instanceof InvalidInviteError) {
      const user = await prisma.user.findUnique({
        where: {
          id: parsedInput.authUserId,
        },
      });
      if (user) {
        return { created: false, tenantId: user.tenantId, userId: user.id };
      }
    }
    throw error;
  }
}
