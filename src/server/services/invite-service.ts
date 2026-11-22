// Single-use signup invites.
// - createInvite: OWNER-only. Called by `npm run invite:create` (scripts/create-invite.ts)
//   today, and by a future owner admin page — never by tenants.
// - checkInvite: PUBLIC (the signup page), read-only. Never reveals the invite's label.
// - claimInvite / recordInviteTenant: used by onboardTenant INSIDE its transaction — the
//   caller passes its transaction client (tx) in, so the claim rolls back with everything else.
import { z } from "zod";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/server/db/client";
import { generateInviteToken, hashInviteToken } from "./invite-token";

export const createInviteInputSchema = z.object({
  /** Who the invite is for, e.g. "Sara, People Ops @ Acme". */
  label: z.string().trim().min(1).max(200),
  expiresInDays: z.number().int().min(1).max(90).default(14),
});

export type CreateInviteInput = z.input<typeof createInviteInputSchema>;

export interface CreatedInvite {
  inviteId: string;
  /** The raw token for the signup link. Shown ONCE — only its hash is stored. */
  token: string;
  expiresAt: Date;
}
const DAY_MS = 24 * 60 * 60 * 1000;

/** Unknown, already used, or expired invite. One error for all three on purpose. */
export class InvalidInviteError extends Error {
  constructor() {
    super("This invite link is invalid, already used, or expired");
    this.name = "InvalidInviteError";
  }
}

/**
 * Rules (see tests/integration/invite-service.test.ts):
 * 1. Validate input with createInviteInputSchema.
 * 2. Generate a token, store ONLY hashInviteToken(token) plus label and expiresAt
 *    (now + expiresInDays).
 * 3. Return the raw token so the caller can build the link.
 */
export async function createInvite(
  input: CreateInviteInput,
): Promise<CreatedInvite> {
  const parsedInput = createInviteInputSchema.parse(input);
  const token = generateInviteToken();
  const invite = await prisma.invite.create({
    data: {
      label: parsedInput.label,
      tokenHash: hashInviteToken(token),
      expiresAt: new Date(Date.now() + parsedInput.expiresInDays * DAY_MS),
    },
  });
  const inviteInput: CreatedInvite = {
    inviteId: invite.id,
    token: token,
    expiresAt: invite.expiresAt,
  };
  return inviteInput;
}

export type InviteCheckFailure = "not_found" | "used" | "expired";

export type InviteCheck =
  { usable: true } | { usable: false; reason: InviteCheckFailure };

/**
 * Pre-check for the signup page: can this invite link still be used?
 * A COURTESY for a friendly message only — the atomic claim in onboardTenant is the
 * real guarantee (the invite can change between this check and that claim).
 *
 * Rules (see tests/integration/invite-service.test.ts):
 * 1. Hash the raw token; look the invite up by its hash.
 * 2. No invite → not_found. Already used → used (checked BEFORE expiry: "log in instead"
 *    is the more useful message). Past expiresAt → expired. Otherwise usable.
 * 3. Read-only: never writes anything.
 */
// ─── Invite usability rules ─────────────────────────────────────────────────────────────
// "Usable" = exists, unused (usedAt is null), and not expired (expiresAt > now).
// It is written twice on purpose, in two forms that MUST MATCH:
//   - checkInvite:  plain JavaScript checks, so it can say WHICH rule failed (read-only).
//   - claimInvite:  a database filter, so the check-and-mark-used is ONE atomic statement.
// Change one → change the other. (Boundary: expired means expiresAt <= now in both.)

export async function checkInvite(token: string): Promise<InviteCheck> {
  const hashedToken = hashInviteToken(token);
  const invite = await prisma.invite.findUnique({
    where: {
      tokenHash: hashedToken,
    },
  });
  if (!invite) {
    return { usable: false, reason: "not_found" };
  }
  if (invite.usedAt !== null) {
    return { usable: false, reason: "used" };
  }
  if (invite.expiresAt <= new Date()) {
    return { usable: false, reason: "expired" };
  }
  return { usable: true };
}

/**
 * Atomically claims a usable invite inside the caller's transaction (moved from onboardTenant).
 * Throws InvalidInviteError if it is unknown, used, or expired.
 * updateManyAndReturn = the same single conditional UPDATE as updateMany (race-safe), but it
 * returns the updated rows, so we get the invite's id without a second query.
 */
export async function claimInvite(
  tx: Prisma.TransactionClient,
  token: string,
  now: Date,
): Promise<{ inviteId: string }> {
  const claimed = await tx.invite.updateManyAndReturn({
    where: {
      tokenHash: hashInviteToken(token),
      expiresAt: { gt: now },
      usedAt: null,
    },
    data: {
      usedAt: now,
    },
    select: { id: true },
  });
  if (claimed.length === 0) {
    throw new InvalidInviteError();
  }
  return { inviteId: claimed[0].id };
}

/** Records which tenant used the invite, once that tenant exists (moved from onboardTenant). */
export async function recordInviteTenant(
  tx: Prisma.TransactionClient,
  inviteId: string,
  tenantId: string,
): Promise<void> {
  await tx.invite.update({
    where: { id: inviteId },
    data: { usedByTenantId: tenantId },
  });
}
