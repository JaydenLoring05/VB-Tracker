import { describe, expect, it } from "vitest";

import {
  blankProgram,
  exerciseFromPrescription,
  formatTarget,
  getExerciseTarget,
  hasStartingTargets,
  newProgramExercise,
  ownExercises,
  parseProgramDays,
  pickAssignedProgramId,
  ProgramAssignment,
  programFromRecommended,
  programToWorkoutDays,
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
          exercises: [
            { name: "Back Squat", sets: 4, reps: "5", seconds: null },
            { name: "Planks", sets: 3, reps: null, seconds: 45 }
          ]
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
    copy.days.forEach((day, i) => expect(day.exercises.map((e) => e.name)).toEqual(plan[i].exercises));
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
              exercises: [
                { name: "Squat", sets: 3, reps: "", seconds: null },
                { name: "squat", sets: 3, reps: "5", seconds: null }
              ]
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
        exercises: [{ name: "Planks", sets: 3, reps: null, seconds: 45 }]
      }
    ]);
    expect(parseProgramDays(null)).toEqual([]);
  });
});

describe("ownExercises", () => {
  const library = ["Back Squat", "Planks"];
  const day = (name: string, exercises: { name: string; sets: number; reps: string | null; seconds: number | null }[]) => ({
    days: [{ day: name, title: "Training", notes: "", minutes: "45", rest: false, exercises }]
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
