import { calculateRecovery } from "@/lib/recovery";
import {
  CHECK_IN_PAIN_THRESHOLD,
  DayContext,
  INJURY_AREAS,
  InjuryArea,
  injuryLabel,
  WeekAdjust,
  Weekday,
  WEEKDAYS,
  WeeklySchedule
} from "@/lib/trainingProfile";
import { StatEntry } from "@/types";

/**
 * Weekly auto-adjust (F-38). The 20-week plan stays the skeleton; this works
 * out how this week bends around the athlete: a lighter week after poor
 * recovery, an injury that keeps showing up, a week that should be repeated,
 * practice and lifting they already do, and games.
 */

export const DELOAD_RECOVERY = 55;
export const MIN_CHECK_INS_FOR_DELOAD = 3;
export const PAIN_DAYS_FOR_WEEK = 2;
export const REPEAT_BELOW = 0.5;

export type WeekAdjustResult = WeekAdjust & {
  /** Sore areas that keep showing up: on for the whole week. */
  extraAreas: InjuryArea[];
  /** Last week's completion was low: suggest doing it again. */
  repeatWeek: boolean;
  /** Plain-language reasons, shown on the plan card. */
  reasons: string[];
};

const PAIN_FIELD: Record<InjuryArea, keyof StatEntry> = {
  knee: "kneePain",
  shoulder: "shoulderPain",
  lowerBack: "lowerBackPain",
  ankle: "anklePain"
};

function parseDay(iso: string): number {
  return Date.parse(`${iso}T00:00:00Z`);
}

function addDays(iso: string, days: number): string {
  return new Date(parseDay(iso) + days * 86_400_000).toISOString().slice(0, 10);
}

/** Monday..Sunday name for an ISO date. */
export function weekdayOf(iso: string): Weekday {
  const index = new Date(parseDay(iso)).getUTCDay(); // 0 = Sunday
  return WEEKDAYS[(index + 6) % 7];
}

/** Monday of the week containing the date. */
export function mondayOf(iso: string): string {
  const index = (new Date(parseDay(iso)).getUTCDay() + 6) % 7;
  return addDays(iso, -index);
}

export function buildWeekAdjust(input: {
  history: StatEntry[];
  today: string;
  schedule: WeeklySchedule;
  /** ISO dates of the athlete's games (personal or team calendar). */
  gameDates: string[];
  /** Share of last program week's exercises checked off, or null if unknown or week 1. */
  completionLastWeek: number | null;
}): WeekAdjustResult {
  const { history, today, schedule, gameDates, completionLastWeek } = input;
  const weekAgo = addDays(today, -7);
  const recent = history.filter((entry) => entry.date > weekAgo && entry.date <= today);
  const reasons: string[] = [];

  // 1. Recovery: a lighter week after a run of poor check-ins.
  let deload = false;
  if (recent.length >= MIN_CHECK_INS_FOR_DELOAD) {
    const average = Math.round(recent.reduce((sum, entry) => sum + calculateRecovery(entry), 0) / recent.length);
    if (average < DELOAD_RECOVERY) {
      deload = true;
      reasons.push(`Recovery averaged ${average}% over your last ${recent.length} check-ins, so this is a lighter week.`);
    }
  }

  // 2. Pain that keeps showing up stays on all week, not just the day.
  const extraAreas = INJURY_AREAS.map((option) => option.value).filter(
    (area) => recent.filter((entry) => Number(entry[PAIN_FIELD[area]]) >= CHECK_IN_PAIN_THRESHOLD).length >= PAIN_DAYS_FOR_WEEK
  );
  extraAreas.forEach((area) =>
    reasons.push(`${injuryLabel(area)} pain showed up on ${PAIN_DAYS_FOR_WEEK}+ check-ins this week, so it's on all week.`)
  );

  // 3. A mostly missed week is worth repeating rather than skipping ahead.
  const repeatWeek = completionLastWeek !== null && completionLastWeek < REPEAT_BELOW;
  if (repeatWeek) {
    reasons.push(`You finished ${Math.round(completionLastWeek! * 100)}% of last week. Repeating it builds the base before moving on.`);
  }

  // 4. The athlete's own week, then games on top (a game always wins).
  const days: Partial<Record<Weekday, DayContext>> = { ...schedule };
  const monday = mondayOf(today);
  const sunday = addDays(monday, 6);
  const games = gameDates.filter((date) => date >= monday && date <= addDays(sunday, 1));
  games.forEach((date) => {
    const before = addDays(date, -1);
    if (before >= monday && before <= sunday && days[weekdayOf(before)] !== "game") days[weekdayOf(before)] = "preGame";
  });
  games.forEach((date) => {
    if (date <= sunday) days[weekdayOf(date)] = "game";
  });
  const gameDays = games.filter((date) => date <= sunday).map(weekdayOf);
  if (gameDays.length > 0) reasons.push(`Game on ${gameDays.join(" and ")}: legs stay fresh the day before.`);

  return { deload, days, extraAreas, repeatWeek, reasons };
}

/** Share of a program week's planned exercises the athlete checked off. */
export function weekCompletion(
  checked: Record<string, boolean>,
  week: number,
  plannedExercises: number
): number | null {
  if (week < 1 || plannedExercises === 0) return null;
  const prefix = `${week}-`;
  const done = Object.entries(checked).filter(([key, value]) => value && key.startsWith(prefix)).length;
  return Math.min(1, done / plannedExercises);
}
