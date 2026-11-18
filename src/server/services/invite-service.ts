// Single-use signup invites.
// - createInvite: OWNER-only. Called by `npm run invite:create` (scripts/create-invite.ts)
//   today, and by a future owner admin page — never by tenants.
// - checkInvite: PUBLIC (the signup page), read-only. Never reveals the invite's label.
import { z } from "zod";
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
export async function checkInvite(token: string): Promise<InviteCheck> {
  void token;
  throw new Error("TODO: implement");
}
