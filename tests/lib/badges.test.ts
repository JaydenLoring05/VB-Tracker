import { describe, expect, it } from "vitest";

import { BADGES, bestStreak, earnedBadges, hasPerfectWeek, isJumpPR, newlyEarned } from "@/lib/badges";

/** n consecutive ISO dates starting at start. */
function run(start: string, n: number): string[] {
  const d = new Date(`${start}T12:00:00Z`);
  return Array.from({ length: n }, (_, i) => new Date(d.getTime() + i * 86_400_000).toISOString().slice(0, 10));
}

describe("bestStreak", () => {
  it("finds the longest run of consecutive days", () => {
    expect(bestStreak([...run("2026-10-01", 3), ...run("2026-10-10", 5)])).toBe(5);
  });

  it("counts a two-workout day once and ignores order", () => {
    expect(bestStreak(["2026-10-03", "2026-10-01", "2026-10-02", "2026-10-02"])).toBe(3);
  });

  it("is 0 with no workouts", () => {
    expect(bestStreak([])).toBe(0);
  });

  it("crosses month ends", () => {
    expect(bestStreak(run("2026-10-30", 4))).toBe(4);
  });
});

describe("hasPerfectWeek", () => {
  it("needs the plan's training days inside one Monday-to-Sunday week", () => {
    // 2026-11-02 is a Monday.
    expect(hasPerfectWeek(["2026-11-02", "2026-11-04", "2026-11-06", "2026-11-07"], 4)).toBe(true);
    expect(hasPerfectWeek(["2026-11-02", "2026-11-04", "2026-11-06"], 4)).toBe(false);
  });

  it("doesn't let two weeks add up to one", () => {
    // Sat + Sun, then Mon + Tue of the next week.
    expect(hasPerfectWeek(["2026-11-07", "2026-11-08", "2026-11-09", "2026-11-10"], 4)).toBe(false);
  });

  it("asks for at least 3 days even if the plan has fewer", () => {
    expect(hasPerfectWeek(["2026-11-02", "2026-11-03"], 2)).toBe(false);
    expect(hasPerfectWeek(["2026-11-02", "2026-11-03", "2026-11-04"], 2)).toBe(true);
  });
});

describe("isJumpPR", () => {
  it("knows jump PRs from lift PRs", () => {
    expect(isJumpPR({ exercise: "Vertical Jump", unit: "in" })).toBe(true);
    expect(isJumpPR({ exercise: "Approach touch", unit: "in" })).toBe(true);
    expect(isJumpPR({ exercise: "Box Jumps" })).toBe(true);
    expect(isJumpPR({ exercise: "Front Squat", unit: "lbs" })).toBe(false);
  });
});

describe("earnedBadges (G-03)", () => {
  it("has every badge Jayden asked for", () => {
    expect(BADGES.map((badge) => badge.id).sort()).toEqual(
      ["first-workout", "jump-pr", "perfect-week", "streak-30", "streak-7", "workouts-50"].sort()
    );
  });

  it("gives nothing before the first workout", () => {
    expect(earnedBadges({ workoutDates: [], prs: [], trainingDaysPerWeek: 5 })).toEqual([]);
  });

  it("gives First Rep after one workout", () => {
    expect(earnedBadges({ workoutDates: ["2026-11-02"], prs: [], trainingDaysPerWeek: 5 })).toEqual(["first-workout"]);
  });

  it("gives streak, perfect week, jump PR and 50 workouts badges", () => {
    const dates = [...run("2026-09-01", 30), ...run("2026-10-05", 20)];
    expect(
      earnedBadges({ workoutDates: dates, prs: [{ exercise: "Vertical Jump", unit: "in" }], trainingDaysPerWeek: 6 })
    ).toEqual(["first-workout", "streak-7", "perfect-week", "jump-pr", "streak-30", "workouts-50"]);
  });
});

describe("newlyEarned", () => {
  it("lists only badges not celebrated yet", () => {
    expect(newlyEarned(["first-workout", "streak-7"], ["first-workout"])).toEqual(["streak-7"]);
    expect(newlyEarned(["first-workout"], ["first-workout"])).toEqual([]);
  });
});
