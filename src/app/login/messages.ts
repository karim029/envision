// What Sara reads when a login fails — one sentence per LogInState status.
import type { LogInState } from "./actions";

type LogInFailure = NonNullable<LogInState>["status"];

export const LOG_IN_ERROR_MESSAGES: Record<LogInFailure, string> = {
  // One message for unknown email AND wrong password: no account enumeration.
  invalid_credentials: "Wrong email or password.",
  email_not_confirmed:
    "Please confirm your email first check your inbox for the link we sent you.",
  rate_limited: "Too many attempts. Please wait a few minutes and try again.",
  failed: "Something went wrong. Please try again.",
};
