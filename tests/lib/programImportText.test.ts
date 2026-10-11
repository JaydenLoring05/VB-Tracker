import { describe, expect, it } from "vitest";

import {
  dayExercises,
  parseProgramText,
  programFromImport,
  readExerciseLine,
  readWeekday,
  validateProgram
} from "@/lib/customProgram";

describe("readWeekday", () => {
  it("reads whole weekday words and abbreviations, with what follows", () => {
    expect(readWeekday("Monday:")).toEqual({ day: "Monday", rest: "" });
    expect(readWeekday("Wed")).toEqual({ day: "Wednesday", rest: "" });
    expect(readWeekday("Thurs")).toEqual({ day: "Thursday", rest: "" });
    expect(readWeekday("Thursday/ Day 3")).toEqual({ day: "Thursday", rest: "Day 3" });
    expect(readWeekday("Monday - Lower body")).toEqual({ day: "Monday", rest: "Lower body" });
  });

  it("doesn't mistake exercises for days", () => {
    expect(readWeekday("Sunflower stretch")).toBeNull();
    expect(readWeekday("Saturation")).toBeNull();
    expect(readWeekday("Back squat")).toBeNull();
  });
});

describe("readExerciseLine", () => {
  it("reads the formats coaches type", () => {
    expect(readExerciseLine("Back squat 3x8")).toEqual({ name: "Back squat", sets: 3, reps: "8", seconds: null });
    expect(readExerciseLine("Plank 3x30 sec")).toEqual({ name: "Plank", sets: 3, reps: null, seconds: 30 });
    expect(readExerciseLine("RDL - 4 x 8-10")).toEqual({ name: "RDL", sets: 4, reps: "8-10", seconds: null });
    expect(readExerciseLine("Wall sit 2x1 min")).toEqual({ name: "Wall sit", sets: 2, reps: null, seconds: 60 });
    expect(readExerciseLine("Push-ups: 3 sets of 15")).toEqual({ name: "Push-ups", sets: 3, reps: "15", seconds: null });
    expect(readExerciseLine("- Pull-ups 3x3-10")).toEqual({ name: "Pull-ups", sets: 3, reps: "3-10", seconds: null });
  });

  it("keeps reps as written", () => {
    expect(readExerciseLine("Step up 4x15 reps each leg").reps).toBe("15 reps each leg");
    expect(readExerciseLine("Couch stretch 3x1 min per side").reps).toBe("1 min per side");
  });

  it("splits a warm-up set off 'WU + 5 x 5' into a note", () => {
    expect(readExerciseLine("Cleans WU + 5 x 5")).toEqual({
      name: "Cleans",
      sets: 5,
      reps: "5",
      seconds: null,
      note: "Warm-up set first."
    });
  });

  it("brings in a line with no target, with reps left for the coach", () => {
    expect(readExerciseLine("Couch stretch")).toEqual({ name: "Couch stretch", sets: 3, reps: "", seconds: null });
  });

  it("doesn't read a number inside a name as sets", () => {
    expect(readExerciseLine("Trap-3 Raise 3x10")).toMatchObject({ name: "Trap-3 Raise", sets: 3, reps: "10" });
    expect(readExerciseLine("180 Jump Squats 1x20")).toMatchObject({ name: "180 Jump Squats", sets: 1, reps: "20" });
  });
});

describe("parseProgramText", () => {
  it("starts a new day at each day name", () => {
    const plan = parseProgramText("Monday\nBack squat 3x8\nPlank 3x30 sec\n\nWednesday - Upper\nRDL - 4 x 8-10\n");
    expect(plan.days.map((d) => [d.day, d.title, dayExercises(d).map((e) => e.name)])).toEqual([
      ["Monday", "", ["Back squat", "Plank"]],
      ["Wednesday", "Upper", ["RDL"]]
    ]);
    expect(plan.leftOut).toEqual([]);
  });

  it("makes one Monday when there are no day names", () => {
    const plan = parseProgramText("Back squat 3x8\nPlank 3x30 sec");
    expect(plan.days).toHaveLength(1);
    expect(plan.days[0].day).toBe("Monday");
  });

  it("reads a first line with no target, before any day, as the plan's title", () => {
    const plan = parseProgramText("Fall plan\nTuesday - Speed\nSprint starts 6x20 yd\nFriday\nHang clean 4x3");
    expect(plan.title).toBe("Fall plan");
    expect(plan.everyDay).toEqual([]);
    expect(plan.days.map((d) => d.day)).toEqual(["Tuesday", "Friday"]);
    // A first line that is an exercise or a heading isn't a title.
    expect(parseProgramText("Warm-up:\nSkips 2x20\nMonday\nSquat 3x5").title).toBeUndefined();
    expect(parseProgramText("Jump rope 3x1 min\nMonday\nSquat 3x5").title).toBeUndefined();
  });

  it("reads 'Day 2' as the second weekday", () => {
    expect(parseProgramText("Day 1\nSquat 3x5\nDay 2\nBench 3x5").days.map((d) => d.day)).toEqual(["Monday", "Tuesday"]);
  });

  it("keeps lines before the first day once, for every day, and copies them on: warm-ups first", () => {
    const plan = parseProgramText(
      ["Warm-up:", "A-Skips 2x20", "Abs:", "Dead Bug 3x10", "Monday", "Back squat 3x8", "Thursday", "Bench 3x8"].join("\n")
    );
    // Held once, so a coach fixes a warm-up row once, not on every day.
    expect(plan.everyDay.map((s) => s.name)).toEqual(["Warm-up", "Abs"]);
    expect(plan.days.map((d) => d.sections.map((s) => s.name))).toEqual([[""], [""]]);

    const days = programFromImport(plan).days.filter((d) => !d.rest);
    for (const day of days) {
      expect(day.sections.map((s) => s.name)).toEqual(["Warm-up", "", "Abs"]);
    }
    // Copies, so editing Monday's warm-up in the builder doesn't change Thursday's.
    expect(days[0].sections[0]).not.toBe(days[1].sections[0]);
  });

  it("keeps a note with the exercise above it", () => {
    const plan = parseProgramText("Monday\nDepth jumps 3x10\n*land on the balls of your feet\nCleans WU + 5 x 5");
    expect(plan.notes.Monday).toEqual({
      "Depth jumps": "land on the balls of your feet",
      Cleans: "Warm-up set first."
    });
  });

  it("lists a note it can't place instead of guessing", () => {
    expect(parseProgramText("*Send me your maxes\nMonday\nSquat 3x5").leftOut).toEqual([
      'A note with no exercise above it: "Send me your maxes"'
    ]);
  });
});

describe("programFromImport", () => {
  it("opens as a full week: imported days train, the rest are rest days, notes in the day notes", () => {
    const plan = parseProgramText("Monday\nDepth jumps 3x10\n*land soft\nWednesday\nBench 3x8");
    const program = programFromImport(plan, "Fall lifts");
    expect(program.days.map((d) => (d.rest ? "rest" : d.day))).toEqual([
      "Monday",
      "rest",
      "Wednesday",
      "rest",
      "rest",
      "rest",
      "rest"
    ]);
    expect(program.days[0].notes).toBe("Depth jumps: land soft");
    expect(validateProgram(program)).toEqual([]);
  });

  it("leaves rows with no reps for the coach to fill before saving", () => {
    const program = programFromImport(parseProgramText("Monday\nCouch stretch"));
    expect(validateProgram(program)).toContain("Couch stretch on Monday needs a rep target.");
  });
});
