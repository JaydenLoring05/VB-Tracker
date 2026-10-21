import { describe, expect, it } from "vitest";

import { buildResults, daysBetween, formatChange, formatShortDate } from "@/lib/resultsCard";
import type { StatEntry } from "@/types";

const entry = (date: string, fields: Partial<StatEntry>): StatEntry => ({
  date,
  vertical: "",
  approach: "",
  weight: "",
  pullups: "",
  sleep: "",
  energy: "",
  stress: "",
  soreness: "",
  kneePain: "",
  shoulderPain: "",
  lowerBackPain: "",
  anklePain: "",
  motivation: "",
  ...fields
});

describe("buildResults", () => {
  it("compares the first and latest test for each number", () => {
    const results = buildResults(
      [
        entry("2026-09-01", { vertical: 33, approach: 134 }),
        entry("2026-09-10", { sleep: 8 }),
        entry("2026-09-29", { vertical: 35, approach: 136, pullups: 12 })
      ],
      "2026-10-05"
    );
    expect(results.metrics.map((m) => [m.key, m.from, m.to, m.change])).toEqual([
      ["vertical", 33, 35, 2],
      ["approach", 134, 136, 2]
    ]);
    expect(results.lastTestDate).toBe("2026-09-29");
    expect(results.daysSinceLastTest).toBe(6);
    expect(results.retestDue).toBe(false);
    expect(results.daysUntilRetest).toBe(22);
  });

  it("says a retest is due with no tests or after 4 weeks", () => {
    expect(buildResults([], "2026-10-21").retestDue).toBe(true);
    expect(buildResults([entry("2026-09-20", { vertical: 30 })], "2026-10-18").retestDue).toBe(true);
  });

  it("needs two tests before showing a number", () => {
    expect(buildResults([entry("2026-10-01", { vertical: 30 })], "2026-10-02").metrics).toEqual([]);
  });
});

describe("helpers", () => {
  it("counts days and formats changes and dates", () => {
    expect(daysBetween("2026-10-01", "2026-10-29")).toBe(28);
    expect(formatChange(2, '"')).toBe('+2"');
    expect(formatChange(-1.5, '"')).toBe('−1.5"');
    expect(formatChange(0, "")).toBe("±0");
    expect(formatShortDate("2026-10-21")).toBe("Oct 21");
  });
});
