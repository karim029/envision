// Session refresh, called from src/proxy.ts before every matched request.
// Its only job: if the access token is expiring, use the refresh token to get a new one
// and write the new cookies onto BOTH the request (so this render sees them) and the
// response (so the browser stores them). It does NOT decide who may see what —
// that is requireAuthContext(), on the server, per page/action.
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { publicEnv } from "@/env.public";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    publicEnv.NEXT_PUBLIC_SUPABASE_URL,
    publicEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
          // Cache-control headers from Supabase: stop a CDN from caching a response
          // that carries one user's fresh session cookies and serving it to others.
          for (const [key, value] of Object.entries(headers)) {
            response.headers.set(key, value);
          }
        },
      },
    },
  );

  // Verifies the token and triggers the refresh if needed. Don't put any code between
  // creating the client and this call — the refresh must happen first.
  await supabase.auth.getClaims();

  return response;
}
