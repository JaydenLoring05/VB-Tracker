import { describe, expect, it } from "vitest";

import {
  estimatedMaxByExercise,
  estimateOneRepMax,
  parseTargetPercent,
  weightForPercent
} from "@/lib/percentOfMax";

describe("estimateOneRepMax", () => {
  it("treats a single as its own max and estimates from more reps", () => {
    expect(estimateOneRepMax(225, 1)).toBe(225);
    expect(estimateOneRepMax(200, 5)).toBeCloseTo(233.33, 1);
  });

  it("gives nothing for missing weight, no reps, or high-rep sets", () => {
    expect(estimateOneRepMax(null, 5)).toBeNull();
    expect(estimateOneRepMax(0, 5)).toBeNull();
    expect(estimateOneRepMax(135, null)).toBeNull();
    expect(estimateOneRepMax(135, 0)).toBeNull();
    expect(estimateOneRepMax(95, 20)).toBeNull();
  });
});

describe("estimatedMaxByExercise", () => {
  it("keeps the best estimate per exercise, not the heaviest weight", () => {
    const max = estimatedMaxByExercise([
      { exercise: "Back Squat", weight: 225, reps: 1 },
      { exercise: "Back Squat", weight: 215, reps: 5 },
      { exercise: "Bench Press", weight: 155, reps: 8 },
      { exercise: "Plank", weight: null, reps: null }
    ]);
    expect(Math.round(max["Back Squat"])).toBe(251);
    expect(Math.round(max["Bench Press"])).toBe(196);
    expect(max).not.toHaveProperty("Plank");
  });
});

describe("weightForPercent", () => {
  it("rounds to the nearest 5", () => {
    expect(weightForPercent(225, 75)).toBe(170);
    expect(weightForPercent(233.33, 80)).toBe(185);
  });
});

describe("parseTargetPercent", () => {
  it("reads the percent from a target", () => {
    expect(parseTargetPercent("5x5 @ 75%")).toBe(75);
    expect(parseTargetPercent("3x3@82.5%")).toBe(82.5);
    expect(parseTargetPercent("3x8")).toBeNull();
    expect(parseTargetPercent("3x30 sec")).toBeNull();
  });
});
