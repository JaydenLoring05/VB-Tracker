import { describe, expect, it } from "vitest";

import {
  addFromProgram,
  addFromProgramMessage,
  blankProgram,
  CustomProgram,
  daysToAddFrom,
  ProgramDay,
  validateDraft
} from "@/lib/customProgram";

function withDay(days: ProgramDay[], name: string, patch: Partial<ProgramDay>): ProgramDay[] {
  return days.map((day) => (day.day === name ? { ...day, ...patch } : day));
}

const barbellMonday: ProgramDay = {
  day: "Monday",
  title: "Barbell day 1",
  notes: "Rest 2-3 min between sets",
  minutes: "50",
  rest: false,
  exercises: [
    { name: "Back Squat", sets: 5, reps: "5", seconds: null, note: "Warm-up set first" },
    { name: " Bench Press ", sets: 5, reps: "5", seconds: null }
  ]
};

describe("addFromProgram", () => {
  it("adds the other program's day after what is already there", () => {
    const days = withDay(blankProgram().days, "Monday", {
      title: "In-season Monday",
      minutes: "30",
      notes: "Mobility first",
      exercises: [{ name: "Copenhagen Plank", sets: 3, reps: null, seconds: 20 }]
    });
    const result = addFromProgram(days, "Monday", barbellMonday);
    const monday = result.days.find((d) => d.day === "Monday")!;
    expect(result.added).toBe(2);
    expect(result.skipped).toEqual([]);
    expect(monday.exercises.map((e) => e.name)).toEqual(["Copenhagen Plank", "Back Squat", "Bench Press"]);
    expect(monday.exercises[1].note).toBe("Warm-up set first");
    // The day keeps its own name and length; the source's notes go under its own.
    expect(monday).toMatchObject({ title: "In-season Monday", minutes: "30" });
    expect(monday.notes).toBe("Mobility first\nRest 2-3 min between sets");
  });

  it("can add a day to a different weekday", () => {
    const result = addFromProgram(blankProgram().days, "Tuesday", barbellMonday);
    expect(result.days.find((d) => d.day === "Tuesday")!.exercises).toHaveLength(2);
    expect(result.days.find((d) => d.day === "Monday")!.exercises).toHaveLength(0);
  });

  it("gives an empty day the source's name and length", () => {
    const result = addFromProgram(blankProgram().days, "Wednesday", barbellMonday);
    expect(result.days.find((d) => d.day === "Wednesday")).toMatchObject({
      title: "Barbell day 1",
      minutes: "50",
      notes: "Rest 2-3 min between sets",
      rest: false
    });
  });

  it("copies, so editing the source afterwards changes nothing", () => {
    const source = structuredClone(barbellMonday);
    const result = addFromProgram(blankProgram().days, "Monday", source);
    source.exercises[0].sets = 1;
    source.exercises[0].name = "Changed";
    expect(result.days.find((d) => d.day === "Monday")!.exercises[0]).toMatchObject({ name: "Back Squat", sets: 5 });
  });

  it("leaves out exercises the day already lists, ignoring case and spaces, so the day stays valid", () => {
    const days = withDay(blankProgram().days, "Monday", {
      exercises: [{ name: "back squat", sets: 3, reps: "8", seconds: null }]
    });
    const result = addFromProgram(days, "Monday", barbellMonday);
    expect(result.added).toBe(1);
    expect(result.skipped).toEqual(["Back Squat"]);
    expect(result.days.find((d) => d.day === "Monday")!.exercises.map((e) => e.name)).toEqual([
      "back squat",
      "Bench Press"
    ]);
    expect(validateDraft({ name: "Mix", days: result.days })).toEqual([]);
  });

  it("returns the days unchanged when nothing is new", () => {
    const days = withDay(blankProgram().days, "Monday", { exercises: barbellMonday.exercises });
    const result = addFromProgram(days, "Monday", barbellMonday);
    expect(result.days).toBe(days);
    expect(result.added).toBe(0);
    expect(result.skipped).toEqual(["Back Squat", "Bench Press"]);
  });

  it("skips blank rows and doesn't repeat notes already on the day", () => {
    const days = withDay(blankProgram().days, "Monday", {
      notes: "Rest 2-3 min between sets",
      exercises: [{ name: "Plank", sets: 3, reps: null, seconds: 30 }]
    });
    const source = { ...barbellMonday, exercises: [...barbellMonday.exercises, { name: "  ", sets: 3, reps: "8", seconds: null }] };
    const result = addFromProgram(days, "Monday", source);
    const monday = result.days.find((d) => d.day === "Monday")!;
    expect(result.added).toBe(2);
    expect(monday.notes).toBe("Rest 2-3 min between sets");
  });

  it("ignores an unknown day", () => {
    const days = blankProgram().days;
    expect(addFromProgram(days, "Funday", barbellMonday).days).toBe(days);
  });
});

describe("daysToAddFrom", () => {
  const barbell: CustomProgram = {
    id: "barbell",
    name: "Barbell 8-week",
    days: withDay(withDay(blankProgram().days, "Thursday", { ...barbellMonday, day: "Thursday" }), "Monday", barbellMonday)
  };
  const empty: CustomProgram = { id: "empty", name: "  ", days: blankProgram().days };
  const blankRows: CustomProgram = {
    id: "blank",
    name: "",
    days: withDay(blankProgram().days, "Friday", { exercises: [{ name: " ", sets: 3, reps: "8", seconds: null }] })
  };

  it("lists training days with exercises, in week order, leaving out the program being edited", () => {
    const choices = daysToAddFrom([barbell, empty, blankRows], "other");
    expect(choices.map((c) => `${c.programId} ${c.day.day}`)).toEqual(["barbell Monday", "barbell Thursday"]);
    expect(choices[0].programName).toBe("Barbell 8-week");
    expect(daysToAddFrom([barbell], "barbell")).toEqual([]);
  });

  it("lists every program for a program not saved yet, and names an untitled one", () => {
    const untitled = { ...barbell, id: "u", name: " " };
    const choices = daysToAddFrom([untitled], undefined);
    expect(choices).toHaveLength(2);
    expect(choices[0].programName).toBe("Untitled program");
  });

  it("leaves out rest days even if they still hold exercises", () => {
    const rested = { ...barbell, days: withDay(barbell.days, "Thursday", { rest: true }) };
    expect(daysToAddFrom([rested], null).map((c) => c.day.day)).toEqual(["Monday"]);
  });
});

describe("addFromProgramMessage", () => {
  const choice = { programId: "b", programName: "Barbell 8-week", day: barbellMonday };

  it("says how many were added and from where", () => {
    expect(addFromProgramMessage(choice, { days: [], added: 2, skipped: [] }, "Wednesday")).toBe(
      "Added 2 exercises from Barbell 8-week, Monday."
    );
    expect(addFromProgramMessage(choice, { days: [], added: 1, skipped: ["Back Squat"] }, "Monday")).toBe(
      "Added 1 exercise from Barbell 8-week, Monday. Already on Monday: Back Squat."
    );
  });

  it("says when nothing was new", () => {
    expect(addFromProgramMessage(choice, { days: [], added: 0, skipped: ["Back Squat"] }, "Monday")).toBe(
      "Nothing added from Barbell 8-week, Monday: Monday already has all of it."
    );
  });
});
