// ADAPTER: translates Supabase's signInWithPassword response into our own LogInResult, so the
// login page never sees Supabase error codes. Same idea as sign-up-adapter.ts.

/** Our own language for "how did the login go?" — one message per status on the page. */
export type LogInResult =
  | { status: "logged_in" }
  /** Unknown email OR wrong password — deliberately ONE status (no account enumeration). */
  | { status: "invalid_credentials" }
  /** Right password, but she never clicked the confirmation email. */
  | { status: "email_not_confirmed" }
  | { status: "rate_limited" }
  /** Anything else (provider down, banned user…). */
  | { status: "failed" };

/** Just the part of Supabase's signInWithPassword response we read. */
export interface SupabaseLogInResponse {
  error: { code?: string | null } | null;
}

/**
 * Rules (see tests/unit/log-in-adapter.test.ts):
 * - No error → logged_in.
 * - Error code "invalid_credentials" → invalid_credentials.
 * - Error code "email_address_invalid" → invalid_credentials
 * - Error code "email_not_confirmed" → email_not_confirmed.
 * - Error code "over_request_rate_limit" → rate_limited.
 * - Any other error, or an error without a code → failed.
 * - Must include exact match for the code not includes some words of it  
 */
export function toLogInResult(response: SupabaseLogInResponse): LogInResult {
  if (!response.error) {
    return {
      status: "logged_in",
    };
  }
  switch (response.error.code) {
    case "invalid_credentials":
    case "email_address_invalid":
      return {
        status: "invalid_credentials",
      };
    case "email_not_confirmed":
      return {
        status: "email_not_confirmed",
      };
    case "over_request_rate_limit":
      return {
        status: "rate_limited",
      };
    default:
      return {
        status: "failed",
      };
  }
}
