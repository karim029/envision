// Pure env parsing: no side effects, safe to import from unit tests.
// The app imports `env` from "@/env" (server) and `publicEnv` from "@/env.public" instead.
import { z } from "zod";

const postgresUrl = z.url({ protocol: /^postgres(ql)?$/ });

export const serverEnvSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  // Runtime connection (Supabase: transaction pooler, port 6543).
  // DIRECT_URL is NOT here: only the Prisma CLI reads it (prisma.config.ts).
  DATABASE_URL: postgresUrl,
});

// Values the BROWSER also needs. Not secrets: Supabase's publishable key is meant to ship to
// browsers (data is protected by RLS + the disabled Data API, not by hiding this key).
export const publicEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.url({ protocol: /^https?$/ }),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;
export type PublicEnv = z.infer<typeof publicEnvSchema>;

type RawEnv = Record<string, string | undefined>;

// One error listing every bad key as "key: message" — never the value (values may be secrets).
function parseWith<T extends z.ZodType>(schema: T, raw: RawEnv): z.infer<T> {
  const result = schema.safeParse(raw);
  if (result.success) {
    return result.data;
  }
  const formattedErrors = result.error.issues
    .map((iss) => {
      return `${iss.path.join(".")}: ${iss.message}`;
    })
    .join("\n");
  throw new Error(`Invalid environment variables:\n${formattedErrors}`);
}

export function parseEnv(raw: RawEnv): ServerEnv {
  return parseWith(serverEnvSchema, raw);
}

export function parsePublicEnv(raw: RawEnv): PublicEnv {
  return parseWith(publicEnvSchema, raw);
}
