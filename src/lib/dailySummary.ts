// The daily coach summary email. Everything here is pure (the Resend call
// takes its fetch as a parameter) so it is unit tested without a network.
// The numbers come from the same functions the in-app Attention Center uses,
// so the email and the dashboard always agree.

import {
  ATTENTION_PAIN_THRESHOLD,
  PAIN_FIELDS,
  computeAttentionItems,
  summarizeTeam,
  withCheckInItems
} from "@/lib/attentionCenter";
import { displayMemberName } from "@/lib/memberName";
import { calculateRecovery, recoveryStatus } from "@/lib/recovery";
import { fromStatsRow, type StatsRow } from "@/lib/statsRow";
import type { RosterAthlete, StatEntry } from "@/types";

export const RESEND_API = "https://api.resend.com/emails";
const STALE_DAYS = 3; // same as useCoachRoster
const DAY_MS = 24 * 60 * 60 * 1000;

export type DailySummaryConfig = {
  resendApiKey: string;
  from: string;
  cronSecret: string;
  timeZone: string;
};

/** Null (feature off) unless RESEND_API_KEY, DAILY_SUMMARY_FROM and CRON_SECRET are all set. */
export function readDailySummaryConfig(env: Record<string, string | undefined>): DailySummaryConfig | null {
  const resendApiKey = env.RESEND_API_KEY?.trim();
  const from = env.DAILY_SUMMARY_FROM?.trim();
  const cronSecret = env.CRON_SECRET?.trim();
  if (!resendApiKey || !from || !cronSecret) return null;
  return { resendApiKey, from, cronSecret, timeZone: env.DAILY_SUMMARY_TIME_ZONE?.trim() || "America/Los_Angeles" };
}

/** Vercel Cron sends `Authorization: Bearer <CRON_SECRET>`. Constant-time compare. */
export function isAuthorizedCronRequest(header: string | null, secret: string): boolean {
  if (!header) return false;
  const expected = `Bearer ${secret}`;
  if (header.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < header.length; i++) diff |= header.charCodeAt(i) ^ expected.charCodeAt(i);
  return diff === 0;
}

/** YYYY-MM-DD in the given IANA time zone. */
export function localDateIn(timeZone: string, now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}

type SummaryStatsRow = StatsRow & { created_at?: string; updated_at?: string | null };

/** One team, as returned by public.daily_summary_data() (schema_v47). */
export type DailySummaryTeamData = {
  team_id: string;
  team_name: string;
  coach_email: string;
  coach_name: string | null;
  team_program_days: { day: string; title: string; rest: boolean; exercises: { name: string }[] }[] | null;
  today_events: { type: string; title: string }[];
  athletes: {
    user_id: string;
    display_name: string | null;
    latest_stats: SummaryStatsRow | null;
    stats_history: SummaryStatsRow[];
    completed_last7: number;
    recent_prs: { exercise: string; date: string }[];
  }[];
};

export type TeamDailySummary = {
  teamName: string;
  coachEmail: string;
  coachName: string | null;
  rosterSize: number;
  checkedIn: number;
  readiness: number | null;
  attentionCount: number;
  painAlerts: { name: string; parts: string[] }[];
  /** Today's team-program workout, "Rest day", or null when athletes follow their own plans. */
  todayWorkout: string | null;
  todayEvents: { type: string; title: string }[];
};

function weekdayOf(isoDate: string): string {
  return new Date(`${isoDate}T12:00:00Z`).toLocaleDateString("en-US", { weekday: "long", timeZone: "UTC" });
}

function shiftDate(isoDate: string, days: number): string {
  return new Date(Date.parse(`${isoDate}T00:00:00Z`) + days * DAY_MS).toISOString().slice(0, 10);
}

