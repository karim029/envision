// Runs inside every integration test file.
import { afterAll, beforeEach } from "vitest";
import { prisma } from "@/server/db/client";

// Clean slate: empty every app table before each test, so no test depends on another's data.
// Table names come from the catalog, so new tables are included automatically.
beforeEach(async () => {
  const tables = await prisma.$queryRaw<{ tablename: string }[]>`
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public' AND tablename <> '_prisma_migrations'
  `;
  if (tables.length > 0) {
    const list = tables.map((t) => `"${t.tablename}"`).join(", ");
    await prisma.$executeRawUnsafe(`TRUNCATE ${list} CASCADE`);
  }
});

afterAll(async () => {
  await prisma.$disconnect();
});
