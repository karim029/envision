// The first line of every protected page and Server Action:
//   const { tenantId, userId, role } = await requireAuthContext();
// Never returns without a valid context: it redirects instead (Next.js redirect() throws),
// so callers can't forget to handle the "not logged in" case.
import "server-only"; // build error if this is ever imported into browser code
import type { AuthContext } from "@/server/services/auth-context-service";

/**
 * Steps (thin glue — the decisions live in getAuthContext, which is tested):
 * 1. Create the SERVER Supabase client (createSupabaseServerClient, src/lib/supabase/server.ts).
 * 2. supabase.auth.getClaims() — verifies the token's signature. The user id is claims.sub.
 *    No claims (or an error) → redirect("/login").
 * 3. getAuthContext(claims.sub):
 *      "needs_onboarding" → redirect("/onboarding")
 *      "ok"               → return the context
 * redirect comes from "next/navigation".
 */
export async function requireAuthContext(): Promise<AuthContext> {
  throw new Error("TODO: implement");
}
