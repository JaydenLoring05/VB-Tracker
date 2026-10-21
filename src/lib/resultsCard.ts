import { StatEntry } from "@/types";

/**
 * 4-week results (F-36): first test vs latest test for the jump numbers and
 * pull-ups, plus when the next retest is due. Pure so it's easy to test.
 */

export const RETEST_DAYS = 28;

export type ResultMetric = "vertical" | "approach" | "pullups";

export const RESULT_METRICS: { key: ResultMetric; label: string; unit: string }[] = [
  { key: "vertical", label: "Vertical", unit: '"' },
  { key: "approach", label: "Approach touch", unit: '"' },
  { key: "pullups", label: "Pull-ups", unit: "" }
];

export type MetricResult = {
  key: ResultMetric;
  label: string;
  unit: string;
  from: number;
  to: number;
  change: number;
  fromDate: string;
  toDate: string;
};

export type Results = {
  metrics: MetricResult[];
  lastTestDate: string | null;
  daysSinceLastTest: number | null;
  retestDue: boolean;
  daysUntilRetest: number | null;
};

function valueOf(entry: StatEntry, key: ResultMetric): number | null {
  const raw = entry[key];
  if (raw === "" || raw === null || raw === undefined) return null;
  const value = Number(raw);
  return Number.isFinite(value) && value > 0 ? value : null;
}

export function daysBetween(fromISO: string, toISO: string): number {
  const from = Date.parse(`${fromISO}T00:00:00Z`);
  const to = Date.parse(`${toISO}T00:00:00Z`);
  return Math.round((to - from) / 86_400_000);
}

/** History is one entry per day, oldest first (see src/lib/statsHistory.ts). */
export function buildResults(history: StatEntry[], today: string): Results {
  const dated = history.filter((entry) => /^\d{4}-\d{2}-\d{2}$/.test(entry.date));

  const metrics: MetricResult[] = [];
  RESULT_METRICS.forEach(({ key, label, unit }) => {
    const tests = dated.filter((entry) => valueOf(entry, key) !== null);
    if (tests.length < 2) return;
    const first = tests[0];
    const last = tests[tests.length - 1];
    const from = valueOf(first, key)!;
    const to = valueOf(last, key)!;
    metrics.push({
      key,
      label,
      unit,
      from,
      to,
      change: Math.round((to - from) * 10) / 10,
      fromDate: first.date,
      toDate: last.date
    });
  });

  const jumpTests = dated.filter((entry) => valueOf(entry, "vertical") !== null || valueOf(entry, "approach") !== null);
  const lastTestDate = jumpTests.length > 0 ? jumpTests[jumpTests.length - 1].date : null;
  const daysSinceLastTest = lastTestDate ? daysBetween(lastTestDate, today) : null;

  return {
    metrics,
    lastTestDate,
    daysSinceLastTest,
    retestDue: daysSinceLastTest === null || daysSinceLastTest >= RETEST_DAYS,
    daysUntilRetest: daysSinceLastTest === null ? null : Math.max(0, RETEST_DAYS - daysSinceLastTest)
  };
}

export function formatChange(change: number, unit: string): string {
  if (change === 0) return `±0${unit}`;
  return `${change > 0 ? "+" : "−"}${Math.abs(change)}${unit}`;
}

export function formatShortDate(iso: string): string {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day)).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC"
  });
}
