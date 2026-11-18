// Next.js 16 Proxy (formerly "middleware"): runs before matched requests.
// Keeps Supabase sessions fresh; authorization happens in requireAuthContext().
import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  // Everything except Next.js internals, static files and the health check
  // (the keep-alive ping has no session, so refreshing there is wasted work).
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/health|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
