import { describe, expect, it } from "vitest";

import {
  PERSONAL_EVENT_LOAD,
  TEAM_EVENT_LOAD,
  computeTrainingLoad,
  teamEventLoad
} from "@/lib/trainingLoad";

const TODAY = "2026-10-08";

describe("teamEventLoad", () => {
  it("weighs team events on the same scale as personal ones", () => {
    expect(teamEventLoad("practice")).toBe(PERSONAL_EVENT_LOAD.practice);
    expect(teamEventLoad("match")).toBe(PERSONAL_EVENT_LOAD.game);
  });

  it("ranks a tournament above a single match and playoffs above a regular match", () => {
    expect(teamEventLoad("tournament")).toBeGreaterThan(teamEventLoad("match"));
    expect(teamEventLoad("playoffs")).toBeGreaterThan(teamEventLoad("match"));
  });

  it("gives travel a small load and testing roughly a workout", () => {
    expect(teamEventLoad("travel")).toBe(1);
    expect(teamEventLoad("testing")).toBe(PERSONAL_EVENT_LOAD.workout);
  });

  it("has a weight for every team event type", () => {
    for (const type of ["practice", "match", "tournament", "travel", "testing", "playoffs"] as const) {
      expect(TEAM_EVENT_LOAD[type]).toBeTypeOf("number");
    }
  });
});

describe("computeTrainingLoad", () => {
  it("is 0 with no events", () => {
    expect(computeTrainingLoad({ personal: [], team: [], today: TODAY })).toBe(0);
  });

  it("matches the old personal-only total when there are no team events", () => {
    const personal = [
      { date: "2026-10-07", type: "workout" as const },
      { date: "2026-10-06", type: "practice" as const },
      { date: "2026-10-05", type: "game" as const },
      { date: "2026-10-04", type: "recovery" as const },
      { date: "2026-10-03", type: "rest" as const }
    ];
    expect(computeTrainingLoad({ personal, team: [], today: TODAY })).toBe(3 + 4 + 5 + 1 + 0);
  });

  it("adds team events", () => {
    const team = [
      { date: "2026-10-07", type: "practice" as const },
      { date: "2026-10-05", type: "tournament" as const }
    ];
    expect(computeTrainingLoad({ personal: [], team, today: TODAY })).toBe(4 + TEAM_EVENT_LOAD.tournament);
  });

  it("only counts the last 7 days through today, inclusive", () => {
    const team = [
      { date: "2026-10-01", type: "match" as const }, // exactly 7 days ago: counted
      { date: "2026-09-30", type: "match" as const }, // 8 days ago: not counted
      { date: "2026-10-08", type: "practice" as const }, // today: counted
      { date: "2026-10-09", type: "match" as const } // tomorrow: not counted
    ];
    expect(computeTrainingLoad({ personal: [], team, today: TODAY })).toBe(5 + 4);
  });

  it("does not double count a personal practice on a team practice day", () => {
    const personal = [{ date: "2026-10-07", type: "practice" as const }];
    const team = [{ date: "2026-10-07", type: "practice" as const }];
    expect(computeTrainingLoad({ personal, team, today: TODAY })).toBe(4);
  });

  it("does not double count a personal game on a team match, tournament or playoff day", () => {
    for (const type of ["match", "tournament", "playoffs"] as const) {
      const personal = [{ date: "2026-10-07", type: "game" as const }];
      const team = [{ date: "2026-10-07", type }];
      expect(computeTrainingLoad({ personal, team, today: TODAY })).toBe(TEAM_EVENT_LOAD[type]);
    }
  });

  it("still counts a personal workout on a team practice day (it is extra work)", () => {
    const personal = [{ date: "2026-10-07", type: "workout" as const }];
    const team = [{ date: "2026-10-07", type: "practice" as const }];
    expect(computeTrainingLoad({ personal, team, today: TODAY })).toBe(3 + 4);
  });

  it("still counts a personal practice on a travel day", () => {
    const personal = [{ date: "2026-10-07", type: "practice" as const }];
    const team = [{ date: "2026-10-07", type: "travel" as const }];
    expect(computeTrainingLoad({ personal, team, today: TODAY })).toBe(4 + 1);
  });
});
