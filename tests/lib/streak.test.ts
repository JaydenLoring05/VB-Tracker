import { describe, expect, it } from "vitest";

import { computeStreak, MAX_FREEZES } from "@/lib/streak";

// 2026-11-02 is a Monday.
function days(start: string, n: number): string[] {
  const t = Date.parse(`${start}T00:00:00Z`);
  return Array.from({ length: n }, (_, i) => new Date(t + i * 86_400_000).toISOString().slice(0, 10));
}

describe("computeStreak (G-01)", () => {
  it("is empty with no workouts", () => {
    expect(computeStreak([], "2026-11-04")).toEqual({ current: 0, freezes: 0, frozenDays: [], trainedToday: false, frozeYesterday: false });
  });

  it("counts days in a row, through today", () => {
    expect(computeStreak(days("2026-11-02", 3), "2026-11-04")).toMatchObject({ current: 3, trainedToday: true });
  });

  it("doesn't break before today is over", () => {
    expect(computeStreak(days("2026-11-02", 2), "2026-11-04")).toMatchObject({ current: 2, trainedToday: false });
  });

  it("resets after a missed day with no freeze", () => {
    expect(computeStreak(["2026-11-02", "2026-11-03", "2026-11-05"], "2026-11-05")).toMatchObject({ current: 1 });
  });

  it("earns a freeze for a week with 3+ workouts, credited after Sunday", () => {
    // Mon-Wed trained, then nothing through Sunday: the streak broke on Thursday, before the freeze arrived.
    expect(computeStreak(days("2026-11-02", 3), "2026-11-09")).toMatchObject({ current: 0, freezes: 1 });
  });

  it("spends a freeze on a missed day and keeps the streak", () => {
    const week1 = days("2026-11-02", 7); // Mon-Sun, all trained: earns a freeze
    const result = computeStreak([...week1, "2026-11-10"], "2026-11-10"); // miss Mon 9th, train Tue 10th
    expect(result).toMatchObject({ current: 8, freezes: 0, frozenDays: ["2026-11-09"] });
  });

  it("says when a freeze saved the streak yesterday", () => {
    const week1 = days("2026-11-02", 7);
    expect(computeStreak(week1, "2026-11-10")).toMatchObject({ current: 7, frozeYesterday: true });
    expect(computeStreak([...week1, "2026-11-10"], "2026-11-11")).toMatchObject({ frozeYesterday: false });
  });

  it("banks at most two freezes", () => {
    const result = computeStreak(days("2026-10-05", 35), "2026-11-08");
    expect(result.freezes).toBe(MAX_FREEZES);
    expect(result.current).toBe(35);
  });

  it("ignores future and malformed dates", () => {
    expect(computeStreak(["2026-11-04", "2026-12-01", "nope"], "2026-11-04")).toMatchObject({ current: 1 });
    expect(computeStreak(["2026-11-04"], "")).toMatchObject({ current: 0 });
  });

  it("counts a two-workout day once", () => {
    expect(computeStreak(["2026-11-04", "2026-11-04"], "2026-11-04")).toMatchObject({ current: 1 });
  });
});
