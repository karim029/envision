// Pure functions: no env, no database. Unit-tested in tests/unit/invite-token.test.ts.
// Both come from "node:crypto".

/**
 * A new, unguessable invite token to put in the signup link (?invite=<token>).
 * 32 random bytes encoded as base64url → 43 URL-safe characters ([A-Za-z0-9_-]).
 * Use crypto.randomBytes — never Math.random() for anything security-related.
 */
export function generateInviteToken(): string {
  throw new Error("TODO: implement");
}

/**
 * What we store in Invite.tokenHash: SHA-256 of the token (surrounding whitespace
 * trimmed), as 64 lowercase hex characters. Same input → same hash, so a lookup by
 * hash finds the invite without the database ever holding the token itself.
 */
export function hashInviteToken(token: string): string {
  void token;
  throw new Error("TODO: implement");
}
