import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

// Where /auth/confirm sends people when an email link fails to verify.
export default function AuthErrorPage() {
  return (
    <main className="flex min-h-svh items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>This link didn&apos;t work</CardTitle>
          <CardDescription>
            It may have expired or already been used. Email links work once and
            only for a limited time.
          </CardDescription>
        </CardHeader>
      </Card>
    </main>
  );
}
