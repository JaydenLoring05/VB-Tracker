import { describe, expect, it } from "vitest";

import { computeTeamStreak, teamStreakNeeded } from "@/lib/teamStreak";

// Local noon, so todayISO() (local date) is unambiguous in any time zone.
const NOW = new Date(2026, 9, 2, 12, 0, 0);
const day = (offset: number) => {
  const date = new Date(NOW);
  date.setDate(date.getDate() - offset);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

describe("teamStreakNeeded", () => {
  it("is half the team, rounded up, and at least 1", () => {
    expect(teamStreakNeeded(0)).toBe(1);
    expect(teamStreakNeeded(1)).toBe(1);
    expect(teamStreakNeeded(12)).toBe(6);
    expect(teamStreakNeeded(35)).toBe(18);
  });
});

describe("computeTeamStreak", () => {
  it("counts consecutive days where at least half the team checked in", () => {
    const checkIns = {
      a: [day(0), day(1), day(2), day(4)],
      b: [day(0), day(1), day(2)],
      c: [day(1)],
      d: []
    };
    // 4 athletes, need 2: today 2, yesterday 3, 2 days ago 2, 3 days ago 0.
    expect(computeTeamStreak(checkIns, 4, NOW)).toEqual({ days: 3, today: 2, needed: 2, athleteCount: 4 });
  });

  it("runs through yesterday while today isn't reached yet", () => {
    const checkIns = { a: [day(0), day(1), day(2)], b: [day(1), day(2)], c: [], d: [] };
    expect(computeTeamStreak(checkIns, 4, NOW)).toMatchObject({ days: 2, today: 1 });
  });

  it("is 0 when yesterday missed too", () => {
    const checkIns = { a: [day(2)], b: [day(2)] };
    expect(computeTeamStreak(checkIns, 2, NOW).days).toBe(0);
  });

  it("counts an athlete once per day", () => {
    const checkIns = { a: [day(0), day(0), day(0)], b: [] , c: [], d: []};
    expect(computeTeamStreak(checkIns, 4, NOW)).toMatchObject({ days: 0, today: 1 });
  });

  it("is 0 with no athletes", () => {
    expect(computeTeamStreak({}, 0, NOW)).toEqual({ days: 0, today: 0, needed: 1, athleteCount: 0 });
  });
});
