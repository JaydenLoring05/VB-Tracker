import { describe, expect, it } from "vitest";

import { emptyStats } from "@/context/TrackerContext";
import { bestJump, jumpResult, jumpSeries, parseInches, type JumpTest } from "@/lib/jumps";
import type { StatEntry } from "@/types";

const entry = (date: string, vertical: number | "", approach: number | "" = ""): StatEntry => ({
  ...emptyStats,
  date,
  vertical,
  approach
});

const HISTORY = [entry("2026-10-20", 22, 118), entry("2026-10-01", 20.5), entry("2026-10-10", "")];
const TESTS: JumpTest[] = [
  { tested_on: "2026-10-27", kind: "vertical", value_in: 21.5 },
  { tested_on: "2026-10-27", kind: "vertical", value_in: 22.5 },
  { tested_on: "2026-10-28", kind: "approach", value_in: 120 }
];

describe("parseInches", () => {
  it("takes inches with one decimal", () => {
    expect(parseInches("24")).toBe(24);
    expect(parseInches(" 121.5 ")).toBe(121.5);
  });

  it("rejects nonsense", () => {
    for (const input of ["", "0", "201", "12.25", "abc", "-5"]) expect(parseInches(input), input).toBeNull();
  });
});

describe("jumpSeries (G-04)", () => {
  it("merges old stats entries and new jump tests, oldest first, skipping blanks", () => {
    expect(jumpSeries(HISTORY, TESTS, "vertical")).toEqual([
      { date: "2026-10-01", value: 20.5 },
      { date: "2026-10-20", value: 22 },
      { date: "2026-10-27", value: 22.5 }
    ]);
    expect(jumpSeries(HISTORY, TESTS, "approach").map((p) => p.value)).toEqual([118, 120]);
  });

  it("keeps the best attempt of a day", () => {
    expect(jumpSeries([], TESTS, "vertical")).toEqual([{ date: "2026-10-27", value: 22.5 }]);
  });

  it("finds the best", () => {
    expect(bestJump(jumpSeries(HISTORY, TESTS, "vertical"))).toBe(22.5);
    expect(bestJump([])).toBeNull();
  });
});

describe("jumpResult", () => {
  const points = jumpSeries(HISTORY, TESTS, "vertical");

  it("is a PR when it beats every earlier jump", () => {
    expect(jumpResult(points, 24)).toEqual({ isPR: true, previousBest: 22.5, gain: 1.5 });
  });

  it("isn't a PR when it ties or falls short", () => {
    expect(jumpResult(points, 22.5)).toMatchObject({ isPR: false, gain: null });
  });

  it("counts the first ever jump as a PR", () => {
    expect(jumpResult([], 110)).toEqual({ isPR: true, previousBest: null, gain: null });
  });
});
