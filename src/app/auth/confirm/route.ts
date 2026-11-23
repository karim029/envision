// GET /auth/confirm?token_hash=…&type=…
// Where the links in Supabase's emails land (signup confirmation and password reset).
// Trades the one-time token_hash for a session (verifyOtp), then redirects.
//
// Why not /auth/callback + exchangeCodeForSession? That PKCE code exchange only works in
// the SAME browser that started the flow — signing up on a laptop and confirming on a phone
// would fail. verifyOtp with a token_hash works on any device. Requires the Supabase email
// templates to link here (see docs/roadmap.md, Slice 1d).
//
// No `next` parameter on purpose: the destination is fixed per link type, so there is no
// user-controlled redirect to abuse (open redirect). Add one only when a real need appears.
import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// Only the link types our emails send, each with its fixed destination.
// "email" = signup confirmation, "recovery" = password reset.
const DESTINATION_BY_TYPE = {
  email: "/dashboard",
  recovery: "/account/update-password",
} as const;

const linkTypeSchema = z.enum(["email", "recovery"]);

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const tokenHash = params.get("token_hash");
  const type = linkTypeSchema.safeParse(params.get("type"));

  if (tokenHash && type.success) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.verifyOtp({
      type: type.data,
      token_hash: tokenHash,
    });
    if (!error) {
      redirect(DESTINATION_BY_TYPE[type.data]);
    }
  }

  // Expired, already used, tampered with, or missing parameters.
  redirect("/auth/error");
}
