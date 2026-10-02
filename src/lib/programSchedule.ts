// Where an athlete is in their program, from a persisted start date
// (profiles.program_start_date, schema_v44). Program weeks run Monday to
// Sunday; the start date is stored as the Monday of week 1, but any date
// works and counts from its own Monday.
//
// All dates are local calendar dates as YYYY-MM-DD strings. The math runs in
// UTC on those strings so a timezone or DST change can't shift a day.

export const WEEKDAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"] as const;

const DAY_MS = 24 * 60 * 60 * 1000;

function toUTC(iso: string): number {
  return Date.parse(`${iso}T00:00:00Z`);
}

function fromUTC(time: number): string {
  return new Date(time).toISOString().slice(0, 10);
}

export function addDays(iso: string, days: number): string {
  return fromUTC(toUTC(iso) + days * DAY_MS);
}

/** "Monday" ... "Sunday" for a date. */
export function weekdayName(iso: string): (typeof WEEKDAY_NAMES)[number] {
  const jsDay = new Date(toUTC(iso)).getUTCDay(); // 0 = Sunday
  return WEEKDAY_NAMES[(jsDay + 6) % 7];
}

export function mondayOf(iso: string): string {
  const offset = WEEKDAY_NAMES.indexOf(weekdayName(iso));
  return addDays(iso, -offset);
}

/** 1-based program week that `date` falls in, or null before the start. */
export function programWeekOn(startDate: string, date: string): number | null {
  const start = toUTC(mondayOf(startDate));
  const target = toUTC(date);
  if (target < start) return null;
  return Math.floor((target - start) / (7 * DAY_MS)) + 1;
}

/** The start date (a Monday) that makes `today` fall in `week`. */
export function startDateForWeek(week: number, today: string): string {
  const safeWeek = Math.max(1, Math.floor(week) || 1);
  return addDays(mondayOf(today), -(safeWeek - 1) * 7);
}

export type AssignedDay = { date: string; week: number; day: string };

/**
 * Training days the athlete's program assigned in the `windowDays` days
 * before today. Today is left out because it isn't over yet.
 */
export function assignedDaysInWindow({
  startDate,
  today,
  isTrainingDay,
  windowDays = 7,
  totalWeeks
}: {
  startDate: string;
  today: string;
  isTrainingDay: (week: number, day: string) => boolean;
  windowDays?: number;
  /** Weeks after this are past the end of the program. Omit for a repeating program. */
  totalWeeks?: number;
}): AssignedDay[] {
  const days: AssignedDay[] = [];

  for (let offset = windowDays; offset >= 1; offset--) {
    const date = addDays(today, -offset);
    if (date < startDate) continue;
    const week = programWeekOn(startDate, date);
    if (week == null) continue;
    if (totalWeeks != null && week > totalWeeks) continue;
    const day = weekdayName(date);
    if (isTrainingDay(week, day)) days.push({ date, week, day });
  }

  return days;
}

/**
 * Assigned days with no completed session for that program week and day.
 * Sessions record the (week, day) they were started for, so a make-up
 * session done a day late still counts.
 */
export function countMissedAssignedDays(
  assigned: AssignedDay[],
  completed: { week: number; day: string }[]
): { assigned: number; missed: number } {
  const done = new Set(completed.map((session) => `${session.week}-${session.day}`));
  const missed = assigned.filter((day) => !done.has(`${day.week}-${day.day}`)).length;
  return { assigned: assigned.length, missed };
}
