// Creates a new tenant and its first ADMIN user for a freshly signed-up Supabase auth user,
// consuming a single-use invite. Called by the signup flow in Slice 1d — never from the browser.
import { z } from "zod";
import { prisma } from "@/server/db/client";
import {
  claimInvite,
  InvalidInviteError,
  recordInviteTenant,
} from "./invite-service";

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

/**
 * Rules (see tests/integration/onboarding.test.ts):
 * 1. Validate input with onboardTenantInputSchema.
 * 2. Already onboarded (a User with id = authUserId exists) → return its tenant,
 *    created: false. This must happen BEFORE touching the invite: on a retry the
 *    invite is already used.
 * 3. Otherwise, in ONE transaction:
 *    a. claimInvite(tx, …) — the invite service's atomic claim; throws InvalidInviteError
 *       if the invite is unknown, used, or expired (the transaction rolls back).
 *    b. Create the Tenant (name = companyName; planTier and minutesBalance come from
 *       the schema defaults) and its User (id = authUserId, role ADMIN).
 *    c. recordInviteTenant(tx, …) — record which tenant used the invite.
 *    If any step fails, none of them may remain — including the claim on the invite.
 */
export async function onboardTenant(
  input: OnboardTenantInput,
): Promise<OnboardTenantResult> {
  const parsedInput = onboardTenantInputSchema.parse(input);
  const now = new Date();
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
        // tx is passed in so the claim rolls back if anything below fails.
        const { inviteId } = await claimInvite(
          tx,
          parsedInput.inviteToken,
          now,
        );
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
        await recordInviteTenant(tx, inviteId, tenant.id);
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
