import { describe, expect, it } from "vitest";
import { prisma } from "@/server/db/client";

/**
 * Names of tables in the `public` schema that have Row Level Security DISABLED,
 * excluding Prisma's own `_prisma_migrations` table.
 *
 * Hint: Postgres lists tables in the `pg_tables` view
 * (columns: schemaname, tablename, rowsecurity).
 * Use prisma.$queryRaw with a tagged template (not $queryRawUnsafe).
 */
async function tablesWithoutRls(): Promise<string[]> {
  const rows = await prisma.$queryRaw<{ tablename: string }[]>`
    SELECT tablename FROM pg_tables WHERE schemaname = 'public'
    AND rowsecurity = false AND tablename != '_prisma_migrations'
  `;
  return rows.map((row) => row.tablename);
}

describe("row level security", () => {
  it("is enabled on every app table", async () => {
    expect(await tablesWithoutRls()).toEqual([]);
  });

  // Tests the test: a query that always returns [] would pass the test above forever.
  it("detects a table that has RLS disabled", async () => {
    await prisma.$executeRawUnsafe(`CREATE TABLE "RlsProbe" (id int)`);
    try {
      expect(await tablesWithoutRls()).toContain("RlsProbe");
    } finally {
      await prisma.$executeRawUnsafe(`DROP TABLE "RlsProbe"`);
    }
  });
});
