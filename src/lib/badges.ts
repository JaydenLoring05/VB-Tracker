import { isJumpExercise } from "@/lib/exerciseMeasure";

/**
 * Badges (G-03). Pure: which badges an athlete has earned from their finished
 * workout dates and PRs. Nothing is stored; a badge can't be lost because the
 * inputs only grow.
 */

export type BadgeId = "first-workout" | "streak-7" | "streak-30" | "jump-pr" | "workouts-50" | "perfect-week";

export type Badge = { id: BadgeId; name: string; description: string; icon: string };

export const BADGES: readonly Badge[] = [
  { id: "first-workout", name: "First Rep", description: "Finish your first workout.", icon: "🏁" },
  { id: "streak-7", name: "On Fire", description: "Train 7 days in a row.", icon: "🔥" },
  { id: "perfect-week", name: "Perfect Week", description: "Do every training day in a week.", icon: "✅" },
  { id: "jump-pr", name: "Sky High", description: "Set a new jump PR.", icon: "🚀" },
  { id: "streak-30", name: "Unstoppable", description: "Train 30 days in a row.", icon: "⚡" },
  { id: "workouts-50", name: "Half Century", description: "Finish 50 workouts.", icon: "🏆" }
];

const JUMP_PR = /\b(vert(ical)?|approach|touch|reach|jump|broad)\b/i;

/** Days in a row with at least one workout, longest run ever. */
export function bestStreak(dates: string[]): number {
  const days = [...new Set(dates)].filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d)).sort();
  let best = 0;
  let run = 0;
  let previous: number | null = null;
  for (const day of days) {
    const n = dayNumber(day);
    run = previous !== null && n === previous + 1 ? run + 1 : 1;
    best = Math.max(best, run);
    previous = n;
  }
  return best;
}

function dayNumber(iso: string): number {
  const [y, m, d] = iso.split("-").map(Number);
  return Math.floor(Date.UTC(y, m - 1, d) / 86_400_000);
}

/** Monday-start week key (the day number of that Monday). */
function weekKey(iso: string): number {
  const n = dayNumber(iso);
  // 1970-01-01 was a Thursday: day 0 is weekday index 3 when Monday is 0.
  return n - ((n + 3) % 7);
}

/** True when some Monday-to-Sunday week has workouts on at least `trainingDaysPerWeek` different days. */
export function hasPerfectWeek(dates: string[], trainingDaysPerWeek: number): boolean {
  const needed = Math.max(3, Math.min(7, Math.round(trainingDaysPerWeek)));
  const daysPerWeek = new Map<number, Set<string>>();
  for (const day of new Set(dates)) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) continue;
    const key = weekKey(day);
    const set = daysPerWeek.get(key) ?? new Set<string>();
    set.add(day);
    daysPerWeek.set(key, set);
  }
  return [...daysPerWeek.values()].some((set) => set.size >= needed);
}

export function isJumpPR(pr: { exercise: string; unit?: string }): boolean {
  return JUMP_PR.test(pr.exercise) || isJumpExercise(pr.exercise);
}

export function earnedBadges({
  workoutDates,
  prs,
  trainingDaysPerWeek
}: {
  workoutDates: string[];
  prs: { exercise: string; unit?: string }[];
  /** Training days in the athlete's current plan week (rest days not counted). */
  trainingDaysPerWeek: number;
}): BadgeId[] {
  const streak = bestStreak(workoutDates);
  const earned = new Set<BadgeId>();
  if (workoutDates.length >= 1) earned.add("first-workout");
  if (streak >= 7) earned.add("streak-7");
  if (streak >= 30) earned.add("streak-30");
  if (prs.some(isJumpPR)) earned.add("jump-pr");
  if (workoutDates.length >= 50) earned.add("workouts-50");
  if (hasPerfectWeek(workoutDates, trainingDaysPerWeek)) earned.add("perfect-week");
  return BADGES.map((badge) => badge.id).filter((id) => earned.has(id));
}

/** Badges earned but not celebrated yet on this device. */
export function newlyEarned(earned: BadgeId[], seen: string[]): BadgeId[] {
  const seenSet = new Set(seen);
  return earned.filter((id) => !seenSet.has(id));
}
