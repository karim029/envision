import { parseEnv } from "@/env.schema";
import { describe, expect, it } from "vitest";

const DATABASE_URL = "postgresql://postgres:postgres@localhost:5433/envision";

describe("ParseEnv", () => {
  it("returns a typed env for valid input", () => {
    expect(parseEnv({ NODE_ENV: "production", DATABASE_URL })).toEqual({
      NODE_ENV: "production",
      DATABASE_URL,
    });
  });
  it("defaults NODE_ENV to development when missing", () => {
    expect(parseEnv({ DATABASE_URL }).NODE_ENV).toBe("development");
  });
  it("drops keys that are not in the schema", () => {
    expect(
      parseEnv({ NODE_ENV: "test", DATABASE_URL, SECRET_NOT_DECLARED: "x" }),
    ).toEqual({ NODE_ENV: "test", DATABASE_URL });
  });
  it("throws a readable error that names the invalid key", () => {
    expect(() => parseEnv({ NODE_ENV: "banana", DATABASE_URL })).toThrow(
      /NODE_ENV/,
    );
  });
  it("requires DATABASE_URL", () => {
    expect(() => parseEnv({ NODE_ENV: "test" })).toThrow(/DATABASE_URL/);
  });
  it("rejects a DATABASE_URL that is not a postgres URL", () => {
    expect(() =>
      parseEnv({ NODE_ENV: "test", DATABASE_URL: "https://example.com" }),
    ).toThrow(/DATABASE_URL/);
  });
  it("lists every invalid key in one error", () => {
    expect(() => parseEnv({ NODE_ENV: "banana" })).toThrow(
      /NODE_ENV[\s\S]*DATABASE_URL/,
    );
  });
});
