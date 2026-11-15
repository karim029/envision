import { z } from "zod";

export const serverEnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

export function parseEnv(raw: Record<string, string | undefined>): ServerEnv {
    const result = serverEnvSchema.safeParse(raw)
    if(result.success){
        return result.data
    }
    const formattedErrors = result.error.issues.map((iss)=>{
       return `${iss.path.join('.')}: ${iss.message}`
    }).join('\n')
    throw new Error(`Invalid environment variables:\n${formattedErrors}`)
}

export const env = parseEnv(process.env);
