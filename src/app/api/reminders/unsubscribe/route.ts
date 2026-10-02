import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";

import { parseUnsubscribeToken } from "@/lib/checkInReminders";

// One-click unsubscribe (RFC 8058). Mail apps POST here from the
// List-Unsubscribe header; the /unsubscribe page posts here from its button.
// GET does nothing, so link scanners that prefetch URLs can't unsubscribe
// anyone. Uses the anon key: unsubscribe_checkin_reminders() (schema_v50)
// only turns reminders off for the profile with that random token.

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const token = parseUnsubscribeToken(request.nextUrl.searchParams.get("t"));
  if (!token) return NextResponse.json({ ok: false, error: "invalid_token" }, { status: 400 });

  const supabase = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
  const { data, error } = await supabase.rpc("unsubscribe_checkin_reminders", { p_token: token });
  if (error) {
    console.error("unsubscribe failed", error.message);
    return NextResponse.json({ ok: false, error: "unavailable" }, { status: 500 });
  }
  return NextResponse.json({ ok: true, found: Boolean(data) }, { headers: { "Cache-Control": "no-store" } });
}
