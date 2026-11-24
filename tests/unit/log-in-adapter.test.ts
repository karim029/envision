import { toLogInResult } from "@/lib/supabase/log-in-adapter";
import { describe, expect, it } from "vitest";

describe("toLogInResult (Supabase → our language)", () => {
  it("maps no error to logged_in", () => {
    expect(toLogInResult({ error: null })).toEqual({ status: "logged_in" });
  });

  it.each([
    ["invalid_credentials", "invalid_credentials"],
    ["email_not_confirmed", "email_not_confirmed"],
    ["over_request_rate_limit", "rate_limited"],
  ])("maps the %s error to %s", (code, status) => {
    expect(toLogInResult({ error: { code } })).toEqual({ status });
  });

  it("maps any other error to failed", () => {
    expect(toLogInResult({ error: { code: "user_banned" } })).toEqual({
      status: "failed",
    });
  });

  it("maps an error without a code to failed", () => {
    expect(toLogInResult({ error: {} })).toEqual({ status: "failed" });
    expect(toLogInResult({ error: { code: null } })).toEqual({
      status: "failed",
    });
  });
  it("maps the email_address_invalid error to invalid_credentials", () => {
    expect(toLogInResult({ error: { code: "email_address_invalid" } })).toEqual(
      {
        status: "invalid_credentials",
      },
    );
  });
  it("does not treat phone_not_confirmed as email_not_confirmed", () => {
    expect(toLogInResult({ error: { code: "phone_not_confirmed" } })).toEqual({
      status: "failed",
    });
  });
});
