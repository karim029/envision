// Supabase client for SERVER code: Server Components, Server Actions, Route Handlers.
// Reads/writes the session through Next.js cookies. Create a new one per request —
// never share one across requests (it would mix up different users' sessions).
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { publicEnv } from "@/env.public";

export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(
    publicEnv.NEXT_PUBLIC_SUPABASE_URL,
    publicEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Server Components may not set cookies (only Server Actions and Route
            // Handlers can). Safe to ignore: src/proxy.ts refreshes the session and
            // writes the cookies before the page renders.
          }
        },
      },
    },
  );
}
