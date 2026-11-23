// Signup with an invite link: the LOGIC of the signup flow, unaware of Supabase.
// The auth provider's signUp is INJECTED (functional DI) as `deps.signUp`, speaking our own
// small SignUpAuthResult language. The Supabase-specific translation lives in
// src/lib/supabase/sign-up-adapter.ts — swap providers by writing a new adapter.
import { z } from "zod";
import {
  checkInvite,
  InvalidInviteError,
  type InviteCheckFailure,
} from "./invite-service";
import { onboardTenant } from "./onboarding-service";

// ─── What the injected auth provider must answer ────────────────────────────────────────
export type SignUpAuthResult =
  | { status: "created"; authUserId: string }
  | { status: "email_taken" }
  | { status: "rate_limited" }
  /** Anything else the provider rejected (weak password by its rules, provider down…). */
  | { status: "failed" };

export type SignUpFn = (
  email: string,
  password: string,
) => Promise<SignUpAuthResult>;

export interface SignUpDeps {
  signUp: SignUpFn;
}

// ─── Input (untrusted: straight from the form) ──────────────────────────────────────────
export const signUpInputSchema = z.object({
  email: z.email().transform((e) => e.toLowerCase()),
  // 72 = the bcrypt limit Supabase hashes passwords with; longer is silently truncated.
  password: z.string().min(8).max(72),
  companyName: z.string().trim().min(1).max(100),
  inviteToken: z.string(),
});

export type SignUpField = keyof z.input<typeof signUpInputSchema>;

// ─── What the signup page shows (one message per outcome) ───────────────────────────────
export type SignUpOutcome =
  /** Account created + tenant onboarded → "Check your email to confirm your account". */
  | { status: "check_email" }
  | {
      status: "invalid_input";
      /** Messages per field, e.g. { password: ["Too small: …"] }. */
      fieldErrors: Partial<Record<SignUpField, string[]>>;
    }
  /** The pre-check failed — no account was created. */
  | { status: "invite_unusable"; reason: InviteCheckFailure }
  | { status: "email_taken" }
  | { status: "rate_limited" }
  | { status: "failed" }
  /** The account WAS created, but someone claimed the invite in between →
   *  "This invite was just used — ask for a new link; you'll be asked for it after
   *  confirming your email." (/onboarding handles the rest.) */
  | { status: "invite_claimed_meanwhile" };

/**
 * Rules (see tests/integration/signup-service.test.ts):
 * 1. Validate `input` with signUpInputSchema (safeParse). Invalid → invalid_input with
 *    z.flattenError(error).fieldErrors. Nothing else runs.
 * 2. Pre-check the invite (checkInvite). Not usable → invite_unusable with its reason.
 *    signUp is NOT called, so no account is created for a bad link.
 * 3. deps.signUp(email, password) with the VALIDATED values. email_taken / rate_limited /
 *    failed → return that same status. Nothing is onboarded.
 * 4. created → onboardTenant({ authUserId, email, companyName, inviteToken }).
 *    - InvalidInviteError (the invite was claimed between steps 2 and 4)
 *      → invite_claimed_meanwhile.
 *    - Any OTHER error is a real problem: let it propagate unchanged.
 * 5. Success → check_email.
 */
export async function signUpWithInvite(
  input: unknown,
  deps: SignUpDeps,
): Promise<SignUpOutcome> {
  const parsedResult = signUpInputSchema.safeParse(input);
  if (parsedResult.error) {
    return {
      status: "invalid_input",
      fieldErrors: z.flattenError(parsedResult.error).fieldErrors,
    };
  }
  const inviteCheckResult = await checkInvite(parsedResult.data.inviteToken);
  if (inviteCheckResult.usable === false) {
    return { status: "invite_unusable", reason: inviteCheckResult.reason };
  }
  const signUpResult = await deps.signUp(
    parsedResult.data.email,
    parsedResult.data.password,
  );
  if (signUpResult.status !== "created") {
    return { status: signUpResult.status };
  }

  try {
    await onboardTenant({
      authUserId: signUpResult.authUserId,
      companyName: parsedResult.data.companyName,
      email: parsedResult.data.email,
      inviteToken: parsedResult.data.inviteToken,
    });
  } catch (error) {
    if (error instanceof InvalidInviteError) {
      return { status: "invite_claimed_meanwhile" };
    }
    throw error;
  }
  return { status: "check_email" };
}
