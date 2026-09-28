import { StatEntry } from "@/types";

type HeadlineKey = "vertical" | "approach" | "pullups";

export type HeadlineMetric = {
  key: HeadlineKey;
  label: string;
  unit: string;
  /** Newest logged value, or null if this metric was never logged. */
  value: number | null;
  /** Newest minus first logged value; null until there are two values. */
  change: number | null;
  /** Date of the first logged value that `change` is measured from. */
  since: string | null;
};

const HEADLINE_METRICS: { key: HeadlineKey; label: string; unit: string }[] = [
  { key: "vertical", label: "Vertical", unit: "in" },
  { key: "approach", label: "Approach touch", unit: "in" },
  { key: "pullups", label: "Pull-ups", unit: "reps" }
];

/**
 * The few numbers shown at the top of the Stats page. `history` is oldest
 * first (the order the tracker appends entries in), and each metric skips
 * entries where it was left blank.
 */
export function statsHeadline(history: StatEntry[]): HeadlineMetric[] {
  return HEADLINE_METRICS.map(({ key, label, unit }) => {
    const logged = history.filter((item) => typeof item[key] === "number" && Number.isFinite(item[key]));
    const first = logged[0];
    const last = logged[logged.length - 1];
    const value = last ? (last[key] as number) : null;
    const hasChange = logged.length > 1;

    return {
      key,
      label,
      unit,
      value,
      change: hasChange ? Math.round(((last[key] as number) - (first[key] as number)) * 10) / 10 : null,
      since: hasChange ? first.date : null
    };
  });
}
