import { describe, expect, it } from "vitest";

import { getPrescription, getWorkoutDays } from "@/data/workoutPlan";
import { formatSeconds, formatSetValue, getExerciseMeasure, parseTargetSeconds } from "@/lib/exerciseMeasure";

describe("getExerciseMeasure", () => {
  it("treats planks, holds and stretches as time", () => {
    for (const name of ["Planks", "Side Planks", "Hollow Hold", "Deep Squat Holds", "Couch Stretch", "Full-Body Mobility Flow"]) {
      expect(getExerciseMeasure(name), name).toBe("time");
    }
  });

  it("keeps rep-based lifts and CARs as reps", () => {
    for (const name of ["Back Squat", "Pull-Ups", "Box Jumps", "Hip CARs", "Dead Bugs"]) {
      expect(getExerciseMeasure(name), name).toBe("reps");
    }
  });

  it("recognizes coach-written timed exercises by name", () => {
    expect(getExerciseMeasure("Copenhagen Plank")).toBe("time");
    expect(getExerciseMeasure("Wall Sit")).toBe("time");
    expect(getExerciseMeasure("Isometric Split Squat")).toBe("time");
  });
});

describe("timed prescriptions in the plan", () => {
  it("gives every timed exercise a prescription in seconds or minutes", () => {
    for (let week = 1; week <= 20; week++) {
      for (const day of getWorkoutDays(week)) {
        for (const exercise of day.exercises) {
          if (getExerciseMeasure(exercise) !== "time") continue;
          const prescription = getPrescription(week, exercise);
          expect(parseTargetSeconds(prescription), `week ${week} ${exercise}: ${prescription}`).not.toBeNull();
        }
      }
    }
  });

  it("progresses plank holds by phase", () => {
    expect(getPrescription(1, "Planks")).toBe("3x20-30 sec");
    expect(getPrescription(6, "Planks")).toBe("3x30-45 sec");
    expect(getPrescription(12, "Side Planks")).toBe("3x45-60 sec each side");
    expect(getPrescription(18, "Planks")).toBe("2-3x30 sec");
  });
});

describe("parseTargetSeconds", () => {
  it("uses the top of a seconds range", () => {
    expect(parseTargetSeconds("3x30-45 sec")).toBe(45);
    expect(parseTargetSeconds("3x60 sec")).toBe(60);
  });

  it("uses the bottom of a minutes range", () => {
    expect(parseTargetSeconds("10-20 min")).toBe(600);
  });

  it("returns null for rep prescriptions", () => {
    expect(parseTargetSeconds("3-4x8")).toBeNull();
    expect(parseTargetSeconds("3-5 sets")).toBeNull();
  });
});

describe("formatting", () => {
  it("formats seconds", () => {
    expect(formatSeconds(45)).toBe("45s");
    expect(formatSeconds(90)).toBe("1:30");
    expect(formatSeconds(600)).toBe("10 min");
  });

  it("formats logged sets", () => {
    expect(formatSetValue({ weight: 135, reps: 8 })).toBe("135 x 8");
    expect(formatSetValue({ weight: null, reps: 8 })).toBe("8 reps");
    expect(formatSetValue({ weight: null, reps: null, seconds: 45 })).toBe("45s");
    expect(formatSetValue({ weight: 25, reps: null, seconds: 40 })).toBe("25 x 40s");
    expect(formatSetValue({ weight: null, reps: null })).toBe("-");
  });
});
