import { NextResponse, type NextRequest } from "next/server";
import webpush from "web-push";

import { isGoneStatus, readPushConfig, TEST_PUSH } from "@/lib/pushReminders";
import { createClient } from "@/lib/supabase/server";

// "Send a test" in Settings → Phone reminders. Sends one notification to every
// phone or browser the signed-in player has turned reminders on for. Reads
// their subscriptions through their own session, so RLS limits it to theirs.

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function json(body: Record<string, unknown>, status = 200) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

function sameOrigin(request: NextRequest): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try {
    return new URL(origin).host === request.headers.get("host");
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) return json({ ok: false, error: "forbidden" }, 403);

  const push = readPushConfig(process.env);
  if (!push) return json({ ok: false, error: "not_configured" }, 503);

  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return json({ ok: false, error: "unauthorized" }, 401);

  const { data, error } = await supabase
    .from("push_subscriptions")
    .select("endpoint, p256dh, auth")
    .eq("user_id", user.id);
  if (error) return json({ ok: false, error: "data_unavailable" }, 500);
  if (!data || data.length === 0) return json({ ok: false, error: "no_subscription" }, 404);

  webpush.setVapidDetails(push.subject, push.publicKey, push.privateKey);

  let sent = 0;
  for (const row of data) {
    try {
      await webpush.sendNotification(
        { endpoint: row.endpoint, keys: { p256dh: row.p256dh, auth: row.auth } },
        JSON.stringify(TEST_PUSH),
        { TTL: 60 * 60 }
      );
      sent++;
    } catch (err) {
      if (isGoneStatus((err as { statusCode?: number }).statusCode)) {
        await supabase.from("push_subscriptions").delete().eq("endpoint", row.endpoint).eq("user_id", user.id);
      }
    }
  }

  return json({ ok: sent > 0, sent });
}
