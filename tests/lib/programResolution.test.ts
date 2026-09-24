import { describe, expect, it } from "vitest";

import {
  dayOverrideKey,
  phaseSlug,
  resolveWorkoutDays,
  type TeamOverrideData
} from "@/lib/programResolution";
import type { WorkoutDay } from "@/types";

const days: WorkoutDay[] = [
  { day: "Monday", title: "Lower", minutes: "60", notes: "n", exercises: ["Back Squat", "Broad Jump"] },
  { day: "Tuesday", title: "Rest", minutes: "0", notes: "", rest: true, exercises: [] }
];

const team = (overrides: Partial<TeamOverrideData> = {}): TeamOverrideData => ({
  planTier: "pilot",
  exerciseDefaults: {},
  dayOverrides: {},
  ...overrides
});

describe("phaseSlug", () => {
  it.each([
    [1, "foundation"],
    [4, "foundation"],
    [5, "build"],
    [8, "build"],
    [9, "power"],
    [16, "power"],
    [17, "taper"],
    [20, "taper"]
  ])("week %i is %s", (week, phase) => {
    expect(phaseSlug(week)).toBe(phase);
  });

  it("builds override keys from phase and day", () => {
    expect(dayOverrideKey("power", "Monday")).toBe("power-Monday");
  });
});

describe("resolveWorkoutDays", () => {
  it("applies only the athlete's substitutions when there is no team", () => {
    const result = resolveWorkoutDays(days, 1, null, { "Back Squat": "Goblet Squat" });
    expect(result[0].exercises).toEqual(["Goblet Squat", "Broad Jump"]);
    expect(result[0].title).toBe("Lower");
  });

  it("does not mutate the plan it is given", () => {
    resolveWorkoutDays(days, 1, null, { "Back Squat": "Goblet Squat" });
    expect(days[0].exercises).toEqual(["Back Squat", "Broad Jump"]);
  });

  it("keeps rest days as they are", () => {
    const result = resolveWorkoutDays(days, 1, team(), {});
    expect(result[1]).toMatchObject({ day: "Tuesday", rest: true, exercises: [] });
  });

  it("pilot tier swaps in the team's per-exercise defaults", () => {
    const result = resolveWorkoutDays(days, 1, team({ exerciseDefaults: { "Back Squat": "Front Squat" } }), {});
    expect(result[0].exercises).toEqual(["Front Squat", "Broad Jump"]);
  });

  it("pilot tier ignores full-day overrides", () => {
    const result = resolveWorkoutDays(
      days,
      1,
      team({ dayOverrides: { "foundation-Monday": ["Only This"] } }),
      {}
    );
    expect(result[0].exercises).toEqual(["Back Squat", "Broad Jump"]);
  });

  it("paid tier replaces the whole day for the matching phase and day", () => {
    const paid = team({ planTier: "paid", dayOverrides: { "foundation-Monday": ["Only This"] } });

    expect(resolveWorkoutDays(days, 2, paid, {})[0].exercises).toEqual(["Only This"]);
    // Different phase: no override, plan applies.
    expect(resolveWorkoutDays(days, 6, paid, {})[0].exercises).toEqual(["Back Squat", "Broad Jump"]);
  });

  it("paid tier ignores per-exercise defaults", () => {
    const paid = team({ planTier: "paid", exerciseDefaults: { "Back Squat": "Front Squat" } });
    expect(resolveWorkoutDays(days, 1, paid, {})[0].exercises).toEqual(["Back Squat", "Broad Jump"]);
  });

  it("applies the athlete's substitution on top of the team's choice", () => {
    const pilot = team({ exerciseDefaults: { "Back Squat": "Front Squat" } });
    const result = resolveWorkoutDays(days, 1, pilot, { "Front Squat": "Leg Press", "Broad Jump": "Box Jump" });
    expect(result[0].exercises).toEqual(["Leg Press", "Box Jump"]);
  });

  it("lets a paid team override an empty list", () => {
    const paid = team({ planTier: "paid", dayOverrides: { "foundation-Monday": [] } });
    expect(resolveWorkoutDays(days, 1, paid, {})[0].exercises).toEqual([]);
  });
});
