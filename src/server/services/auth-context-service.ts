// "Who is this authenticated person in OUR system?" — the testable core of requireAuthContext().
// Takes an already-VERIFIED Supabase user id; knows nothing about cookies or redirects.
import { z } from "zod";
import { prisma } from "@/server/db/client";
import type { UserRole } from "@/generated/prisma/client";

/** What every protected page/action gets. The ONLY source of tenantId. */
export interface AuthContext {
  userId: string;
  tenantId: string;
  role: UserRole;
}

export type AuthContextResult =
  | { status: "ok"; context: AuthContext }
  /** Logged in with Supabase, but no User row yet → send to /onboarding. */
  | { status: "needs_onboarding" };

/**
 * Rules (see tests/integration/auth-context-service.test.ts):
 * 1. authUserId must be a UUID (z.uuid().parse) — anything else is a bug, so throw.
 * 2. Find the User whose id = authUserId.
 * 3. No User → { status: "needs_onboarding" }.
 * 4. Otherwise → { status: "ok", context: { userId, tenantId, role } } — exactly these three
 *    fields, read from the database (never from the token: users can edit their metadata).
 */
export async function getAuthContext(
  authUserId: string,
): Promise<AuthContextResult> {
  const validUserId = z.uuid().parse(authUserId);
  const dbUser = await prisma.user.findUnique({
    select: {
      id: true,
      role: true,
      tenantId: true,
    },
    where: {
      id: validUserId,
    },
  });
  if (!dbUser) {
    return { status: "needs_onboarding" };
  }
  const userContext: AuthContext = {
    userId: dbUser.id,
    tenantId: dbUser.tenantId,
    role: dbUser.role,
  };
  return { status: "ok", context: userContext };
}
