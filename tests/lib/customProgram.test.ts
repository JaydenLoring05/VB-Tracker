import { describe, expect, it } from "vitest";

import {
  applyWarmup,
  blankProgram,
  dayExercises,
  dayWarmup,
  exerciseFromPrescription,
  formatTarget,
  getExerciseTarget,
  hasStartingTargets,
  headingsByIndex,
  isFinished,
  newProgramExercise,
  ownExercises,
  parseProgramDays,
  parseProgramDraft,
  pickAssignedProgramId,
  plainSections,
  ProgramDay,
  ProgramSection,
  programWarmup,
  ProgramAssignment,
  programFromRecommended,
  programToWorkoutDays,
  sectionAt,
  storedProgramDays,
  unfinishedWeek,
  validateProgram,
  WEEKDAYS
} from "@/lib/customProgram";
import { resolveWorkoutDays, TeamOverrideData } from "@/lib/programResolution";
import { getWorkoutDays } from "@/data/workoutPlan";

const program = {
  id: "p1",
  name: "Pins Split",
  days: blankProgram().days.map((day) =>
    day.day === "Monday"
      ? {
          ...day,
          title: "Lower",
          sections: plainSections([
            { name: "Back Squat", sets: 4, reps: "5", seconds: null },
            { name: "Planks", sets: 3, reps: null, seconds: 45 }
          ])
        }
      : day
  )
};

describe("formatTarget", () => {
  it("writes reps and timed targets", () => {
    expect(formatTarget({ name: "Squat", sets: 4, reps: "6-8", seconds: null })).toBe("4x6-8");
    expect(formatTarget({ name: "Planks", sets: 3, reps: null, seconds: 45 })).toBe("3x45 sec");
  });
});

describe("exerciseFromPrescription", () => {
  it("reads sets and reps from the plan", () => {
    expect(exerciseFromPrescription("Back Squat", "3-4x8")).toEqual({ name: "Back Squat", sets: 3, reps: "8", seconds: null });
    expect(exerciseFromPrescription("Lateral Band Walks", "2-3x10-15 each side")).toMatchObject({ sets: 2, reps: "10-15" });
  });

  it("reads timed targets in seconds", () => {
    expect(exerciseFromPrescription("Planks", "3x30-45 sec")).toEqual({ name: "Planks", sets: 3, reps: null, seconds: 45 });
    expect(exerciseFromPrescription("Full-Body Mobility Flow", "10-20 min")).toEqual({
      name: "Full-Body Mobility Flow",
      sets: 1,
      reps: null,
      seconds: 600
    });
  });
});

describe("programFromRecommended", () => {
  it("copies every day and exercise of the recommended week", () => {
    const copy = programFromRecommended(1);
    const plan = getWorkoutDays(1);
    expect(copy.days.map((d) => d.day)).toEqual(plan.map((d) => d.day));
    copy.days.forEach((day, i) => expect(dayExercises(day).map((e) => e.name)).toEqual(plan[i].exercises));
    expect(validateProgram(copy)).toEqual([]);
  });
});

describe("programToWorkoutDays", () => {
  it("returns all seven weekdays with coach targets", () => {
    const days = programToWorkoutDays(program);
    expect(days.map((d) => d.day)).toEqual([...WEEKDAYS]);
    const monday = days[0];
    expect(monday.title).toBe("Lower");
    expect(monday.exercises).toEqual(["Back Squat", "Planks"]);
    expect(monday.targets).toEqual({ "Back Squat": "4x5", Planks: "3x45 sec" });
    expect(days.find((d) => d.day === "Sunday")?.rest).toBe(true);
  });
});

describe("resolveWorkoutDays with a coach program", () => {
  const team: TeamOverrideData = { planTier: "pilot", exerciseDefaults: {}, dayOverrides: {}, customProgram: program };

  it("replaces the recommended plan", () => {
    const days = resolveWorkoutDays(getWorkoutDays(5), 5, team, {});
    expect(days[0].exercises).toEqual(["Back Squat", "Planks"]);
  });

  it("keeps the coach's target on an athlete's swap", () => {
    const days = resolveWorkoutDays(getWorkoutDays(5), 5, team, { "Back Squat": "Goblet Squat" });
    expect(days[0].exercises).toEqual(["Goblet Squat", "Planks"]);
    expect(getExerciseTarget(days[0], 5, "Goblet Squat")).toBe("4x5");
  });

  it("falls back to the plan's prescription without a coach target", () => {
    const days = resolveWorkoutDays(getWorkoutDays(1), 1, null, {});
    expect(getExerciseTarget(days[0], 1, days[0].exercises[0])).toBeTruthy();
    expect(days[0].targets).toBeUndefined();
  });
});

