import { prisma } from "@/server/db/client";

export type DbHealthResult = { status: "ok" } | { status: "error" };

export type PingFn = () => Promise<unknown>;

/**
 * 1. Raw Query SELECT 1.
 * 2. Health -> {status: "ok"}.
 * 3. Not Healthy -> {status: "error"} (for down, pause, wrong password)
 * 4. No answer within timeoutMs -> {status: "error"}
 */
export async function dbHealthCheck(
  ping: PingFn = () => prisma.$queryRaw`SELECT 1`,
  timeoutMs: number = 5000,
): Promise<DbHealthResult> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const timeoutBox = new Promise((_resolve, reject) => {
      timer = setTimeout(() => {
        reject(new Error("DB health check timed out"));
      }, timeoutMs);
    });
    await Promise.race([ping(), timeoutBox]);
    return { status: "ok" };
  } catch (error) {
    console.error("DB health check failed:", error);
    return { status: "error" };
  } finally {
    clearTimeout(timer);
  }
}
