import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { logOutAction } from "@/app/auth/actions";

// Where requireAuthContext() sends someone with a Supabase account but no User row.
// Deliberately a locked door, not a form: during the invite-only beta the only way in is
// /signup with an invite link. A tester stuck here (signup failed after the account was
// created) is fixed by hand: delete their auth user in Supabase, they sign up again with
// the same link (the invite claim rolled back with the failed transaction).
// Static: shows no data, so it needs no guard.
export default function OnboardingPage() {
  return (
    <main className="flex min-h-svh items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Your account isn&apos;t set up</CardTitle>
          <CardDescription>
            Envision is invite-only during the beta. If you signed up with an
            invite link and ended up here, your setup didn&apos;t finish.
            Contact the person who invited you and they&apos;ll sort it out.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={logOutAction}>
            <Button type="submit" variant="outline" className="w-full">
              Log out
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
