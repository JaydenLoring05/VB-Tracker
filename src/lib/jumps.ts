import type { StatEntry } from "@/types";

/**
 * Jump PR tracking (G-04). New jumps are saved in `jump_tests`
 * (schema_v62), apart from the daily check-in, so logging a jump never
 * counts as a check-in or copies yesterday's soreness into today. Older
 * values typed into the stats form (stats_history.vertical / .approach) are
 * still read, so the chart and PRs include them.
 */

export type JumpKind = "vertical" | "approach";

export const JUMP_KINDS: { value: JumpKind; label: string; prName: string; hint: string }[] = [
  { value: "vertical", label: "Vertical", prName: "Vertical Jump", hint: "Standing jump, inches off the ground." },
  { value: "approach", label: "Approach touch", prName: "Approach Touch", hint: "Highest touch after your approach, in inches." }
];

export type JumpPoint = { date: string; value: number };

/** A row of `jump_tests`. */
export type JumpTest = { tested_on: string; kind: JumpKind; value_in: number };

/** Inches between 1 and 200 with at most one decimal (a touch is ~100-140 in), or null. */
export function parseInches(input: string): number | null {
  const trimmed = input.trim();
  if (!/^\d{1,3}(\.\d)?$/.test(trimmed)) return null;
  const value = Number(trimmed);
  return value >= 1 && value <= 200 ? value : null;
}

/**
 * Every logged value of one kind from both sources, oldest first, keeping the
 * best value per day (several attempts in one session count as one point).
 */
export function jumpSeries(history: StatEntry[], tests: JumpTest[], kind: JumpKind): JumpPoint[] {
  const byDay = new Map<string, number>();
  const add = (date: string, value: unknown) => {
    if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) return;
    byDay.set(date, Math.max(byDay.get(date) ?? 0, value));
  };
  history.forEach((entry) => add(entry.date, entry[kind]));
  tests.filter((test) => test.kind === kind).forEach((test) => add(test.tested_on, Number(test.value_in)));
  return [...byDay.entries()].map(([date, value]) => ({ date, value })).sort((a, b) => a.date.localeCompare(b.date));
}

export function bestJump(points: JumpPoint[]): number | null {
  return points.length > 0 ? Math.max(...points.map((point) => point.value)) : null;
}

/** The result of logging `value` now, compared with every earlier point (today's included). */
export function jumpResult(points: JumpPoint[], value: number): { isPR: boolean; previousBest: number | null; gain: number | null } {
  const previousBest = bestJump(points);
  if (previousBest === null) return { isPR: true, previousBest: null, gain: null };
  const isPR = value > previousBest;
  return { isPR, previousBest, gain: isPR ? Math.round((value - previousBest) * 10) / 10 : null };
}
