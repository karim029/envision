// Validated public env — safe to import from browser code.
// Each NEXT_PUBLIC_ variable must be written out in full (process.env.NEXT_PUBLIC_X):
// Next.js replaces those exact expressions with their values at build time. In the
// browser `process.env` is otherwise empty, so passing the whole object would fail.
import { parsePublicEnv } from "./env.schema";

export type { PublicEnv } from "./env.schema";

export const publicEnv = parsePublicEnv({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
});
