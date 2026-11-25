// What Sara reads for each signup outcome. Shared by the page (invite checked on load) and the
// form (outcome after submit), so each sentence lives in one place.
import type { InviteCheckFailure } from "@/server/services/invite-service";
import type { SignUpOutcome } from "@/server/services/signup-service";

export const MISSING_INVITE_MESSAGE =
  "You need an invite link to sign up. Ask the person who invited you for one.";

export const CHECK_EMAIL_MESSAGE =
  "Check your email, we sent you a link to confirm your account.";

export const INVITE_PROBLEM_MESSAGES: Record<InviteCheckFailure, string> = {
  not_found:
    "This invite link isn't valid. Make sure that you copied the whole link.",
  used: "This invite link has already been used. Ask for a new one.",
  expired:
    "This invite link has expired. Ask the person who invited you for a new one.",
};

/** The error to show above the form, or null when there is none (success / field errors). */
export function signUpErrorMessage(outcome: SignUpOutcome): string | null {
  switch (outcome.status) {
    case "invite_unusable":
      return INVITE_PROBLEM_MESSAGES[outcome.reason];
    case "email_taken":
      return "An account with this email already exists. Log in instead.";
    case "rate_limited":
      return "Too many attempts. Please wait a few minutes and try again.";
    case "failed":
      return "Something went wrong. Please try again.";
    case "invite_claimed_meanwhile":
      return "This invite was just used by someone else, so your setup didn't finish. Contact the person who invited you and they'll sort it out.";
    case "check_email":
    case "invalid_input":
      return null;
  }
}
