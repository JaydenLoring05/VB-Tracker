import { describe, expect, it } from "vitest";

import { getWorkoutDays } from "@/data/workoutPlan";
import { resolveWorkoutDays } from "@/lib/programResolution";
import {
  adaptWorkoutDays,
  checkInSoreAreas,
  countAdaptations,
  DEFAULT_TRAINING_PROFILE,
  parseTrainingProfile,
  profileFromRow,
  profileToRow,
  scaleTargetForLevel,
  withCheckInAreas
} from "@/lib/trainingProfile";
import type { WorkoutDay } from "@/types";

const day = (exercises: string[], extra: Partial<WorkoutDay> = {}): WorkoutDay => ({
  day: "Monday",
  title: "Lower Body",
  minutes: "60",
  notes: "",
  exercises,
  ...extra
});

describe("adaptWorkoutDays", () => {
  it("leaves the plan untouched for intermediate with no injuries", () => {
    const days = [day(["Box Jumps", "Front Squat"])];
    expect(adaptWorkoutDays(days, 1, DEFAULT_TRAINING_PROFILE)).toBe(days);
  });

  it("swaps jumping out and adds knee rehab for a sore knee", () => {
    const [result] = adaptWorkoutDays([day(["Box Jumps", "Pogo Hops", "Pull-Ups"])], 1, {
      level: "intermediate",
      injuries: ["knee"]
    });
    expect(result.exercises).toEqual([
      "Hip Thrust",
      "Single-Leg Calf Raise",
      "Pull-Ups",
      "Spanish Squat",
      "Tibialis Raises"
    ]);
    expect(result.adaptNotes?.["Hip Thrust"]).toBe("Knee-friendly swap for Box Jumps");
    expect(result.adaptNotes?.["Spanish Squat"]).toBe("Added for your knee");
  });

  it("picks the next option when the first swap is already in the day", () => {
    const [result] = adaptWorkoutDays([day(["Box Jumps", "Hip Thrust"])], 1, {
      level: "intermediate",
      injuries: ["knee"]
    });
    expect(result.exercises.slice(0, 2)).toEqual(["Glute Bridge", "Hip Thrust"]);
  });

  it("keeps overhead and hanging work out for a sore shoulder", () => {
    const [result] = adaptWorkoutDays(
      [day(["Pull-Ups", "Landmine Press or DB Shoulder Press", "Hanging Leg Raises"])],
      1,
      { level: "intermediate", injuries: ["shoulder"] }
    );
    expect(result.exercises).toEqual([
      "Lat Pulldown",
      "Half-Kneeling Landmine Press",
      "Dead Bugs",
      "External Rotations",
      "Band Pull-Aparts"
    ]);
  });

  it("gives beginners easier versions and fewer sets", () => {
    const [result] = adaptWorkoutDays([day(["Front Squat", "Pull-Ups"])], 1, {
      level: "beginner",
      injuries: []
    });
    expect(result.exercises).toEqual(["Goblet Squat", "Band-Assisted Pull-Up"]);
    expect(result.targets?.["Goblet Squat"]).toBe("2x10");
    expect(result.adaptNotes?.["Goblet Squat"]).toBe("Beginner version of Front Squat");
  });

  it("never lets an advanced upgrade bring back what an injury rules out", () => {
    const [result] = adaptWorkoutDays([day(["Goblet Squat"])], 1, { level: "advanced", injuries: ["knee"] });
    expect(result.exercises[0]).not.toBe("Front Squat");
    expect(result.adaptNotes?.[result.exercises[0]]).toMatch(/Goblet Squat/);
  });

  it("does not add rehab work to rest or mobility days", () => {
    const days = [
      day([], { rest: true, title: "Rest" }),
      day(["Full-Body Mobility Flow"], { title: "Mobility + Movement Prep" })
    ];
    const result = adaptWorkoutDays(days, 1, { level: "intermediate", injuries: ["knee"] });
    expect(result[0].exercises).toEqual([]);
    expect(result[1].exercises).toEqual(["Full-Body Mobility Flow"]);
  });

  it("keeps a coach's exercises and targets for level but still applies injury swaps", () => {
    const coachDay = day(["Front Squat", "Box Jumps"], { targets: { "Front Squat": "5x3", "Box Jumps": "4x3" } });
    const [result] = adaptWorkoutDays([coachDay], 1, { level: "beginner", injuries: ["knee"] }, { coachProgram: true });
    expect(result.exercises[0]).toBe("Goblet Squat");
    expect(result.targets?.["Goblet Squat"]).toBe("5x3");
    expect(result.targets?.["Hip Thrust"]).toBe("4x3");
  });

  it("adapts the real plan for every phase without duplicates", () => {
    for (const week of [1, 6, 12, 18]) {
      const result = adaptWorkoutDays(getWorkoutDays(week), week, {
        level: "advanced",
        injuries: ["knee", "shoulder", "lowerBack", "ankle"]
      });
      result.forEach((d) => expect(new Set(d.exercises).size).toBe(d.exercises.length));
      expect(countAdaptations(result)).toBeGreaterThan(0);
    }
  });
});

describe("scaleTargetForLevel", () => {
  it.each([
    ["2-3x10", "beginner", "2x10"],
    ["4x6", "beginner", "3x6"],
    ["2x8", "beginner", "2x8"],
    ["3x20-30 sec", "beginner", "2x20-30 sec"],
    ["2-3x10", "advanced", "3x10"],
    ["4x6", "advanced", "4x6"],
    ["10-20 min", "beginner", "10-20 min"],
    ["2-3x10", "intermediate", "2-3x10"]
  ] as const)("%s for %s is %s", (target, level, expected) => {
    expect(scaleTargetForLevel(target, level)).toBe(expected);
  });
});