export function buildTeamSummary(team: DailySummaryTeamData, now: Date, today: string): TeamDailySummary {
  const roster: RosterAthlete[] = team.athletes.map((athlete) => {
    const row = athlete.latest_stats;
    const recovery = calculateRecovery(row ? fromStatsRow(row) : null);
    const lastCheckIn = row?.updated_at ?? null;
    const daysSince = lastCheckIn ? (now.getTime() - new Date(lastCheckIn).getTime()) / DAY_MS : Infinity;
    return {
      userId: athlete.user_id,
      displayName: displayMemberName(athlete.display_name),
      joinedAt: "",
      recovery,
      recoveryLabel: recoveryStatus(recovery).label,
      lastCheckIn,
      needsCheckIn: daysSince >= STALE_DAYS,
      lastActiveAt: null
    };
  });

  const history: Record<string, StatEntry[]> = {};
  const completed: Record<string, number> = {};
  const prs: Record<string, { exercise: string; date: string }[]> = {};
  team.athletes.forEach((athlete) => {
    history[athlete.user_id] = athlete.stats_history.map(fromStatsRow);
    completed[athlete.user_id] = athlete.completed_last7;
    prs[athlete.user_id] = athlete.recent_prs;
  });

  const items = withCheckInItems(computeAttentionItems(roster, history, completed, prs), roster);
  const totals = summarizeTeam(roster, items);

  const yesterday = shiftDate(today, -1);
  const painAlerts = team.athletes.flatMap((athlete, index) => {
    const row = athlete.latest_stats;
    if (!row?.date || row.date < yesterday) return [];
    const entry = fromStatsRow(row);
    const parts = PAIN_FIELDS.filter(({ key }) => Number(entry[key]) >= ATTENTION_PAIN_THRESHOLD).map(
      ({ label }) => label
    );
    return parts.length > 0 ? [{ name: roster[index].displayName, parts }] : [];
  });

  let todayWorkout: string | null = null;
  if (team.team_program_days) {
    const day = team.team_program_days.find((candidate) => candidate.day === weekdayOf(today));
    if (!day || day.rest) todayWorkout = "Rest day";
    else {
      const count = day.exercises.filter((exercise) => exercise.name?.trim()).length;
      todayWorkout = `${day.title || "Training"} (${count} exercise${count === 1 ? "" : "s"})`;
    }
  }

  return {
    teamName: team.team_name,
    coachEmail: team.coach_email,
    coachName: team.coach_name,
    rosterSize: totals.rosterSize,
    checkedIn: totals.checkedIn,
    readiness: totals.readiness,
    attentionCount: totals.needAttention,
    painAlerts,
    todayWorkout,
    todayEvents: team.today_events
  };
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function renderSummaryEmail(
  summary: TeamDailySummary,
  siteUrl: string
): { subject: string; html: string; text: string } {
  const dashboard = `${siteUrl.replace(/\/+$/, "")}/coach`;
  const readiness = summary.readiness == null ? "No check-ins yet" : `${summary.readiness}%`;
  const pain =
    summary.painAlerts.length === 0
      ? "None"
      : summary.painAlerts.map((alert) => `${alert.name} (${alert.parts.join(", ")})`).join("; ");
  const workout = summary.todayWorkout ?? "each athlete's own plan";
  const events = summary.todayEvents.map((event) => `${event.title} (${event.type})`).join("; ");

  const rows: [string, string][] = [
    ["Checked in", `${summary.checkedIn} of ${summary.rosterSize}`],
    ["Need attention", String(summary.attentionCount)],
    ["Average readiness", readiness],
    ["Pain alerts", pain],
    ["Today's workout", workout],
    ...(events ? ([["On the calendar", events]] as [string, string][]) : [])
  ];

  const subject = `${summary.teamName}: ${summary.checkedIn}/${summary.rosterSize} checked in, ${summary.attentionCount} need attention`;

  const text = [
    `${summary.teamName}, this morning`,
    "",
    ...rows.map(([label, value]) => `${label}: ${value}`),
    "",
    `Open the dashboard: ${dashboard}`,
    "",
    "You get this because you turned on the morning summary in NextRep. Turn it off on your coach dashboard."
  ].join("\n");

  const html = `<!doctype html>
<html><body style="margin:0;padding:24px;background:#f6f5f2;font-family:-apple-system,Segoe UI,Roboto,sans-serif;color:#1d1b16">
<table role="presentation" style="max-width:520px;margin:0 auto;background:#fff;border-radius:12px;padding:24px;border-collapse:separate">
<tr><td>
<p style="margin:0 0 4px;font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#9a7a2c">NextRep morning summary</p>
<h1 style="margin:0 0 16px;font-size:22px">${escapeHtml(summary.teamName)}</h1>
<table role="presentation" style="width:100%;border-collapse:collapse;font-size:15px">
${rows
  .map(
    ([label, value]) =>
      `<tr><td style="padding:8px 0;color:#6b665c;border-top:1px solid #eee">${escapeHtml(label)}</td><td style="padding:8px 0;text-align:right;font-weight:600;border-top:1px solid #eee">${escapeHtml(value)}</td></tr>`
  )
  .join("\n")}
</table>
<p style="margin:24px 0 0"><a href="${escapeHtml(dashboard)}" style="display:inline-block;background:#e5ac4c;color:#1d1b16;text-decoration:none;font-weight:700;padding:12px 18px;border-radius:8px">Open the dashboard</a></p>
<p style="margin:24px 0 0;font-size:12px;color:#8a857a">You get this because you turned on the morning summary in NextRep. Turn it off on your coach dashboard.</p>
</td></tr></table>
</body></html>`;

  return { subject, html, text };
}

export type SummaryMessage = {
  to: string;
  subject: string;
  html: string;
  text: string;
  /** Extra email headers, e.g. List-Unsubscribe on reminders. */
  headers?: Record<string, string>;
};

/** Sends one email through Resend. Resolves false on any failure; never throws. */
export async function sendSummaryEmail(
  fetchFn: typeof fetch,
  config: DailySummaryConfig,
  message: SummaryMessage
): Promise<boolean> {
  try {
    const response = await fetchFn(RESEND_API, {
      method: "POST",
      headers: { Authorization: `Bearer ${config.resendApiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: config.from,
        to: [message.to],
        subject: message.subject,
        html: message.html,
        text: message.text,
        ...(message.headers ? { headers: message.headers } : {})
      })
    });
    return response.ok;
  } catch {
    return false;
  }
}
