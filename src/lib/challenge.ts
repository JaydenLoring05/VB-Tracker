/**
 * The weekly challenge (G-06). One challenge a week for everyone, rotating
 * between a jumps goal and a workouts goal so beginners and college athletes
 * both have a shot. Weeks start on Monday. Totals come from the database
 * (schema_v63) so nobody can fake their score.
 */

export type ChallengeMetric = "jumps" | "workouts";

export type Challenge = {
  /** Stable id for this week's challenge, e.g. "2026-11-02-jumps". */
  id: string;
  weekStart: string;
  metric: ChallengeMetric;
  goal: number;
  title: string;
  unit: string;
};

const ROTATION: Omit<Challenge, "id" | "weekStart">[] = [
  { metric: "jumps", goal: 100, title: "100 jumps this week", unit: "jumps" },
  { metric: "workouts", goal: 4, title: "4 workouts this week", unit: "workouts" },
  { metric: "jumps", goal: 150, title: "150 jumps this week", unit: "jumps" },
  { metric: "workouts", goal: 5, title: "5 workouts this week", unit: "workouts" }
];

const ISO = /^\d{4}-\d{2}-\d{2}$/;

function toDay(iso: string): number {
  const [y, m, d] = iso.split("-").map(Number);
  return Math.floor(Date.UTC(y, m - 1, d) / 86_400_000);
}

function toIso(day: number): string {
  return new Date(day * 86_400_000).toISOString().slice(0, 10);
}

/** The Monday on or before a YYYY-MM-DD date, or "" for an empty date. */
export function weekStartFor(isoDate: string): string {
  if (!ISO.test(isoDate)) return "";
  const day = toDay(isoDate);
  // 1970-01-01 (day 0) was a Thursday; Monday-based weekday is (day + 3) % 7.
  return toIso(day - ((day + 3) % 7));
}

/** This week's challenge, the same for everyone. */
export function challengeForWeek(weekStart: string): Challenge | null {
  if (!ISO.test(weekStart)) return null;
  const weekNumber = Math.floor((toDay(weekStart) + 3) / 7);
  const pick = ROTATION[((weekNumber % ROTATION.length) + ROTATION.length) % ROTATION.length];
  return { ...pick, id: `${weekStart}-${pick.metric}`, weekStart };
}

export function challengePercent(total: number, goal: number): number {
  if (goal <= 0) return 0;
  return Math.max(0, Math.min(100, Math.floor((total / goal) * 100)));
}

/** "Ava T." from "Ava Thompson"; "Ava" for one name; "Athlete" for none. Mirrors the SQL in schema_v63. */
export function leaderboardLabel(displayName: string | null | undefined): string {
  const parts = (displayName ?? "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "Athlete";
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1][0].toUpperCase()}.`;
}
