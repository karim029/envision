import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { checkInvite } from "@/server/services/invite-service";
import { INVITE_PROBLEM_MESSAGES, MISSING_INVITE_MESSAGE } from "./messages";
import { SignupForm } from "./signup-form";
import { Suspense } from "react";

export default function SignupPage({ searchParams }: PageProps<"/signup">) {
  return (
    <main className="flex min-h-svh items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Create your account</CardTitle>
          <CardDescription>Set up your company on Envision.</CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<p>Checking your invite...</p>}>
            <InviteGate searchParams={searchParams} />
          </Suspense>
        </CardContent>
      </Card>
    </main>
  );
}

/**
 * fail fast: check the invite when the page loads; show the form only if usable.
 * 1. Get `invite` out of searchParams.
 * 2. Missing, empty, or not a string → <InviteProblem message={MISSING_INVITE_MESSAGE} />
 *    (no DB call — nothing to check).
 * 3. checkInvite(invite) → not usable → <InviteProblem message={INVITE_PROBLEM_MESSAGES[…]} />
 * 4. Usable → <SignupForm inviteToken={invite} />
 */
async function InviteGate({
  searchParams,
}: Pick<PageProps<"/signup">, "searchParams">) {
  const { invite } = await searchParams;
  if (typeof invite !== "string" || invite === "") {
    return <InviteProblem message={MISSING_INVITE_MESSAGE}></InviteProblem>;
  }
  const inviteStatus = await checkInvite(invite);
  if (inviteStatus.usable === false) {
    return (
      <InviteProblem
        message={INVITE_PROBLEM_MESSAGES[inviteStatus.reason]}
      ></InviteProblem>
    );
  }
  return <SignupForm inviteToken={invite}></SignupForm>;
}

function InviteProblem({ message }: { message: string }) {
  return (
    <Alert variant="destructive">
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );
}
