// Owner-only: creates single-use signup invites. Called by `npm run invite:create`
// (scripts/create-invite.ts) today, and by a future owner admin page — never by tenants.
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
  void input;
  void prisma;
  void generateInviteToken;
  void hashInviteToken;
  throw new Error("TODO: implement");
}
