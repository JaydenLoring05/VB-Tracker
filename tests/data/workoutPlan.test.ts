import { describe, expect, it } from "vitest";

import { exercises, getExercise } from "@/data/exercises";
import { getPhase, getPrescription, getWorkoutDays, getWorkoutDaysForPhase } from "@/data/workoutPlan";
import { phaseSlug } from "@/lib/programResolution";

const WEEKS = Array.from({ length: 20 }, (_, index) => index + 1);
const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

describe("20-week plan", () => {
  it("has a plan for every week, each with the seven weekdays once", () => {
    for (const week of WEEKS) {
      const days = getWorkoutDays(week);
      expect(days.map((day) => day.day).sort(), `week ${week}`).toEqual([...WEEKDAYS].sort());
    }
  });

  it("gives every day exercises (rest days carry light recovery work) and flags at least one rest day", () => {
    for (const week of WEEKS) {
      const days = getWorkoutDays(week);
      for (const day of days) {
        expect(day.exercises.length, `week ${week} ${day.day}`).toBeGreaterThan(0);
        expect(day.title, `week ${week} ${day.day}`).toBeTruthy();
      }
      expect(days.filter((day) => day.rest).length, `week ${week}`).toBeGreaterThanOrEqual(1);
    }
  });

  it("only schedules exercises that exist in the exercise library", () => {
    const missing = new Set<string>();
    for (const week of WEEKS) {
      for (const day of getWorkoutDays(week)) {
        for (const exercise of day.exercises) {
          if (!getExercise(exercise)) missing.add(exercise);
        }
      }
    }
    expect([...missing]).toEqual([]);
  });

  it("agrees with phaseSlug on which phase a week belongs to", () => {
    for (const week of WEEKS) {
      expect(getWorkoutDays(week)).toBe(getWorkoutDaysForPhase(phaseSlug(week)));
    }
  });

  it("names the four phases at the documented boundaries", () => {
    expect(getPhase(1).name).toBe("Foundation Phase");
    expect(getPhase(4).name).toBe("Foundation Phase");
    expect(getPhase(5).name).toBe("Build Phase");
    expect(getPhase(8).name).toBe("Build Phase");
    expect(getPhase(9).name).toBe("Power Phase");
    expect(getPhase(16).name).toBe("Power Phase");
    expect(getPhase(17).name).toBe("Taper Phase");
    expect(getPhase(20).name).toBe("Taper Phase");
  });
});

describe("getPrescription", () => {
  it("always returns a prescription", () => {
    for (const week of WEEKS) {
      for (const day of getWorkoutDays(week)) {
        for (const exercise of day.exercises) {
          expect(getPrescription(week, exercise), `week ${week} ${exercise}`).toBeTruthy();
        }
      }
    }
  });

  it("scales jump volume with the phase", () => {
    expect(getPrescription(1, "Box Jump")).toBe("3x3");
    expect(getPrescription(5, "Box Jump")).toBe("4x3");
    expect(getPrescription(9, "Box Jump")).toBe("5x3");
    expect(getPrescription(17, "Box Jump")).toBe("3x3");
  });

  it("uses fixed prescriptions for landing, prehab, mobility and isometrics", () => {
    expect(getPrescription(9, "Landing Mechanics Drill")).toBe("3x5 quality landings");
    expect(getPrescription(9, "Banded Clamshell")).toBe("2-3x10-15 each side");
    expect(getPrescription(9, "Hip Mobility Flow")).toBe("10-20 min");
    expect(getPrescription(9, "Spanish Squat")).toBe("3x30-45 sec");
  });

  it("uses strength rep schemes that change by week", () => {
    expect(getPrescription(1, "Back Squat")).toBe("2-3x10");
    expect(getPrescription(6, "Back Squat")).toBe("3-4x8");
    expect(getPrescription(10, "Back Squat")).toBe("4x6");
    expect(getPrescription(14, "Back Squat")).toBe("4-5x5");
    expect(getPrescription(18, "Back Squat")).toBe("2-3x8");
  });
});

describe("exercise library", () => {
  it("has unique names", () => {
    const names = exercises.map((exercise) => exercise.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it("has complete entries", () => {
    for (const exercise of exercises) {
      expect(exercise.name, exercise.name).toBeTruthy();
      expect(exercise.purpose, exercise.name).toBeTruthy();
      expect(exercise.cues.length, exercise.name).toBeGreaterThan(0);
      expect(["Beginner", "Intermediate", "Advanced"], exercise.name).toContain(exercise.level);
    }
  });

  it("looks exercises up by name", () => {
    const [first] = exercises;
    expect(getExercise(first.name)).toBe(first);
    expect(getExercise("Not A Real Exercise")).toBeUndefined();
  });
});
