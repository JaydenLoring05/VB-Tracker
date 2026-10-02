import { NextResponse, type NextRequest } from "next/server";

import { CONTACT_EMAIL } from "@/lib/contact";
import { sendSummaryEmail } from "@/lib/dailySummary";
import { appVersion, buildFeedbackEmail, deviceLabel, feedbackPage, validateFeedbackMessage } from "@/lib/feedback";
import { createClient } from "@/lib/supabase/server";

import packageJson from "../../../../package.json";

// "Send feedback". Saves to public.feedback (schema_v51) through the
// signed-in user's own session, so RLS applies: users can only insert their
// own rows. Role, team, app version and device are worked out here rather
// than trusted from the browser. If Resend is configured (RESEND_API_KEY and
// DAILY_SUMMARY_FROM, the same variables as the daily coach summary), it
// also emails the feedback to CONTACT_EMAIL; otherwise it only saves.

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

  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return json({ ok: false, error: "unauthorized" }, 401);

  let body: { message?: unknown; page?: unknown };
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: "Write a message first." }, 400);
  }

  const validated = validateFeedbackMessage(typeof body.message === "string" ? body.message : "");
  if (!validated.ok) return json({ ok: false, error: validated.error }, 400);

  const page = feedbackPage(typeof body.page === "string" ? body.page : null);
  const device = deviceLabel(request.headers.get("user-agent"));
  const version = appVersion(packageJson.version, process.env.VERCEL_GIT_COMMIT_SHA);

  // The user's own membership (RLS: "own membership"); coaches may have several teams.
  const { data: memberships } = await supabase
    .from("team_members")
    .select("team_id, role, teams(name)")
    .eq("user_id", user.id)
    .limit(1);
  const membership = memberships?.[0] as
    | { team_id: string; role: "coach" | "athlete"; teams: { name: string } | { name: string }[] | null }
    | undefined;
  const team = Array.isArray(membership?.teams) ? membership?.teams[0] : membership?.teams;

  const { error } = await supabase.from("feedback").insert({
    user_id: user.id,
    message: validated.message,
    page,
    role: membership?.role ?? null,
    team_id: membership?.team_id ?? null,
    app_version: version,
    device
  });

  if (error) {
    console.error("feedback insert failed", error.code);
    return json({ ok: false, error: "Couldn't send that. Try again in a minute." }, 500);
  }

  let emailed = false;
  const resendApiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.DAILY_SUMMARY_FROM?.trim();
  if (resendApiKey && from) {
    const email = buildFeedbackEmail({
      message: validated.message,
      page,
      role: membership?.role ?? null,
      teamName: team?.name ?? null,
      appVersion: version,
      device,
      userId: user.id
    });
    emailed = await sendSummaryEmail(
      fetch,
      { resendApiKey, from, cronSecret: "", timeZone: "UTC" },
      { to: CONTACT_EMAIL, ...email }
    );
  }

  return json({ ok: true, emailed });
}
