import { toSignUpAuthResult } from "@/lib/supabase/sign-up-adapter";
import { describe, expect, it } from "vitest";

const USER_ID = "11111111-1111-1111-1111-111111111111";

describe("toSignUpAuthResult (Supabase → our language)", () => {
  it("maps a genuinely new user to created with its id", () => {
    expect(
      toSignUpAuthResult({
        data: { user: { id: USER_ID, identities: [{ provider: "email" }] } },
        error: null,
      }),
    ).toEqual({ status: "created", authUserId: USER_ID });
  });

  it("detects Supabase's fake user (empty identities) as email_taken", () => {
    expect(
      toSignUpAuthResult({
        data: { user: { id: USER_ID, identities: [] } },
        error: null,
      }),
    ).toEqual({ status: "email_taken" });
  });

  it.each(["user_already_exists", "email_exists"])(
    "maps the %s error to email_taken",
    (code) => {
      expect(
        toSignUpAuthResult({ data: { user: null }, error: { code } }),
      ).toEqual({ status: "email_taken" });
    },
  );

  it.each(["over_email_send_rate_limit", "over_request_rate_limit"])(
    "maps the %s error to rate_limited",
    (code) => {
      expect(
        toSignUpAuthResult({ data: { user: null }, error: { code } }),
      ).toEqual({ status: "rate_limited" });
    },
  );

  it("maps any other error to failed", () => {
    expect(
      toSignUpAuthResult({
        data: { user: null },
        error: { code: "weak_password" },
      }),
    ).toEqual({ status: "failed" });
  });

  it("maps an error without a code to failed", () => {
    expect(toSignUpAuthResult({ data: { user: null }, error: {} })).toEqual({
      status: "failed",
    });
  });

  it("maps a response with neither user nor error to failed", () => {
    expect(toSignUpAuthResult({ data: { user: null }, error: null })).toEqual({
      status: "failed",
    });
  });
});
