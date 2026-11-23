// ADAPTER: translates Supabase's signUp response into our own SignUpAuthResult, so the
// signup logic (signup-service.ts) never sees Supabase types or quirks. Swapping auth
// providers = writing a new adapter; the service and its tests stay untouched.
import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  SignUpAuthResult,
  SignUpFn,
} from "@/server/services/signup-service";

/** Just the parts of Supabase's signUp response we read (keeps the mapper easy to test). */
export interface SupabaseSignUpResponse {
  data: { user: { id: string; identities?: unknown[] | null } | null };
  error: { code?: string | null } | null;
}

const EMAIL_TAKEN_CODES = new Set(["user_already_exists", "email_exists"]);
const RATE_LIMIT_CODES = new Set([
  "over_email_send_rate_limit",
  "over_request_rate_limit",
]);

export function toSignUpAuthResult(
  response: SupabaseSignUpResponse,
): SignUpAuthResult {
  const { data, error } = response;

  if (error) {
    const code = error.code ?? "";
    if (EMAIL_TAKEN_CODES.has(code)) return { status: "email_taken" };
    if (RATE_LIMIT_CODES.has(code)) return { status: "rate_limited" };
    return { status: "failed" };
  }

  if (!data.user) {
    return { status: "failed" };
  }

  // Supabase quirk: with "Confirm email" on, signing up an ALREADY-registered email
  // returns no error but an obfuscated FAKE user with an empty identities list (so
  // attackers can't learn who has an account). Its id belongs to nobody.
  if (
    Array.isArray(data.user.identities) &&
    data.user.identities.length === 0
  ) {
    return { status: "email_taken" };
  }

  return { status: "created", authUserId: data.user.id };
}

/** The real SignUpFn for production: the Server Action passes this to signUpWithInvite. */
export function createSupabaseSignUp(supabase: SupabaseClient): SignUpFn {
  return async (email, password) => {
    const response = await supabase.auth.signUp({ email, password });
    return toSignUpAuthResult(response);
  };
}
