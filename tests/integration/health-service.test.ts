import { describe, expect, it } from "vitest";
import { dbHealthCheck } from "@/server/services/health-service";

const failingPing = async () => {
  throw new Error("connection refused");
};

const hangingPing = () => new Promise(() => {});

describe("dbHealthCheck", () => {
  it("returns ok when the db answers", async () => {
    expect(await dbHealthCheck()).toEqual({ status: "ok" });
  });

  it("returns error if the db has an error", async () => {
    expect(await dbHealthCheck(failingPing)).toEqual({ status: "error" });
  });
  it("returns error when the db never answers", async () => {
    expect(await dbHealthCheck(hangingPing, 50)).toEqual({ status: "error" });
  });
});