describe("pickAssignedProgramId", () => {
  const assignments: (ProgramAssignment & { updatedAt?: string })[] = [
    { programId: "team", scope: "team", groupId: null, userId: null },
    { programId: "pins", scope: "group", groupId: "g-pins", userId: null, updatedAt: "2026-10-01" },
    { programId: "libero", scope: "group", groupId: "g-libero", userId: null, updatedAt: "2026-10-02" },
    { programId: "solo", scope: "athlete", groupId: null, userId: "u-solo" }
  ];

  it("prefers the athlete's own program", () => {
    expect(pickAssignedProgramId(assignments, "u-solo", ["g-pins"])).toBe("solo");
  });

  it("then their group's, newest first", () => {
    expect(pickAssignedProgramId(assignments, "u1", ["g-pins"])).toBe("pins");
    expect(pickAssignedProgramId(assignments, "u1", ["g-pins", "g-libero"])).toBe("libero");
  });

  it("then the team's, then none", () => {
    expect(pickAssignedProgramId(assignments, "u1", [])).toBe("team");
    expect(pickAssignedProgramId([], "u1", [])).toBeNull();
  });
});

describe("validateProgram", () => {
  it("flags missing names, empty days, duplicates, and missing targets", () => {
    const bad = {
      name: " ",
      days: blankProgram().days.map((day) =>
        day.day === "Monday"
          ? {
              ...day,
              sections: plainSections([
                { name: "Squat", sets: 3, reps: "", seconds: null },
                { name: "squat", sets: 3, reps: "5", seconds: null }
              ])
            }
          : day
      )
    };
    const problems = validateProgram(bad);
    expect(problems).toContain("Give the program a name.");
    expect(problems).toContain("Monday lists the same exercise twice.");
    expect(problems).toContain("Squat on Monday needs a rep target.");
    expect(problems).toContain("Tuesday has no exercises. Add some or make it a rest day.");
  });

  it("needs at least one training day", () => {
    const allRest = { name: "Off", days: blankProgram().days.map((day) => ({ ...day, rest: true })) };
    expect(validateProgram(allRest)).toContain("Pick at least one training day.");
  });
});

describe("parseProgramDays", () => {
  it("cleans up stored jsonb and drops unknown days", () => {
    expect(
      parseProgramDays([
        { day: "Monday", title: "Lower", rest: false, exercises: [{ name: "Planks", sets: "3", seconds: "45" }] },
        { day: "Funday", exercises: [] },
        "junk"
      ])
    ).toEqual([
      {
        day: "Monday",
        title: "Lower",
        notes: "",
        minutes: "",
        rest: false,
        sections: [{ name: "", exercises: [{ name: "Planks", sets: 3, reps: null, seconds: 45 }] }]
      }
    ]);
    expect(parseProgramDays(null)).toEqual([]);
  });
});

