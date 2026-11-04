import { describe, expect, it } from "vitest";

import { challengeForWeek, challengePercent, leaderboardLabel, weekStartFor } from "@/lib/challenge";

describe("weekStartFor (G-06)", () => {
  it("finds the Monday of the week", () => {
    expect(weekStartFor("2026-11-04")).toBe("2026-11-02"); // Wednesday
    expect(weekStartFor("2026-11-02")).toBe("2026-11-02"); // Monday
    expect(weekStartFor("2026-11-08")).toBe("2026-11-02"); // Sunday
    expect(weekStartFor("2026-11-09")).toBe("2026-11-09");
    expect(weekStartFor("")).toBe("");
  });
});

describe("challengeForWeek", () => {
  it("gives everyone the same challenge for a week", () => {
    const challenge = challengeForWeek("2026-11-02");
    expect(challenge).not.toBeNull();
    expect(challenge?.id).toBe(`2026-11-02-${challenge?.metric}`);
  });

  it("rotates jumps and workouts week to week", () => {
    const metrics = ["2026-11-02", "2026-11-09", "2026-11-16", "2026-11-23"].map((week) => challengeForWeek(week)?.metric);
    expect(new Set(metrics)).toEqual(new Set(["jumps", "workouts"]));
    expect(metrics[0]).not.toBe(metrics[1]);
  });

  it("includes a 100 jumps week", () => {
    const titles = Array.from({ length: 4 }, (_, i) => challengeForWeek(`2026-11-${String(2 + i * 7).padStart(2, "0")}`)?.title);
    expect(titles).toContain("100 jumps this week");
  });
});

describe("challengePercent", () => {
  it("caps at 0 and 100", () => {
    expect(challengePercent(40, 100)).toBe(40);
    expect(challengePercent(130, 100)).toBe(100);
    expect(challengePercent(-5, 100)).toBe(0);
    expect(challengePercent(3, 0)).toBe(0);
  });
});

describe("leaderboardLabel", () => {
  it("shows a first name and last initial only", () => {
    expect(leaderboardLabel("Ava Thompson")).toBe("Ava T.");
    expect(leaderboardLabel("  maria de la cruz ")).toBe("maria C.");
    expect(leaderboardLabel("Jayden")).toBe("Jayden");
    expect(leaderboardLabel("")).toBe("Athlete");
    expect(leaderboardLabel(null)).toBe("Athlete");
  });
});
