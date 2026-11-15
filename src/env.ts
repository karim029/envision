// Validated server env. Importing this file validates process.env and throws on
// bad config (fail fast). next.config.ts imports it so a bad env fails `next build`.
import { parseEnv } from "./env.schema";

export type { ServerEnv } from "./env.schema";

export const env = parseEnv(process.env);
