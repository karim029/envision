import {
  generateInviteToken,
  hashInviteToken,
} from "@/server/services/invite-token";
import { describe, expect, it } from "vitest";

describe("generateInviteToken", () => {
  it("returns 43 URL-safe characters (32 random bytes, base64url)", () => {
    expect(generateInviteToken()).toMatch(/^[A-Za-z0-9_-]{43}$/);
  });
  it("returns a different token every time", () => {
    const tokens = new Set(
      Array.from({ length: 100 }, () => generateInviteToken()),
    );
    expect(tokens.size).toBe(100);
  });
});

describe("hashInviteToken", () => {
  it("is SHA-256 as lowercase hex", () => {
    // Known SHA-256 test vector for "abc".
    expect(hashInviteToken("abc")).toBe(
      "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
    );
  });
  it("is deterministic", () => {
    const token = generateInviteToken();
    expect(hashInviteToken(token)).toBe(hashInviteToken(token));
  });
  it("ignores surrounding whitespace (pasted links)", () => {
    expect(hashInviteToken("  abc\n")).toBe(hashInviteToken("abc"));
  });
  it("never returns the token itself", () => {
    const token = generateInviteToken();
    expect(hashInviteToken(token)).not.toContain(token);
  });
  it("gives different hashes for different tokens", () => {
    expect(hashInviteToken("abc")).not.toBe(hashInviteToken("abd"));
  });
});
