import { describe, expect, it } from "vitest";

import { buildTeamProgress } from "@/lib/teamProgress";
import type { RosterAthlete, StatEntry } from "@/types";

function athlete(userId: string, overrides: Partial<RosterAthlete> = {}): RosterAthlete {
  return {
    userId,
    displayName: userId,
    joinedAt: "2026-01-01T00:00:00Z",
    recovery: 80,
    recoveryLabel: "Good",
    lastCheckIn: "2026-07-20T08:00:00Z",
    needsCheckIn: false,
    lastActiveAt: null,
    ...overrides
  };
}

function stat(date: string, vertical: number | ""): StatEntry {
  return {
    date,
    vertical,
    approach: "",
    weight: "",
    pullups: "",
    sleep: 8,
    energy: 8,
    stress: 2,
    soreness: 2,
    kneePain: 0,
    shoulderPain: 0,
    lowerBackPain: 0,
    anklePain: 0,
    motivation: 8
  };
}

describe("buildTeamProgress: athletes", () => {
  it("reports each athlete's latest vertical and the change since their first logged one", () => {
    const { athletes } = buildTeamProgress(
      [athlete("ava")],
      { ava: [stat("2026-06-01", 22), stat("2026-06-15", ""), stat("2026-07-20", 24.5)] },
      {},
      {}
    );

    expect(athletes[0]).toMatchObject({ verticalLatest: 24.5, verticalChange: 2.5 });
  });

  it("has no vertical change with only one logged vertical", () => {
    const { athletes } = buildTeamProgress([athlete("ava")], { ava: [stat("2026-07-20", 24)] }, {}, {});
    expect(athletes[0]).toMatchObject({ verticalLatest: 24, verticalChange: null });
  });

  it("has no vertical at all when none was logged", () => {
    const { athletes } = buildTeamProgress([athlete("ava")], { ava: [stat("2026-07-20", "")] }, {}, {});
    expect(athletes[0]).toMatchObject({ verticalLatest: null, verticalChange: null });
  });

  it("uses the roster's readiness, and none for an athlete who never checked in", () => {
    const { athletes } = buildTeamProgress(
      [athlete("ava", { recovery: 88, recoveryLabel: "Elite" }), athlete("new", { lastCheckIn: null, recovery: 0 })],
      {},
      {},
      {}
    );

    expect(athletes.find((row) => row.userId === "ava")).toMatchObject({ readiness: 88, readinessLabel: "Elite" });
    expect(athletes.find((row) => row.userId === "new")).toMatchObject({ readiness: null, readinessLabel: null });
  });

  it("counts workouts and PRs from the last 7 days and names the newest PR", () => {
    const { athletes } = buildTeamProgress(
      [athlete("ava")],
      {},
      { ava: 3 },
      {
        ava: [
          { exercise: "Back Squat", date: "2026-07-15T10:00:00Z" },
          { exercise: "Vertical Jump", date: "2026-07-19T10:00:00Z" }
        ]
      }
    );

    expect(athletes[0]).toMatchObject({ workoutsLast7: 3, prsLast7: 2, latestPR: "Vertical Jump" });
  });

  it("lists athletes alphabetically", () => {
    const { athletes } = buildTeamProgress(
      [athlete("z", { displayName: "Zoe" }), athlete("a", { displayName: "Ava" }), athlete("m", { displayName: "maya" })],
      {},
      {},
      {}
    );

    expect(athletes.map((row) => row.displayName)).toEqual(["Ava", "maya", "Zoe"]);
  });
});

describe("buildTeamProgress: summary", () => {
  it("averages the vertical change over athletes who have one and totals the week", () => {
    const { summary } = buildTeamProgress(
      [athlete("a"), athlete("b"), athlete("c")],
      {
        a: [stat("2026-06-01", 20), stat("2026-07-20", 22)],
        b: [stat("2026-06-01", 25), stat("2026-07-20", 24)],
        c: [stat("2026-07-20", 30)]
      },
      { a: 3, b: 1 },
      { a: [{ exercise: "Vertical Jump", date: "2026-07-19T10:00:00Z" }] }
    );

    expect(summary).toEqual({
      avgVerticalChange: 0.5,
      improvingCount: 1,
      verticalTrackedCount: 2,
      workoutsLast7: 4,
      prsLast7: 1
    });
  });

  it("has no average vertical change when nobody has two verticals", () => {
    expect(buildTeamProgress([athlete("a")], {}, {}, {}).summary.avgVerticalChange).toBeNull();
  });
});
