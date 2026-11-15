// Owner-only CLI: creates a single-use signup invite and prints the link.
//
//   npm run invite:create -- "Sara, People Ops @ Acme"            (local dev DB)
//   npm run invite:create -- "Sara, People Ops @ Acme" --days=7
//
// Production (Supabase): set DATABASE_URL and APP_URL for this one command, and pass --yes:
//   $env:DATABASE_URL="<supabase pooler url>"; $env:APP_URL="https://<your-app>.vercel.app"
//   npm run invite:create -- "Sara, People Ops @ Acme" --yes
//   Remove-Item Env:DATABASE_URL, Env:APP_URL
import "dotenv/config"; // must stay first: loads .env before src/env.ts validates it
import { env } from "@/env";
import { prisma } from "@/server/db/client";
import { createInvite } from "@/server/services/invite-service";

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);

async function main() {
  const args = process.argv.slice(2);
  const confirmed = args.includes("--yes");
  const daysArg = args.find((a) => a.startsWith("--days="));
  const label = args
    .filter((a) => !a.startsWith("--"))
    .join(" ")
    .trim();

  if (!label) {
    console.error(
      'Usage: npm run invite:create -- "<who it is for>" [--days=14] [--yes]',
    );
    process.exitCode = 1;
    return;
  }

  // Safety: say where we're writing, and refuse a non-local database without --yes.
  const dbHost = new URL(env.DATABASE_URL).hostname;
  console.log(`Target database host: ${dbHost}`);
  if (!LOCAL_HOSTS.has(dbHost) && !confirmed) {
    console.error(
      "This is NOT a local database. Re-run with --yes to create a real invite.",
    );
    process.exitCode = 1;
    return;
  }

  const appUrl = (process.env.APP_URL ?? "http://localhost:3000").replace(
    /\/+$/,
    "",
  );
  const { token, expiresAt } = await createInvite({
    label,
    expiresInDays: daysArg ? Number(daysArg.split("=")[1]) : undefined,
  });

  const link = `${appUrl}/signup?invite=${encodeURIComponent(token)}`;
  console.log(`\nInvite for: ${label}`);
  console.log(`Expires:    ${expiresAt.toISOString()}`);
  console.log(`Link (shown once — only its hash is stored):\n\n  ${link}\n`);
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
