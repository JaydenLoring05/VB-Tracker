import { NextResponse, type NextRequest } from "next/server";

import {
  LOOKBACK_DAYS,
  NotionSyncError,
  readNotionSyncConfig,
  syncTrainingLog,
  type SyncCheckIn,
  type SyncSession
} from "@/lib/notionSync";
import { latestEntryPerDay } from "@/lib/statsHistory";
import { createClient } from "@/lib/supabase/server";

// Optional personal sync into one Notion Training Log. Off unless all three
// NOTION_* env vars are set, and a no-op for everyone except
// NOTION_SYNC_USER_ID. Reads go through the caller's own session, so RLS
// still applies; nothing here uses a service-role key.

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function sameOrigin(request: NextRequest): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try {
    return new URL(origin).host === request.headers.get("host");
  } catch {
    return false;
  }
}

function json(body: Record<string, unknown>, status = 200) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) return json({ ok: false, error: "forbidden" }, 403);

  // Checked before touching Supabase so the disabled case costs nothing.
  const config = readNotionSyncConfig();
  if (!config) return json({ ok: true, skipped: true });

  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return json({ ok: false, error: "unauthorized" }, 401);
  if (user.id !== config.userId) return json({ ok: true, skipped: true });

  const since = new Date(Date.now() - LOOKBACK_DAYS * 24 * 60 * 60 * 1000);
  const sinceISO = since.toISOString();

  const [sessionsResult, checkInsResult] = await Promise.all([
    supabase
      .from("workout_sessions")
      .select("id, week, day, ended_at, duration_seconds, rpe, workout_sets(exercise, set_number, weight, reps, seconds)")
      .eq("user_id", user.id)
      .not("ended_at", "is", null)
      .gte("ended_at", sinceISO)
      .order("ended_at", { ascending: true }),
    supabase
      .from("stats_history")
      .select("id, date, created_at, vertical, approach, sleep, knee_pain")
      .eq("user_id", user.id)
      .gte("created_at", sinceISO)
      .order("created_at", { ascending: true })
  ]);

  if (sessionsResult.error || checkInsResult.error) {
    console.error("notion sync read failed", {
      sessions: sessionsResult.error?.code,
      checkIns: checkInsResult.error?.code
    });
    return json({ ok: false, error: "read_failed" }, 500);
  }

  try {
    const result = await syncTrainingLog({
      config,
      sessions: (sessionsResult.data ?? []) as SyncSession[],
      // One check-in per day (the latest save), so a re-save doesn't add a second Notion row.
      checkIns: latestEntryPerDay((checkInsResult.data ?? []) as (SyncCheckIn & { date: string | null })[]),
      since
    });
    return json({ ok: true, ...result });
  } catch (error) {
    // Log the step and status only; Notion error bodies can echo request data.
    console.error(
      "notion sync failed",
      error instanceof NotionSyncError ? { step: error.step, status: error.status } : { step: "network" }
    );
    return json({ ok: false, error: "notion_failed" }, 502);
  }
}
