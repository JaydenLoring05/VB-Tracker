import { describe, expect, it } from "vitest";

import { dayExercises, programFromImport, type ImportedPlan } from "@/lib/customProgram";
import { readPastedPlan } from "@/lib/planFiles";
import { parseCsv, parseTabs, readProgramSheet } from "@/lib/sheetImport";
import { barbellSheet, blocksSheet, toCsv } from "../fixtures/madeUpSheets";

const names = (plan: ImportedPlan, day: string) =>
  dayExercises(plan.days.find((d) => d.day === day) ?? { sections: [] }).map((e) => e.name);
const everyDay = (plan: ImportedPlan) => plan.everyDay.map((s) => `${s.name}: ${s.exercises.map((e) => e.name).join(", ")}`);

describe("parseCsv", () => {
  it("handles quotes, doubled quotes, commas and newlines inside cells", () => {
    expect(parseCsv('"a","b ""c""","d, e"\n"line\nbreak",,x\r\n')).toEqual([
      ["a", 'b "c"', "d, e"],
      ["line\nbreak", "", "x"]
    ]);
  });
});

describe("readProgramSheet: blocks side by side", () => {
  const plan = readProgramSheet(parseCsv(toCsv(blocksSheet())));

  it("finds the training days from the weekday cells, including one halfway down a block", () => {
    expect(plan.days.map((d) => d.day)).toEqual(["Monday", "Wednesday", "Thursday"]);
    expect(names(plan, "Monday")).toEqual(["Goblet Squat", "Band Pull-Apart", "Pigeon Stretch", "Wall Sit"]);
    expect(names(plan, "Wednesday")).toEqual(["Step-Down", "Hanging Knee Raise"]);
    expect(names(plan, "Thursday")).toEqual(["Lateral Lunge", "Seated Row"]);
  });

  it("keeps a block with no weekday once, for every day, with its labels as sections", () => {
    expect(everyDay(plan)).toEqual([
      "Warm-Ups - Hips: Hip Circles, Jog (Backwards)",
      "Warm-Ups - Jumps - Pick One: Pogo Hops, Tuck Jumps",
      "Core (Front) - Pick One: Hollow Hold, Dead Bug",
      "Core (Side) - Pick One: Side Plank, Copenhagen Plank"
    ]);
  });

  it("keeps reps as written, reads times, and leaves blank reps for the coach", () => {
    const monday = dayExercises(plan.days[0]);
    expect(monday.map((e) => [e.sets, e.reps, e.seconds])).toEqual([
      [3, "10", null],
      [3, "15 reps per side", null],
      [2, "1 min per side", null],
      [2, null, 45]
    ]);
    expect(dayExercises(plan.days[1])[1]).toMatchObject({ name: "Hanging Knee Raise", reps: "" });
    expect(plan.everyDay[0].exercises[1]).toMatchObject({ name: "Jog (Backwards)", sets: 1, reps: "" });
  });

  it("puts a note on the exercise above it", () => {
    expect(plan.notes["every day"]).toEqual({ "Tuck Jumps": "soft landings, quiet feet." });
    expect(plan.leftOut).toEqual([]);
  });

  it("puts the every-day sections around each day's own work in the program: warm-ups first, core last", () => {
    const thursday = programFromImport(plan).days.find((d) => d.day === "Thursday")!;
    expect(thursday.sections.map((s) => s.name)).toEqual([
      "Warm-Ups - Hips",
      "Warm-Ups - Jumps - Pick One",
      "",
      "Core (Front) - Pick One",
      "Core (Side) - Pick One"
    ]);
    expect(thursday.notes).toBe("Tuck Jumps: soft landings, quiet feet.");
  });
});

describe("readProgramSheet: week-by-week barbell sheet", () => {
  const plan = readProgramSheet(parseCsv(toCsv(barbellSheet())));

  it("reads the days from labels beside the lifts, and joins the accessory work on the same days", () => {
    expect(plan.days.map((d) => d.day)).toEqual(["Monday", "Wednesday", "Thursday"]);
    expect(names(plan, "Monday")).toEqual([
      "Power Clean",
      "Front Squat",
      "Push Jerk",
      "Trap Bar Deadlift",
      "Nordic Curl",
      "Calf Raise"
    ]);
    expect(names(plan, "Thursday")).toEqual(["Power Clean", "Front Squat", "Push Jerk", "Trap Bar Deadlift", "Copenhagen Plank"]);
    // One list per day, not one per block.
    expect(plan.days.every((d) => d.sections.length === 1)).toBe(true);
  });

  it("splits 'WU + 5 x 5' into sets and reps with the warm-up set as a note", () => {
    const wednesday = dayExercises(plan.days[1]);
    expect(wednesday[0]).toMatchObject({ name: "Power Clean", sets: 5, reps: "5" });
    expect(wednesday[3]).toMatchObject({ name: "Trap Bar Deadlift", sets: 3, reps: "8" });
    expect(plan.notes.Wednesday?.["Power Clean"]).toBe("Warm-up set first.");
  });

  it("brings in the first week only and says what it left out", () => {
    expect(plan.leftOut).toEqual([
      'A note with no exercise above it: "warm-up sets can be skipped."',
      'A note with no exercise above it: "Easy week: move, but nothing heavy"',
      'A note with no exercise above it: "Send me your new numbers"',
      "12 rows from later weeks. A program is one repeating week, so the first week came in."
    ]);
    // Week 3's unlabeled "Day 7" is a later week, not every-day work.
    expect(everyDay(plan)).toEqual(["Warm-Ups - Shoulders: Arm Circles, Band Dislocates", "Core - Pick One: Sit-Ups, V-Ups"]);
  });
});

describe("readProgramSheet: a plain table", () => {
  it("with no weekdays is one Monday", () => {
    const plan = readProgramSheet([
      ["Exercise", "Sets", "Reps"],
      ["Back Squat", "3", "8"],
      ["Plank", "3", "30 sec"]
    ]);
    expect(plan.days.map((d) => d.day)).toEqual(["Monday"]);
    expect(dayExercises(plan.days[0]).map((e) => e.name)).toEqual(["Back Squat", "Plank"]);
    expect(plan.everyDay).toEqual([]);
  });

  it("from .xlsx comes in with numbers as numbers", () => {
    const plan = readProgramSheet([["Monday"], ["Bench Press", 3, 8], ["Row", 3, null]]);
    expect(dayExercises(plan.days[0])).toEqual([
      { name: "Bench Press", sets: 3, reps: "8", seconds: null },
      { name: "Row", sets: 3, reps: "", seconds: null }
    ]);
  });
});

describe("readPastedPlan", () => {
  it("reads cells copied from a spreadsheet (tab-separated) as a sheet", () => {
    const copied = blocksSheet()
      .map((row) => row.join("\t"))
      .join("\n");
    expect(readPastedPlan(copied).days.map((d) => d.day)).toEqual(["Monday", "Wednesday", "Thursday"]);
    expect(parseTabs("a\tb\nc")).toEqual([["a", "b"], ["c"]]);
  });

  it("reads lines of text as a pasted plan", () => {
    expect(readPastedPlan("Monday\nSquat 3x5").days[0].day).toBe("Monday");
  });
});
