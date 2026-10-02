import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";

import {
  buildTeamSummary,
  isAuthorizedCronRequest,
  localDateIn,
  readDailySummaryConfig,
  renderSummaryEmail,
  sendSummaryEmail,
  type DailySummaryTeamData
} from "@/lib/dailySummary";
import { SITE_URL } from "@/lib/site";

// Daily coach summary email, run by Vercel Cron (see vercel.json). Off unless
// RESEND_API_KEY, DAILY_SUMMARY_FROM and CRON_SECRET are all set, the same
// way /api/notion-sync is off without its NOTION_* variables.
//
// Uses the anon key, not a service-role key. The data comes from
// public.daily_summary_data(), which only answers when given the cron secret
// (schema_v47), and only for coaches who opted in.

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

  const now = new Date();
  const today = localDateIn(config.timeZone, now);
  const { data, error } = await supabase.rpc("daily_summary_data", { p_secret: config.cronSecret, p_today: today });

  if (error) {
    console.error("daily-summary: could not load summary data", error.message);
    return json({ ok: false, error: "data_unavailable" }, 500);
  }

  const teams = (data ?? []) as DailySummaryTeamData[];
  let sent = 0;
  let failed = 0;

  for (const team of teams) {
    const summary = buildTeamSummary(team, now, today);
    const email = renderSummaryEmail(summary, SITE_URL);
    const ok = await sendSummaryEmail(fetch, config, { to: summary.coachEmail, ...email });
    if (ok) sent++;
    else failed++;
  }

  if (failed > 0) console.error(`daily-summary: ${failed} of ${teams.length} emails failed to send`);
  return json({ ok: failed === 0, teams: teams.length, sent, failed });
}
