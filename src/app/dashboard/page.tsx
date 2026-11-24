import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { logOutAction } from "@/app/auth/actions";
import { Suspense } from "react";
import { requireAuthContext } from "@/server/auth/require-auth-context";
import { getAccountSummary } from "@/server/services/account-service";

/**
 * Protected dashboard, in three layers:
 * - DashboardPage: synchronous static shell (prerendered); the fallback ships in it.
 * - AccountHeader: async, inside <Suspense>; the auth check + tenant-scoped read, per request.
 * - AccountHeaderView: visual only (props in, markup out).
 */
export default function DashboardPage() {
  return (
    <main className="mx-auto flex min-h-svh w-full max-w-3xl flex-col gap-6 p-4 sm:p-8">
      <Suspense fallback={<p>Loading...</p>}>
        <AccountHeader></AccountHeader>
      </Suspense>
    </main>
  );
}

async function AccountHeader() {
  const authContext = await requireAuthContext();
  const summary = await getAccountSummary({
    userId: authContext.userId,
    tenantId: authContext.tenantId,
  });
  return <AccountHeaderView summary={summary}></AccountHeaderView>;
}

/** Visual only: what the header looks like once we know who you are. */
function AccountHeaderView({
  summary,
}: {
  summary: { tenantName: string; email: string };
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div className="grid gap-1">
          <CardTitle>Welcome to {summary.tenantName}</CardTitle>
          <CardDescription>Signed in as {summary.email}</CardDescription>
        </div>
        <form action={logOutAction}>
          <Button type="submit" variant="outline" size="sm">
            Log out
          </Button>
        </form>
      </CardHeader>
    </Card>
  );
}
