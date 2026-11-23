"use client";

import type { ComponentProps } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { SignUpField } from "@/server/services/signup-service";

// Step 2 (later): you wire this form to signUpAction with useActionState.
// For now it only renders, so step 1 (the page) can be tested on its own.
export function SignupForm({ inviteToken }: { inviteToken: string }) {
  return (
    <form className="grid gap-4">
      <Field
        name="companyName"
        label="Company name"
        autoComplete="organization"
        maxLength={100}
      />
      <Field
        name="email"
        label="Work email"
        type="email"
        autoComplete="email"
      />
      <Field
        name="password"
        label="Password"
        type="password"
        autoComplete="new-password"
        minLength={8}
        maxLength={72}
      />
      <Button type="submit" className="w-full">
        Create account
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
