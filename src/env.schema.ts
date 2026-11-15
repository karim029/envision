// Pure env parsing: no side effects, safe to import from unit tests.
// The app imports `env` from "@/env" instead.
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

export type ServerEnv = z.infer<typeof serverEnvSchema>;

export function parseEnv(raw: Record<string, string | undefined>): ServerEnv {
  const result = serverEnvSchema.safeParse(raw);
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
