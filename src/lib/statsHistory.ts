import { todayISO } from "@/lib/storage";

// stats_history.date is a text column. Until the October 2026 launch pass the
// app saved it with toLocaleDateString("en-US") ("10/2/2026"); it now saves
// ISO ("2026-10-02"). Everything that reads history goes through these
// helpers so both formats compare, sort and parse the same way, and so an
// athlete who saved twice in one day counts once.

const US_DATE = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** "YYYY-MM-DD" for a stored date, falling back to the day the row was created; "" if neither works. */
export function normalizeStatDate(date: string | null | undefined, createdAt?: string | null): string {
  const value = date?.trim() ?? "";
  if (ISO_DATE.test(value)) return value;

  const us = US_DATE.exec(value);
  if (us) {
    const [, month, day, year] = us;
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }

  if (createdAt) {
    const created = new Date(createdAt);
    if (!Number.isNaN(created.getTime())) return todayISO(created);
  }
  return "";
}

type DatedRow = { date?: string | null; created_at?: string | null };

/**
 * One entry per day: the latest save wins (by created_at, then by position).
 * Returns copies with ISO dates, sorted oldest first. Rows with no usable
 * date are kept as they are, at the start.
 */
export function latestEntryPerDay<T extends DatedRow>(rows: T[]): T[] {
  const byDay = new Map<string, { row: T; time: number; index: number }>();
  const undated: T[] = [];

  rows.forEach((row, index) => {
    const day = normalizeStatDate(row.date, row.created_at);
    const copy = { ...row, date: day };
    if (!day) {
      undated.push(copy);
      return;
    }
    const time = row.created_at ? Date.parse(row.created_at) : Number.NaN;
    const current = byDay.get(day);
    const newer =
      !current ||
      (Number.isNaN(time) || Number.isNaN(current.time) ? index > current.index : time >= current.time);
    if (newer) byDay.set(day, { row: copy, time, index });
  });

  const dated = [...byDay.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([, entry]) => entry.row);
  return [...undated, ...dated];
}

/** Today's date in both formats a stats_history row for today might have been saved with. */
export function sameDayDateValues(now: Date = new Date()): [iso: string, legacyUS: string] {
  return [todayISO(now), now.toLocaleDateString("en-US")];
}
