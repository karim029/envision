"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { toLogInResult, type LogInResult } from "@/lib/supabase/log-in-adapter";

/**
 * What the login form can show. null = not submitted yet.
 * Never "logged_in": on success the action redirects instead of returning.
 */
export type LogInState = Exclude<LogInResult, { status: "logged_in" }> | null;

/**
 * 1. Read email + password from formData.
 *    signInWithPassword wants strings: String(formData.get("email") ?? "").
 * 2. Create the Supabase server client.
 * 3. supabase.auth.signInWithPassword({ email, password }).
 * 4. toLogInResult(response).
 * 5. logged_in → redirect("/dashboard"). Otherwise → return the result.
 */
export async function logInAction(
  prevState: LogInState,
  formData: FormData,
): Promise<LogInState> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  const supabase = await createSupabaseServerClient();
  const loginResponse = await supabase.auth.signInWithPassword({
    email: email,
    password: password,
  });
  const result = toLogInResult(loginResponse);
  if (result.status === "logged_in") {
    redirect("/dashboard");
  }
  return result;
}
