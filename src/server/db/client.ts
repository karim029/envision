// Prisma client singleton. Only src/server/services/* should import this —
// never pages, Server Actions or Route Handlers (CLAUDE.md, Critical Rule 1).
import { PrismaPg } from "@prisma/adapter-pg";
import { env } from "@/env";
import { PrismaClient } from "@/generated/prisma/client";

function createPrismaClient() {
  // Prisma 7 talks to Postgres through a driver adapter (node-postgres here).
  const adapter = new PrismaPg({ connectionString: env.DATABASE_URL });
  return new PrismaClient({ adapter });
}

// `next dev` hot-reloads modules; without this cache every reload would open a
// new connection pool and eventually exhaust Postgres connections.
const globalForPrisma = globalThis as unknown as {
  prisma?: ReturnType<typeof createPrismaClient>;
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
