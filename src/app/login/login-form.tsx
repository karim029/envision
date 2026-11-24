"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useActionState } from "react";
import { logInAction, type LogInState } from "./actions";
import { LOG_IN_ERROR_MESSAGES } from "./messages";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircleIcon } from "lucide-react";

interface LoginFormState {
  result: LogInState;
  email: string;
}

const initialState: LoginFormState = { result: null, email: "" };
/**
 * Login form (client component).
 * - useActionState runs `submit`, a browser-side wrapper around logInAction that also
 *   remembers the typed email, so it is given back as defaultValue after an error.
 *   Never the password.
 * - The button is disabled while pending; a red Alert shows LOG_IN_ERROR_MESSAGES on failure.
 */
export function LoginForm() {
  const [state, formAction, pending] = useActionState(submit, initialState);
  const errorMessage = state.result
    ? LOG_IN_ERROR_MESSAGES[state.result.status]
    : null;
  return (
    <form action={formAction} className="grid gap-4">
      {errorMessage && (
        <Alert variant="destructive">
          <AlertCircleIcon />
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}
      <div className="grid gap-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          defaultValue={state.email}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
      </div>
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Logging in..." : "Log in"}
      </Button>
    </form>
  );
}

async function submit(
  prev: LoginFormState,
  formData: FormData,
): Promise<LoginFormState> {
  const outcome = await logInAction(prev.result, formData);

  return {
    result: outcome,
    email: String(formData.get("email") ?? ""),
  };
}
