import { describe, expect, it } from "vitest";

import { getWorkoutDays } from "@/data/workoutPlan";
import type { ProgramDay } from "@/lib/customProgram";
import { missedAssignedWorkouts } from "@/lib/missedWorkouts";

const day = (name: string, rest: boolean): ProgramDay => ({
  day: name,
  title: rest ? "Rest" : "Lift",
  notes: "",
  minutes: "",
  rest,
  exercises: rest ? [] : [{ name: "Box Jumps", sets: 3, reps: "5", seconds: null }]
});

describe("missedAssignedWorkouts", () => {
  it("uses the coach program's training days when one is assigned", () => {
    // Trains Monday and Wednesday only; every other day is missing, so rest.
    const program = [day("Monday", false), day("Tuesday", true), day("Wednesday", false)];
    const result = missedAssignedWorkouts({
      startDate: "2026-10-05",
      today: "2026-10-12", // the next Monday: the window is Oct 5-11
      programDays: program,
      completed: [{ week: 1, day: "Monday" }]
    });
    expect(result).toEqual({ assigned: 2, missed: 1 });
  });

  it("uses the recommended plan's rest days when no program is assigned", () => {
    const trainingDays = getWorkoutDays(1).filter((d) => !d.rest).map((d) => d.day);
    const result = missedAssignedWorkouts({
      startDate: "2026-10-05",
      today: "2026-10-12",
      programDays: null,
      completed: []
    });
    expect(result).toEqual({ assigned: trainingDays.length, missed: trainingDays.length });
  });

  it("assigns nothing after the 20-week recommended plan ends", () => {
    const result = missedAssignedWorkouts({
      startDate: "2026-01-05",
      today: "2026-10-12",
      programDays: null,
      completed: []
    });
    expect(result).toEqual({ assigned: 0, missed: 0 });
  });

  it("keeps assigning a coach program after 20 weeks, since it repeats", () => {
    const result = missedAssignedWorkouts({
      startDate: "2026-01-05",
      today: "2026-10-12",
      programDays: [day("Monday", false)],
      completed: []
    });
    expect(result).toEqual({ assigned: 1, missed: 1 });
  });
});
