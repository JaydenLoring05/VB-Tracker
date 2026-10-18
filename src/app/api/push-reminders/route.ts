import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import webpush from "web-push";

import { isAuthorizedCronRequest, readDailySummaryConfig } from "@/lib/dailySummary";
import { buildPushReminder, isGoneStatus, readPushConfig } from "@/lib/pushReminders";

// Phone push reminders, called every hour by .github/workflows/checkin-reminders.yml
// right after the check-in emails. Off unless CRON_SECRET (the daily-summary
// setup) and the three VAPID variables are set; the same CRON_SECRET
// authorizes the call.
//
// Uses the anon key. public.push_reminder_recipients() (schema_v55) only
// answers with the cron secret, only returns players who are due now and
// still have something to do today, and logs them so nobody gets two in a day.

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function json(body: Record<string, unknown>, status = 200) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

type Recipient = {
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  display_name: string | null;
  needs_check_in: boolean;
  needs_workout: boolean;
};

export async function GET(request: NextRequest) {
  const cron = readDailySummaryConfig(process.env);
  const push = readPushConfig(process.env);
  if (!cron || !push) return json({ ok: true, skipped: true });

  if (!isAuthorizedCronRequest(request.headers.get("authorization"), cron.cronSecret)) {
    return json({ ok: false, error: "unauthorized" }, 401);
  }

  const supabase = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );

  const { data, error } = await supabase.rpc("push_reminder_recipients", { p_secret: cron.cronSecret });
  if (error) {
    console.error("push-reminders: could not load recipients", error.message);
    return json({ ok: false, error: "data_unavailable" }, 500);
  }

  webpush.setVapidDetails(push.subject, push.publicKey, push.privateKey);

  const recipients = (data ?? []) as Recipient[];
  let sent = 0;
  let failed = 0;
  let removed = 0;
  for (const recipient of recipients) {
    const message = buildPushReminder(recipient);
    try {
      await webpush.sendNotification(
        { endpoint: recipient.endpoint, keys: { p256dh: recipient.p256dh, auth: recipient.auth } },
        JSON.stringify(message),
        { TTL: 4 * 60 * 60, urgency: "normal" }
      );
      sent++;
    } catch (err) {
      const statusCode = (err as { statusCode?: number }).statusCode;
      if (isGoneStatus(statusCode)) {
        await supabase.rpc("remove_push_subscription", { p_secret: cron.cronSecret, p_endpoint: recipient.endpoint });
        removed++;
      } else {
        failed++;
        console.error("push-reminders: send failed", statusCode ?? (err as Error).message);
      }
    }
  }

  return json({ ok: failed === 0, recipients: recipients.length, sent, failed, removed });
}
