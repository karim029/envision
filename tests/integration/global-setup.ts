// Runs once before the integration suite: makes sure the test database exists and
// applies the committed migrations to it (the same command deploy.yml will run on Supabase).
import { execSync } from "node:child_process";
import { Client } from "pg";

export default async function setup() {
  const url = process.env.TEST_DATABASE_URL;
  if (!url) {
    throw new Error("TEST_DATABASE_URL is not set (see .env.example).");
  }

  // Safety guard: tests TRUNCATE every table. Never let them near a real database.
  const dbName = new URL(url).pathname.slice(1);
  if (!/^[a-z0-9_]+_test$/.test(dbName)) {
    throw new Error(
      `Refusing to run integration tests against "${dbName}": the database name must end in "_test".`,
    );
  }

  // Create the test database on first run (connect to the default "postgres" DB to do it).
  const adminUrl = new URL(url);
  adminUrl.pathname = "/postgres";
  const admin = new Client({ connectionString: adminUrl.toString() });
  await admin.connect();
  try {
    const { rowCount } = await admin.query(
      "SELECT 1 FROM pg_database WHERE datname = $1",
      [dbName],
    );
    if (rowCount === 0) {
      await admin.query(`CREATE DATABASE "${dbName}"`);
    }
  } finally {
    await admin.end();
  }

  // prisma.config.ts reads DIRECT_URL; point it at the test database for this command only.
  execSync("npx prisma migrate deploy", {
    stdio: "inherit",
    env: { ...process.env, DIRECT_URL: url },
  });
}
