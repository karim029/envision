"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseSignUp } from "@/lib/supabase/sign-up-adapter";
import {
  signUpWithInvite,
  type SignUpOutcome,
} from "@/server/services/signup-service";

/** null = the form hasn't been submitted yet. */
export type SignUpState = SignUpOutcome | null;

/**
 * Thin glue between the signup form and signUpWithInvite (no rules here — the service has them):
 * 1. Read email, password, companyName, inviteToken from formData.
 * 2. Create the Supabase server client.
 * 3. Call signUpWithInvite(fields, { signUp: createSupabaseSignUp(supabase) }).
 * 4. Return the outcome.
 */
export async function signUpAction(
  prevState: SignUpState,
  formData: FormData,
): Promise<SignUpState> {
  const email = formData.get("email");
  const password = formData.get("password");
  const companyName = formData.get("companyName");
  const inviteToken = formData.get("inviteToken");

  const supabase = await createSupabaseServerClient();
  const outcome = await signUpWithInvite(
    { email, password, companyName, inviteToken },
    {
      signUp: createSupabaseSignUp(supabase),
    },
  );
  return outcome;
}
