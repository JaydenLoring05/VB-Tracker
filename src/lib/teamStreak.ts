import { todayISO } from "@/lib/storage";

/**
 * The coach's streak: days in a row on which at least half the team checked
 * in. Like the athlete streak, today only counts once it's reached; until
 * then the streak runs through yesterday, so it doesn't read 0 every morning.
 */

/** How many athletes must check in for a day to count (half, rounded up; at least 1). */
export function teamStreakNeeded(athleteCount: number): number {
  return Math.max(1, Math.ceil(athleteCount / 2));
}

export type TeamStreak = {
  days: number;
  /** Athletes who have checked in today. */
  today: number;
  needed: number;
  athleteCount: number;
};

/**
 * @param checkInDays ISO dates (YYYY-MM-DD) each athlete checked in on; duplicates are fine.
 */
export function computeTeamStreak(
  checkInDays: Record<string, string[]>,
  athleteCount: number,
  now: Date = new Date()
): TeamStreak {
  const needed = teamStreakNeeded(athleteCount);
  const perDay = new Map<string, number>();
  Object.values(checkInDays).forEach((dates) => {
    new Set(dates.filter(Boolean)).forEach((date) => perDay.set(date, (perDay.get(date) ?? 0) + 1));
  });

  const cursor = new Date(now);
  const today = perDay.get(todayISO(cursor)) ?? 0;
  if (athleteCount === 0) return { days: 0, today: 0, needed, athleteCount };

  if (today < needed) cursor.setDate(cursor.getDate() - 1);

  let days = 0;
  while ((perDay.get(todayISO(cursor)) ?? 0) >= needed) {
    days++;
    cursor.setDate(cursor.getDate() - 1);
  }

  return { days, today, needed, athleteCount };
}