describe("ownExercises", () => {
  const library = ["Back Squat", "Planks"];
  const day = (name: string, exercises: { name: string; sets: number; reps: string | null; seconds: number | null }[]) => ({
    days: [{ day: name, title: "Training", notes: "", minutes: "45", rest: false, sections: plainSections(exercises) }]
  });

  it("returns names that aren't in the library, with their targets", () => {
    const programs = [
      day("Monday", [
        { name: "Back Squat", sets: 4, reps: "5", seconds: null },
        { name: "Bulgarian step-up", sets: 4, reps: "6", seconds: null }
      ])
    ];
    expect(ownExercises(programs, library)).toEqual([{ name: "Bulgarian step-up", sets: 4, reps: "6", seconds: null }]);
  });

  it("ignores case and outer spaces against the library", () => {
    const programs = [day("Monday", [{ name: "  back squat ", sets: 3, reps: "8", seconds: null }])];
    expect(ownExercises(programs, library)).toEqual([]);
  });

  it("keeps the first spelling and targets found, so the program passed first wins", () => {
    const draft = day("Tuesday", [{ name: "Bulgarian Step-Up", sets: 5, reps: "5", seconds: null }]);
    const saved = day("Monday", [{ name: "bulgarian step-up", sets: 3, reps: "10", seconds: null }]);
    expect(ownExercises([draft, saved], library)).toEqual([
      { name: "Bulgarian Step-Up", sets: 5, reps: "5", seconds: null }
    ]);
  });

  it("skips rows with no name and trims the ones it keeps", () => {
    const programs = [
      day("Monday", [
        { name: "", sets: 3, reps: "8", seconds: null },
        { name: "   ", sets: 3, reps: "8", seconds: null },
        { name: " Copenhagen hold ", sets: 3, reps: null, seconds: 20 }
      ])
    ];
    expect(ownExercises(programs, library)).toEqual([{ name: "Copenhagen hold", sets: 3, reps: null, seconds: 20 }]);
  });

  it("sorts by name and finds exercises on every day of every program", () => {
    const programs = [
      {
        days: [
          ...day("Monday", [{ name: "Wall drill", sets: 3, reps: "8", seconds: null }]).days,
          ...day("Wednesday", [{ name: "Ankle hops", sets: 2, reps: "20", seconds: null }]).days
        ]
      },
      day("Friday", [{ name: "Net jumps", sets: 3, reps: "6", seconds: null }])
    ];
    expect(ownExercises(programs, library).map((exercise) => exercise.name)).toEqual([
      "Ankle hops",
      "Net jumps",
      "Wall drill"
    ]);
  });

  it("returns nothing for no programs", () => {
    expect(ownExercises([], library)).toEqual([]);
  });
});

describe("hasStartingTargets", () => {
  it("is true for a row nobody has changed", () => {
    expect(hasStartingTargets(newProgramExercise(""))).toBe(true);
    expect(hasStartingTargets(newProgramExercise("Planks"))).toBe(true);
  });

  it("is false once sets, reps or seconds were changed", () => {
    expect(hasStartingTargets({ ...newProgramExercise(""), sets: 4 })).toBe(false);
    expect(hasStartingTargets({ ...newProgramExercise(""), reps: "10" })).toBe(false);
    expect(hasStartingTargets({ ...newProgramExercise("Planks"), seconds: 45 })).toBe(false);
  });
});

describe("saving day by day (drafts)", () => {
  const finishedWeek = program.days;
  const halfBuilt = blankProgram().days.map((day) =>
    day.day === "Tuesday" ? { ...day, title: "Upper", sections: plainSections([newProgramExercise("Push-Ups")]) } : day
  );

  it("keeps the draft out of what athletes read", () => {
    const stored = storedProgramDays(finishedWeek, { name: "Pins Split v2", days: halfBuilt });
    expect(parseProgramDays(stored)).toEqual(finishedWeek);
    expect(programToWorkoutDays({ days: parseProgramDays(stored) })).toEqual(programToWorkoutDays(program));
  });

  it("reads the draft back for the builder", () => {
    const stored = storedProgramDays(finishedWeek, { name: "Pins Split v2", days: halfBuilt });
    expect(parseProgramDraft(stored)).toEqual({ name: "Pins Split v2", days: halfBuilt });
  });

  it("survives the jsonb round trip", () => {
    const stored = JSON.parse(JSON.stringify(storedProgramDays(finishedWeek, { name: "v2", days: halfBuilt })));
    expect(parseProgramDays(stored)).toEqual(finishedWeek);
    expect(parseProgramDraft(stored)?.days).toEqual(halfBuilt);
  });

  it("has no draft for programs saved before drafts existed, or once finished", () => {
    expect(parseProgramDraft(finishedWeek)).toBeNull();
    expect(parseProgramDraft(storedProgramDays(finishedWeek, null))).toBeNull();
    expect(parseProgramDays(storedProgramDays(finishedWeek, null))).toEqual(finishedWeek);
    expect(parseProgramDraft(null)).toBeNull();
  });

  it("treats a program never finished as not assignable", () => {
    const mondayOnly = program.days.map((day) => (day.day === "Monday" ? day : { ...day, rest: true, title: "Rest" }));
    expect(isFinished({ name: "Pins Split", days: mondayOnly })).toBe(true);
    expect(isFinished({ name: "Half", days: halfBuilt })).toBe(false);
    // What a program saved day by day but never finished publishes: nobody trains from it.
    expect(isFinished({ name: "New program", days: unfinishedWeek() })).toBe(false);
    expect(programToWorkoutDays({ days: unfinishedWeek() }).every((day) => day.rest && day.exercises.length === 0)).toBe(true);
  });
});

