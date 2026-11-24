import { SITE_URL } from "@/lib/site";
import { todayISO } from "@/lib/storage";

/**
 * Read-only viewer links (P-06). An athlete makes a private link for a parent
 * or an outside coach; whoever opens it sees a short summary of the athlete's
 * training with no account. Tokens are made and checked by database functions
 * (schema_v67), which store only a hash of the token.
 */

export const VIEWER_ROLES = ["parent", "coach"] as const;
export type ViewerRole = (typeof VIEWER_ROLES)[number];

export const VIEWER_LABEL_MAX = 60;
export const VIEWER_LINK_LIMIT = 10;

const TOKEN = /^[0-9a-f]{48}$/;

export function isViewerRole(value: unknown): value is ViewerRole {
  return value === "parent" || value === "coach";
}

/** A well-formed token in lower case, or null. */
export function parseViewerToken(raw: string | null | undefined): string | null {
  const token = raw?.trim().toLowerCase() ?? "";
  return TOKEN.test(token) ? token : null;
}

export function viewerLink(token: string): string {
  return `${SITE_URL}/view?t=${encodeURIComponent(token)}`;
}

/** The optional name the athlete gives a link ("Mom", "Coach Rivera"): trimmed, or null when blank. */
export function normalizeViewerLabel(input: string | null | undefined): string | null {
  const label = (input ?? "").replace(/\s+/g, " ").trim();
  return label ? label.slice(0, VIEWER_LABEL_MAX) : null;
}

export function viewerRoleLabel(role: ViewerRole): string {
  return role === "parent" ? "Parent" : "Coach";
}

/** "Mom (parent)" or just "Parent" when the athlete didn't name the link. */
export function describeViewerLink(link: { role: ViewerRole; label: string | null }): string {
  return link.label ? `${link.label} (${link.role})` : viewerRoleLabel(link.role);
}

const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export function isEmailAddress(value: string): boolean {
  const email = value.trim();
  return email.length <= 254 && EMAIL.test(email);
}

export function viewerInviteMessage(role: ViewerRole, link: string): { subject: string; body: string } {
  const who = role === "parent" ? "" : " as my coach";
  return {
    subject: "See my training on NextRep",
    body:
      `I'm training with NextRep. This private link shows my workouts, check-ins and best jumps${who}. ` +
      `It's read-only and you don't need an account:\n\n${link}\n\n` +
      "Please don't forward it. I can turn it off any time."
  };
}

/** A mailto: link with the invite filled in, so "by email" works from the athlete's own mail app. */
export function viewerInviteMailto(email: string, role: ViewerRole, link: string): string {
  const { subject, body } = viewerInviteMessage(role, link);
  return `mailto:${encodeURIComponent(email.trim())}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

// ---- The viewer page ----

export type ViewerWorkout = { date: string; minutes: number | null };

export type ViewerSummary = {
  role: ViewerRole;
  firstName: string | null;
  workoutsThisWeek: number;
  workoutsLast4Weeks: number;
  /** Most recent first, at most 10, one per finished workout. */
  recentWorkouts: ViewerWorkout[];
  /** Days with a check-in in the last 14 days. */
  checkInDays14: number;
  /** Days with a finished workout in the last 14 days. */
  workoutDays14: number;
  bestVertical: number | null;
  bestApproach: number | null;
};

function asNumber(value: unknown): number | null {
  const n = typeof value === "string" ? Number(value) : value;
  return typeof n === "number" && Number.isFinite(n) && n > 0 ? n : null;
}

function localDate(iso: unknown): string | null {
  if (typeof iso !== "string") return null;
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? null : todayISO(date);
}

function daysBetween(fromISO: string, toISO: string): number {
  return Math.round((Date.parse(`${toISO}T00:00:00Z`) - Date.parse(`${fromISO}T00:00:00Z`)) / 86_400_000);
}

/** Monday of the week holding `dateISO` (weeks run Monday to Sunday, like the plan). */
function mondayOf(dateISO: string): string {
  const date = new Date(`${dateISO}T00:00:00Z`);
  const offset = (date.getUTCDay() + 6) % 7;
  date.setUTCDate(date.getUTCDate() - offset);
  return date.toISOString().slice(0, 10);
}

/**
 * Turns viewer_summary()'s JSON into what the page shows, counting days in
 * the viewer's own time zone. Null when the link doesn't work (the function
 * returns null for an unknown or revoked token) or the shape is wrong.
 */
export function summarizeViewerData(raw: unknown, now: Date = new Date()): ViewerSummary | null {
  if (!raw || typeof raw !== "object") return null;
  const data = raw as Record<string, unknown>;
  if (!isViewerRole(data.role)) return null;

  const today = todayISO(now);
  const weekStart = mondayOf(today);

  const workouts: ViewerWorkout[] = (Array.isArray(data.workouts) ? data.workouts : [])
    .map((row) => {
      const entry = (row ?? {}) as Record<string, unknown>;
      const date = localDate(entry.ended_at);
      const seconds = asNumber(entry.duration_seconds);
      return date ? { date, minutes: seconds ? Math.max(1, Math.round(seconds / 60)) : null } : null;
    })
    .filter((row): row is ViewerWorkout => row !== null && row.date <= today)
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));

  const checkInDates = new Set(
    (Array.isArray(data.check_ins) ? data.check_ins : [])
      .map(localDate)
      .filter((date): date is string => date !== null && date <= today && daysBetween(date, today) < 14)
  );

  const name = typeof data.name === "string" ? data.name.trim() : "";

  return {
    role: data.role,
    firstName: name ? name.slice(0, 40) : null,
    workoutsThisWeek: workouts.filter((w) => w.date >= weekStart).length,
    workoutsLast4Weeks: workouts.filter((w) => daysBetween(w.date, today) < 28).length,
    recentWorkouts: workouts.slice(0, 10),
    checkInDays14: checkInDates.size,
    workoutDays14: new Set(workouts.filter((w) => daysBetween(w.date, today) < 14).map((w) => w.date)).size,
    bestVertical: asNumber(data.best_vertical),
    bestApproach: asNumber(data.best_approach)
  };
}
