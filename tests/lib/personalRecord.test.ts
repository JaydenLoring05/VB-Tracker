import { describe, expect, it } from "vitest";

import { bestMarksByExercise, detectPersonalRecord, personalRecordEntry } from "@/lib/personalRecord";

describe("detectPersonalRecord", () => {
  it("counts a first-ever weighted set as a weight PR", () => {
    expect(detectPersonalRecord({ weight: 95, seconds: null, previousMaxWeight: undefined })).toBe("weight");
  });

  it("counts a first-ever timed set as a hold PR", () => {
    expect(detectPersonalRecord({ weight: null, seconds: 30, previousMaxSeconds: undefined })).toBe("hold");
  });

  it("does not count a tie on weight", () => {
    expect(detectPersonalRecord({ weight: 135, seconds: null, previousMaxWeight: 135 })).toBeNull();
  });

  it("does not count a tie on hold time", () => {
    expect(detectPersonalRecord({ weight: null, seconds: 45, previousMaxSeconds: 45 })).toBeNull();
  });

  it("counts a heavier set", () => {
    expect(detectPersonalRecord({ weight: 140, seconds: null, previousMaxWeight: 135 })).toBe("weight");
  });

  it("does not count a lighter set", () => {
    expect(detectPersonalRecord({ weight: 120, seconds: null, previousMaxWeight: 135 })).toBeNull();
  });

  it("counts a longer hold", () => {
    expect(detectPersonalRecord({ weight: null, seconds: 60, previousMaxSeconds: 45 })).toBe("hold");
  });

  it("judges a weighted timed set on weight only", () => {
    // Longer hold but the same weight: not a PR, because weighted sets PR on weight.
    expect(
      detectPersonalRecord({ weight: 25, seconds: 90, previousMaxWeight: 25, previousMaxSeconds: 30 })
    ).toBeNull();
    // Heavier weight with a shorter hold: a weight PR.
    expect(
      detectPersonalRecord({ weight: 35, seconds: 10, previousMaxWeight: 25, previousMaxSeconds: 30 })
    ).toBe("weight");
  });

  it("returns null when weight and seconds are both null", () => {
    expect(detectPersonalRecord({ weight: null, seconds: null })).toBeNull();
    expect(detectPersonalRecord({ weight: null, seconds: null, previousMaxWeight: 0, previousMaxSeconds: 0 })).toBeNull();
  });

  it("does not count a zero weight or zero-second hold with no history", () => {
    expect(detectPersonalRecord({ weight: 0, seconds: null })).toBeNull();
    expect(detectPersonalRecord({ weight: null, seconds: 0 })).toBeNull();
  });
});

describe("bestMarksByExercise", () => {
  it("returns empty maps for no history", () => {
    expect(bestMarksByExercise([])).toEqual({ maxWeight: {}, maxSeconds: {} });
  });

  it("keeps the heaviest weight and longest hold per exercise and skips nulls", () => {
    const result = bestMarksByExercise([
      { exercise: "Squat", weight: 135, seconds: null },
      { exercise: "Squat", weight: 155, seconds: null },
      { exercise: "Squat", weight: null, seconds: null },
      { exercise: "Plank", weight: null, seconds: 45 },
      { exercise: "Plank", weight: null, seconds: 30 },
      { exercise: "Plank", weight: null }
    ]);
    expect(result).toEqual({ maxWeight: { Squat: 155 }, maxSeconds: { Plank: 45 } });
  });
});

describe("personalRecordEntry", () => {
  it("formats a weight PR with reps", () => {
    expect(personalRecordEntry("weight", { exercise: "Squat", weight: 185, reps: 5, seconds: null })).toEqual({
      exercise: "Squat",
      value: "185 x 5",
      unit: "lbs",
      note: "Set during Workout Mode"
    });
  });

  it("formats a weight PR without reps", () => {
    expect(personalRecordEntry("weight", { exercise: "Squat", weight: 185, reps: null, seconds: null }).value).toBe("185");
  });

  it("formats a hold PR", () => {
    expect(personalRecordEntry("hold", { exercise: "Plank", weight: null, reps: null, seconds: 75 })).toEqual({
      exercise: "Plank",
      value: "75",
      unit: "sec",
      note: "Longest hold, set during Workout Mode"
    });
  });
});