describe("sections in a day", () => {
  const squat = { name: "Back Squat", sets: 4, reps: "5", seconds: null };
  const plank = { name: "Planks", sets: 3, reps: null, seconds: 30 };
  const skips = { name: "A-Skips", sets: 2, reps: "20 yd", seconds: null };
  const lunge = { name: "Walking Lunges", sets: 2, reps: "10", seconds: null };
  const trainingDay = (day: string, sections: ProgramSection[]): ProgramDay => ({
    day,
    title: "Lift",
    notes: "",
    minutes: "60",
    rest: false,
    sections
  });

  it("reads a day saved before sections as one unnamed section", () => {
    const [monday] = parseProgramDays([{ day: "Monday", title: "Lift", rest: false, exercises: [squat, plank] }]);
    expect(monday.sections).toEqual([{ name: "", exercises: [squat, plank] }]);
    // And athletes see exactly what they saw before: no headings.
    const [workout] = programToWorkoutDays({ days: [monday] });
    expect(workout.exercises).toEqual(["Back Squat", "Planks"]);
    expect(workout.sections).toBeUndefined();
  });

  it("stores sections plus the flat list older readers expect, and reads them back", () => {
    const monday = trainingDay("Monday", [
      { name: "Warm-up", kind: "warmup", shared: true, exercises: [skips] },
      { name: "", exercises: [squat] },
      { name: "Abs", exercises: [plank] }
    ]);
    const stored = JSON.parse(JSON.stringify(storedProgramDays([monday], null)));
    expect(stored[0].exercises.map((e: { name: string }) => e.name)).toEqual(["A-Skips", "Back Squat", "Planks"]);
    expect(parseProgramDays(stored)).toEqual([monday]);
  });

  it("ignores section kinds it doesn't know", () => {
    const [monday] = parseProgramDays([
      { day: "Monday", rest: false, sections: [{ name: "Odd", kind: "mystery", exercises: [squat] }] }
    ]);
    expect(monday.sections).toEqual([{ name: "Odd", exercises: [squat] }]);
  });

  it("gives athletes the flat list in order plus headings, warm-up first, skipping empty sections", () => {
    const monday = trainingDay("Monday", [
      { name: "", kind: "warmup", shared: true, exercises: [skips] },
      { name: "Lifts", exercises: [squat] },
      { name: "Empty", exercises: [] },
      { name: "Abs", exercises: [plank] }
    ]);
    const [workout] = programToWorkoutDays({ days: [monday] });
    expect(workout.exercises).toEqual(["A-Skips", "Back Squat", "Planks"]);
    expect(workout.sections).toEqual([
      { heading: "Warm-up", kind: "warmup", exercises: ["A-Skips"] },
      { heading: "Lifts", exercises: ["Back Squat"] },
      { heading: "Abs", exercises: ["Planks"] }
    ]);
    expect([...headingsByIndex(workout).entries()].map(([i, s]) => [i, s.heading])).toEqual([
      [0, "Warm-up"],
      [1, "Lifts"],
      [2, "Abs"]
    ]);
    expect(sectionAt(workout, 2)?.heading).toBe("Abs");
    expect(sectionAt(workout, 3)).toBeUndefined();
  });

  it("heads an unnamed list 'Main' once the day has other headings, so lifts don't read as warm-up", () => {
    const monday = trainingDay("Monday", [
      { name: "Warm-up", kind: "warmup", shared: true, exercises: [skips] },
      { name: "", exercises: [squat] },
      { name: "Abs", exercises: [plank] }
    ]);
    expect(programToWorkoutDays({ days: [monday] })[0].sections?.map((s) => s.heading)).toEqual(["Warm-up", "Main", "Abs"]);
  });

  it("keeps headings when an athlete swaps an exercise", () => {
    const [monday] = programToWorkoutDays({ days: [trainingDay("Monday", [{ name: "Lifts", exercises: [squat] }])] });
    const team: TeamOverrideData = {
      planTier: "pilot",
      exerciseDefaults: {},
      dayOverrides: {},
      customProgram: { id: "p", name: "P", days: [trainingDay("Monday", [{ name: "Lifts", exercises: [squat] }])] }
    };
    const resolved = resolveWorkoutDays([], 1, team, { "Back Squat": "Goblet Squat" }).find((d) => d.day === "Monday");
    expect(monday.sections?.[0].exercises).toEqual(["Back Squat"]);
    expect(resolved?.exercises).toEqual(["Goblet Squat"]);
    expect(resolved?.sections?.[0]).toEqual({ heading: "Lifts", exercises: ["Goblet Squat"] });
    expect(resolved?.targets?.["Goblet Squat"]).toBe("4x5");
  });

  it("counts the warm-up when checking a day for duplicates", () => {
    const monday = trainingDay("Monday", [
      { name: "", kind: "warmup", shared: true, exercises: [plank] },
      { name: "", exercises: [squat, plank] }
    ]);
    expect(validateProgram({ name: "P", days: [monday] })).toContain("Monday lists the same exercise twice.");
  });

  describe("the program warm-up", () => {
    const warmup: ProgramSection = { name: "Warm-up", kind: "warmup", shared: true, exercises: [skips] };
    const week = [
      trainingDay("Monday", plainSections([squat])),
      trainingDay("Wednesday", plainSections([plank])),
      { ...trainingDay("Saturday", plainSections([])), rest: true }
    ];

    it("goes first on every training day and never on rest days", () => {
      const days = applyWarmup(week, warmup, true);
      expect(days.map((d) => d.sections.map((s) => s.kind ?? "plain"))).toEqual([
        ["warmup", "plain"],
        ["warmup", "plain"],
        ["plain"]
      ]);
      expect(programWarmup(days)?.exercises).toEqual([skips]);
    });

    it("written once: editing it updates every day that uses it", () => {
      const days = applyWarmup(applyWarmup(week, warmup, true), { ...warmup, exercises: [skips, lunge] }, true);
      expect(days.filter((d) => !d.rest).map((d) => dayWarmup(d)?.exercises.length)).toEqual([2, 2]);
    });

    it("switched off: athletes don't get it, but it's kept and comes back when switched on", () => {
      const off = applyWarmup(applyWarmup(week, warmup, true), warmup, false);
      expect(programToWorkoutDays({ days: off }).map((d) => d.exercises)).toEqual(
        programToWorkoutDays({ days: week }).map((d) => d.exercises)
      );
      expect(validateProgram({ name: "P", days: off.slice(0, 2) })).toEqual([]);
      const stored = JSON.parse(JSON.stringify(storedProgramDays(off, null)));
      expect(stored[0].exercises.map((e: { name: string }) => e.name)).toEqual(["Back Squat"]);
      const reread = parseProgramDays(stored);
      expect(programWarmup(reread)).toMatchObject({ off: true, exercises: [skips] });
      const backOn = applyWarmup(reread, programWarmup(reread), true);
      expect(programToWorkoutDays({ days: backOn })[0].exercises).toEqual(["A-Skips", "Back Squat"]);
    });

    it("leaves a day's own warm-up alone, including an empty one that skips it", () => {
      const withOwn = [
        trainingDay("Monday", [{ name: "Warm-up", kind: "warmup", exercises: [lunge] }, ...plainSections([squat])]),
        trainingDay("Wednesday", [{ name: "Warm-up", kind: "warmup", exercises: [] }, ...plainSections([plank])]),
        trainingDay("Friday", plainSections([squat]))
      ];
      const days = applyWarmup(withOwn, warmup, true);
      expect(dayWarmup(days[0])?.exercises).toEqual([lunge]);
      expect(dayWarmup(days[1])?.exercises).toEqual([]);
      expect(dayWarmup(days[2])).toMatchObject({ shared: true, exercises: [skips] });
      // The skipped day shows no warm-up to athletes.
      expect(programToWorkoutDays({ days }).find((d) => d.day === "Wednesday")?.exercises).toEqual(["Planks"]);
    });

    it("isn't added anywhere while it's empty", () => {
      const days = applyWarmup(week, { ...warmup, exercises: [] }, true);
      expect(days.every((d) => dayWarmup(d) === undefined)).toBe(true);
    });
  });
});
