"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useActionState, type ComponentProps } from "react";
import { signUpAction } from "./actions";
import type {
  SignUpField,
  SignUpOutcome,
} from "@/server/services/signup-service";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircleIcon } from "lucide-react";
import { CHECK_EMAIL_MESSAGE, signUpErrorMessage } from "./messages";

/** What the form remembers between submits. */
interface FormState {
  /** What signUpAction returned last time (null = not submitted yet). */
  outcome: SignUpOutcome | null;
  /** What Sara typed  given back as defaultValue so React's reset doesn't wipe it. */
  values: { companyName: string; email: string };
}

const initialState: FormState = {
  outcome: null,
  values: { companyName: "", email: "" },
};

/*
 * Runs in the BROWSER and wraps the Server Action
 * 1. Call signUpAction(prev.outcome, formData) and await the outcome.
 * 2. Return { outcome, values: { companyName, email } } with both values read from formData.
 *    formData.get() returns FormDataEntryValue | null — turn it into a string.
 *    (No password: never kept.)
 */
async function submit(prev: FormState, formData: FormData): Promise<FormState> {
  const outcome = await signUpAction(prev.outcome, formData);
  return {
    outcome: outcome,
    values: {
      companyName: String(formData.get("companyName") ?? ""),
      email: String(formData.get("email") ?? ""),
    },
  };
}

export function SignupForm({ inviteToken }: { inviteToken: string }) {
  const [state, formAction, pending] = useActionState(submit, initialState);
  const { outcome, values } = state;

  if (outcome?.status === "check_email") {
    return (
      <Alert>
        <AlertDescription>{CHECK_EMAIL_MESSAGE}</AlertDescription>
      </Alert>
    );
  }
  const errorMessage = outcome ? signUpErrorMessage(outcome) : null;
  const fieldErrors =
    outcome?.status === "invalid_input" ? outcome.fieldErrors : {};
  return (
    <form action={formAction} className="grid gap-4">
      {errorMessage && (
        <Alert variant="destructive">
          <AlertCircleIcon />
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}
      <Field
        name="companyName"
        label="Company name"
        autoComplete="organization"
        maxLength={100}
        errors={fieldErrors.companyName}
        defaultValue={values.companyName}
      />
      <Field
        name="email"
        label="Work email"
        type="email"
        autoComplete="email"
        errors={fieldErrors.email}
        defaultValue={values.email}
      />
      <Field
        name="password"
        label="Password"
        type="password"
        autoComplete="new-password"
        minLength={8}
        maxLength={72}
        errors={fieldErrors.password}
      />
      <input type="hidden" name="inviteToken" value={inviteToken}></input>
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Creating account..." : "Create account"}
      </Button>
    </form>
  );
}

/** Label + input + the field's first error (red border via aria-invalid). Visual only. */
function Field({
  name,
  label,
  errors,
  ...inputProps
}: {
  name: SignUpField;
  label: string;
  errors?: string[];
} & ComponentProps<"input">) {
  const errorId = `${name}-error`;
  return (
    <div className="grid gap-2">
      <Label htmlFor={name}>{label}</Label>
      <Input
        id={name}
        name={name}
        required
        aria-invalid={errors ? true : undefined}
        aria-describedby={errors ? errorId : undefined}
        {...inputProps}
      />
      {errors && (
        <p id={errorId} className="text-sm text-destructive">
          {errors[0]}
        </p>
      )}
    </div>
  );
}