describe("parseTrainingProfile", () => {
  it("falls back to the default for junk", () => {
    expect(parseTrainingProfile(null)).toEqual(DEFAULT_TRAINING_PROFILE);
    expect(parseTrainingProfile({ level: "elite", injuries: ["toe", "knee"], ageGroup: "baby" })).toEqual({
      level: "intermediate",
      injuries: ["knee"],
      ageGroup: null
    });
  });
});

describe("resolveWorkoutDays with a profile", () => {
  it("lets the athlete's own swap override an injury swap", () => {
    const result = resolveWorkoutDays([day(["Box Jumps"])], 1, null, { "Hip Thrust": "Glute Bridge" }, {
      level: "intermediate",
      injuries: ["knee"]
    });
    expect(result[0].exercises[0]).toBe("Glute Bridge");
    expect(result[0].adaptNotes?.["Glute Bridge"]).toBeUndefined();
  });

  it("adapts after the team's defaults so a coach default can't undo an injury swap", () => {
    const team = { planTier: "pilot" as const, exerciseDefaults: { "Hip Thrust": "Box Jumps" }, dayOverrides: {} };
    const result = resolveWorkoutDays([day(["Hip Thrust"])], 1, team, {}, { level: "intermediate", injuries: ["knee"] });
    expect(result[0].exercises).not.toContain("Box Jumps");
  });
});

describe("check-in sore areas (F-33)", () => {
  const stats = (overrides: Record<string, unknown> = {}) => ({
    date: "2026-10-21",
    kneePain: 0 as number | "",
    shoulderPain: 0 as number | "",
    lowerBackPain: 0 as number | "",
    anklePain: 0 as number | "",
    ...overrides
  });

  it("flags areas at or above the threshold on today's check-in", () => {
    expect(checkInSoreAreas(stats({ kneePain: 4, anklePain: 7, shoulderPain: 3 }), "2026-10-21")).toEqual([
      "knee",
      "ankle"
    ]);
  });

  it("ignores a check-in from another day and blank answers", () => {
    expect(checkInSoreAreas(stats({ kneePain: 9 }), "2026-10-22")).toEqual([]);
    expect(checkInSoreAreas(stats({ kneePain: "" }), "2026-10-21")).toEqual([]);
    expect(checkInSoreAreas(null, "2026-10-21")).toEqual([]);
  });

  it("adds check-in areas without dropping saved ones or duplicating", () => {
    const saved = { level: "advanced" as const, injuries: ["knee" as const] };
    expect(withCheckInAreas(saved, ["knee", "shoulder"])).toMatchObject({
      level: "advanced",
      injuries: ["knee", "shoulder"]
    });
    expect(withCheckInAreas(saved, ["knee"])).toBe(saved);
  });

  it("makes the plan adapt even from the default profile", () => {
    const profile = withCheckInAreas(DEFAULT_TRAINING_PROFILE, ["knee"]);
    const [result] = adaptWorkoutDays([day(["Box Jumps"])], 1, profile);
    expect(result.exercises[0]).toBe("Hip Thrust");
  });
});

describe("profile on the account (F-34)", () => {
  it("round-trips through a profiles row", () => {
    const profile = { level: "advanced" as const, injuries: ["knee" as const, "ankle" as const], ageGroup: "18plus" as const };
    expect(profileToRow(profile)).toEqual({ training_level: "advanced", sore_areas: ["knee", "ankle"], age_group: "18plus" });
    expect(profileFromRow(profileToRow(profile))).toEqual(profile);
  });

  it("treats a row with no level as never set", () => {
    expect(profileFromRow({ training_level: null, sore_areas: [], age_group: null })).toBeNull();
    expect(profileFromRow(null)).toBeNull();
  });

  it("drops values the database wouldn't allow", () => {
    expect(profileToRow({ level: "beginner", injuries: ["knee", "toe" as never], ageGroup: null }).sore_areas).toEqual([
      "knee"
    ]);
  });
});

describe("youth version (F-35)", () => {
  it("swaps heavy lifts and depth jumps and adds landing practice", () => {
    const [result] = adaptWorkoutDays([day(["Front Squat", "Depth Drops", "Box Jumps"])], 1, {
      level: "intermediate",
      injuries: [],
      ageGroup: "under14"
    });
    expect(result.exercises).toEqual(["Goblet Squat", "Snap Downs", "Box Jumps", "Landing Mechanics Drill"]);
    expect(result.adaptNotes?.["Goblet Squat"]).toBe("Under-14 version of Front Squat");
  });

  it("keeps youth sets at the low end even for advanced", () => {
    const [result] = adaptWorkoutDays([day(["Goblet Squat"])], 1, { level: "advanced", injuries: [], ageGroup: "under14" });
    // Advanced upgrades Goblet Squat to Front Squat; youth brings it back.
    expect(result.exercises[0]).toBe("Goblet Squat");
    expect(result.targets?.["Goblet Squat"]).toBe("2x10");
  });

  it("changes nothing for 14 and up at the default level", () => {
    const days = [day(["Front Squat"])];
    expect(adaptWorkoutDays(days, 1, { level: "intermediate", injuries: [], ageGroup: "14to17" })).toBe(days);
  });
});
