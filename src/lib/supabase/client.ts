// Supabase client for BROWSER code ("use client" components).
// Only for things that must happen in the page; every auth DECISION happens on the
// server (requireAuthContext), never based on what this client says.
import { createBrowserClient } from "@supabase/ssr";
import { publicEnv } from "@/env.public";

export function createSupabaseBrowserClient() {
  return createBrowserClient(
    publicEnv.NEXT_PUBLIC_SUPABASE_URL,
    publicEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );
}
