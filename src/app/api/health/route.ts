import { dbHealthCheck } from "@/server/services/health-service";
import { connection } from "next/server";

export async function GET() {
  await connection();
  const res = await dbHealthCheck();
  return Response.json(
    { status: res.status, timestamp: new Date().toISOString() },
    { status: res.status === "ok" ? 200 : 503 },
  );
}
