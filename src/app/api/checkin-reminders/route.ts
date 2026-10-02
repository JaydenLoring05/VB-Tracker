import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";

import { buildReminderEmail, type ReminderRecipient } from "@/lib/checkInReminders";
import { isAuthorizedCronRequest, readDailySummaryConfig, sendSummaryEmail } from "@/lib/dailySummary";
import { SITE_URL } from "@/lib/site";

// Athlete check-in reminders, called every hour by the GitHub Actions
// workflow in .github/workflows/checkin-reminders.yml (an hourly Vercel cron
// isn't available on the Hobby plan). Reuses the daily coach summary setup:
// off unless RESEND_API_KEY, DAILY_SUMMARY_FROM and CRON_SECRET are all set,
// and the same CRON_SECRET authorizes the call.
//
// Uses the anon key. public.checkin_reminder_recipients() (schema_v50) only
// answers with the cron secret, only returns athletes due right now who
// haven't checked in today, and logs them so nobody gets two in a day.

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function json(body: Record<string, unknown>, status = 200) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

export async function GET(request: NextRequest) {
  const config = readDailySummaryConfig(process.env);
  if (!config) return json({ ok: true, skipped: true });

  if (!isAuthorizedCronRequest(request.headers.get("authorization"), config.cronSecret)) {
    return json({ ok: false, error: "unauthorized" }, 401);
  }

  const supabase = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );

  const { data, error } = await supabase.rpc("checkin_reminder_recipients", { p_secret: config.cronSecret });
  if (error) {
    console.error("checkin-reminders: could not load recipients", error.message);
    return json({ ok: false, error: "data_unavailable" }, 500);
  }

  const recipients = (data ?? []) as (ReminderRecipient & { email: string })[];
  let sent = 0;
  let failed = 0;
  for (const recipient of recipients) {
    const email = buildReminderEmail(recipient, SITE_URL);
    const ok = await sendSummaryEmail(fetch, config, { to: recipient.email, ...email });
    if (ok) sent++;
    else failed++;
  }

  if (failed > 0) console.error(`checkin-reminders: ${failed} of ${recipients.length} emails failed to send`);
  return json({ ok: failed === 0, recipients: recipients.length, sent, failed });
}
