// Prisma CLI config (migrate, generate, studio). The app itself never reads this file.
// Prisma 7 does not load .env automatically, so dotenv does it here.
import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // Migrations need a direct Postgres connection (port 5432 on Supabase), not the
    // transaction pooler. process.env (not Prisma's env() helper) so `prisma generate`
    // still works in CI/Vercel where DIRECT_URL is not set.
    url: process.env.DIRECT_URL,
  },
});
