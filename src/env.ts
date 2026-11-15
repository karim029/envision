import { z } from "zod";

export const serverEnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

export function parseEnv(raw: Record<string, string | undefined>): ServerEnv {
  throw new Error("TODO: implement");
}

export const env = parseEnv(process.env);
