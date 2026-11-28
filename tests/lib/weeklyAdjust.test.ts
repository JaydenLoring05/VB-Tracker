import { describe, expect, it } from "vitest";

import { adaptWorkoutDays, DEFAULT_TRAINING_PROFILE, parseTrainingProfile, profileToRow } from "@/lib/trainingProfile";
import { buildWeekAdjust, mondayOf, weekCompletion, weekdayOf } from "@/lib/weeklyAdjust";
import type { StatEntry, WorkoutDay } from "@/types";

const entry = (date: string, fields: Partial<StatEntry> = {}): StatEntry => ({
  date,
  vertical: "",
  approach: "",
  weight: "",
  pullups: "",
  sleep: 8,
  energy: 8,
  stress: 3,
  soreness: 3,
  kneePain: 0,
  shoulderPain: 0,
  lowerBackPain: 0,
  anklePain: 0,
  motivation: 8,
  ...fields
});

const tired = { sleep: 4, energy: 2, stress: 9, soreness: 9, motivation: 2 } as Partial<StatEntry>;
// 2026-10-21 is a Wednesday.
const TODAY = "2026-10-21";

const base = { history: [] as StatEntry[], today: TODAY, schedule: {}, gameDates: [] as string[], completionLastWeek: null };

describe("dates", () => {
  it("knows weekdays and Mondays", () => {
    expect(weekdayOf(TODAY)).toBe("Wednesday");
    expect(mondayOf(TODAY)).toBe("2026-10-19");
    expect(mondayOf("2026-10-25")).toBe("2026-10-19");
  });
});

describe("buildWeekAdjust", () => {
  it("does nothing on a normal week", () => {
    const result = buildWeekAdjust({ ...base, history: [entry("2026-10-19"), entry("2026-10-20"), entry("2026-10-21")] });
    expect(result).toMatchObject({ deload: false, extraAreas: [], repeatWeek: false, reasons: [], days: {} });
  });

  it("makes a lighter week after poor recovery, but needs 3 check-ins", () => {
    const three = [entry("2026-10-19", tired), entry("2026-10-20", tired), entry("2026-10-21", tired)];
    expect(buildWeekAdjust({ ...base, history: three }).deload).toBe(true);
    expect(buildWeekAdjust({ ...base, history: three.slice(0, 2) }).deload).toBe(false);
  });

  it("keeps an area on all week when pain repeats", () => {
    const result = buildWeekAdjust({
      ...base,
      history: [entry("2026-10-18", { kneePain: 5 }), entry("2026-10-20", { kneePain: 4 }), entry("2026-10-10", { shoulderPain: 9 })]
    });
    expect(result.extraAreas).toEqual(["knee"]);
  });

  it("suggests repeating a mostly missed week", () => {
    expect(buildWeekAdjust({ ...base, completionLastWeek: 0.3 }).repeatWeek).toBe(true);
    expect(buildWeekAdjust({ ...base, completionLastWeek: 0.8 }).repeatWeek).toBe(false);
  });

  it("uses the athlete's week and puts games on top", () => {
    const result = buildWeekAdjust({
      ...base,
      schedule: { Monday: "practice", Tuesday: "liftClass", Friday: "practice" },
      gameDates: ["2026-10-24", "2026-11-30"]
    });
    expect(result.days).toEqual({ Monday: "practice", Tuesday: "liftClass", Friday: "preGame", Saturday: "game" });
  });

  it("treats a Monday game as making Sunday the day before", () => {
    const result = buildWeekAdjust({ ...base, gameDates: ["2026-10-26"] });
    expect(result.days).toEqual({ Sunday: "preGame" });
  });
});

describe("weekCompletion", () => {
  it("counts checked exercises in that week only", () => {
    const checked = { "3-Monday-Box Jumps": true, "3-Monday-Hip Thrust": false, "3-Tuesday-Pogo Hops": true, "13-Monday-Box Jumps": true };
    expect(weekCompletion(checked, 3, 8)).toBe(0.25);
    expect(weekCompletion(checked, 3, 0)).toBeNull();
  });
});

const day = (name: string, exercises: string[], title = "Lower Body"): WorkoutDay => ({
  day: name,
  title,
  minutes: "60",
  notes: "",
  exercises
});

describe("day rules in the plan", () => {
  const profile = (days: Record<string, string>, deload = false) => ({
    ...DEFAULT_TRAINING_PROFILE,
    adjust: { deload, days: days as never }
  });

  it("takes the jumping out on practice days", () => {
    const [result] = adaptWorkoutDays([day("Monday", ["Box Jumps", "Hip Thrust", "Landing Mechanics Drill"])], 1, profile({ Monday: "practice" }));
    expect(result.exercises).toEqual(["Hip Thrust", "Landing Mechanics Drill"]);
    expect(result.adjustNote).toMatch(/Practice day/);
  });

  it("keeps lift-elsewhere days to rehab, core and mobility", () => {
    const [result] = adaptWorkoutDays(
      [day("Tuesday", ["Front Squat", "Tibialis Raises", "Dead Bugs", "Pull-Ups"])],
      1,
      profile({ Tuesday: "liftClass" })
    );
    expect(result.exercises).toEqual(["Tibialis Raises", "Dead Bugs"]);
  });

  it("turns game day into a loosen-up day and keeps legs fresh the day before", () => {
    const [friday, saturday] = adaptWorkoutDays(
      [day("Friday", ["Trap Bar Deadlift or RDL", "Pallof Press", "Box Jumps"]), day("Saturday", ["Pull-Ups", "Court Sprints"])],
      1,
      profile({ Friday: "preGame", Saturday: "game" })
    );
    expect(friday.exercises).toEqual(["Pallof Press"]);
    expect(saturday.exercises).toEqual(["Full-Body Mobility Flow", "Light Stretching", "Foam Roll"]);
  });

  it("knee rehab still gets added on practice days but not on game day", () => {
    const knee = { level: "intermediate" as const, injuries: ["knee" as const], adjust: { deload: false, days: { Monday: "practice", Saturday: "game" } as never } };
    const [monday, saturday] = adaptWorkoutDays([day("Monday", ["Hip Thrust"]), day("Saturday", ["Pull-Ups"])], 1, knee);
    expect(monday.exercises).toContain("Spanish Squat");
    expect(saturday.exercises).not.toContain("Spanish Squat");
  });

  it("drops a set across the board in a lighter week", () => {
    const [result] = adaptWorkoutDays([day("Monday", ["Hip Thrust"])], 6, profile({}, true));
    expect(result.targets?.["Hip Thrust"]).toBe("3x8");
    expect(result.adjustNote).toMatch(/Lighter week/);
  });
});

describe("weekly schedule on the profile", () => {
  it("saves and reads the week, dropping junk", () => {
    const parsed = parseTrainingProfile({ level: "advanced", injuries: [], weekly: { Monday: "practice", Tuesday: "nap", Funday: "practice" } });
    expect(parsed.weekly).toEqual({ Monday: "practice" });
    expect(profileToRow(parsed).weekly_schedule).toEqual({ Monday: "practice" });
  });
});
