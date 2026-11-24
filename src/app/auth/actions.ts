"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

/**
 * Logout. Called by a <form action={logOutAction}> (a POST — never a GET link).
 * No requireAuthContext(): it reads/changes no tenant data, and logging out a
 * logged-out person is harmless.
 *
 * 1. Create the Supabase SERVER client (it can write cookies here: this is an action).
 * 2. signOut with scope "local" — the cookies are removed FIRST, then the refresh token
 *    is revoked best-effort. Decided: Sara logs out of this browser only.
 * 3. An error from signOut is ignored on purpose: with "local" the cookies are already gone,
 *    so she is signed out in this browser either way; only the server-side revoke failed.
 *    Revisit when the logger arrives (Chunk 6).
 */
export async function logOutAction(): Promise<void> {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut({ scope: "local" });
  redirect("/login");
}
