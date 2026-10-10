import { describe, expect, it } from "vitest";

import { resumeExerciseIndex, targetSetCount } from "@/lib/workoutResume";

describe("targetSetCount", () => {
  it("reads the set count from a sets x reps target", () => {
    expect(targetSetCount("3x8")).toBe(3);
    expect(targetSetCount("5 x 5")).toBe(5);
    expect(targetSetCount("4x8-10")).toBe(4);
    expect(targetSetCount("3x45 sec")).toBe(3);
  });

  it("uses the top of a set range, so the athlete isn't moved on early", () => {
    expect(targetSetCount("3-4x8")).toBe(4);
    expect(targetSetCount("2 - 3 x 10")).toBe(3);
  });

  it("counts a bare duration as one set", () => {
    expect(targetSetCount("10-20 min")).toBe(1);
    expect(targetSetCount("45 sec")).toBe(1);
  });

  it("returns null when the target doesn't say", () => {
    expect(targetSetCount("")).toBeNull();
    expect(targetSetCount(null)).toBeNull();
    expect(targetSetCount(undefined)).toBeNull();
    expect(targetSetCount("as many as possible")).toBeNull();
  });
});

describe("resumeExerciseIndex", () => {
  const exercises = ["Back Squat", "RDL", "Planks", "Calf Raise"];
  const targets: Record<string, string> = { "Back Squat": "3x5", RDL: "3x8", Planks: "3x45 sec", "Calf Raise": "2x15" };
  const targetFor = (exercise: string) => targets[exercise];
  const logged = (...names: string[]) => names.map((exercise) => ({ exercise }));

  it("opens on the first exercise when nothing is logged", () => {
    expect(resumeExerciseIndex(exercises, [], targetFor)).toBe(0);
  });

  it("stays on an exercise that still has sets to go", () => {
    expect(resumeExerciseIndex(exercises, logged("Back Squat"), targetFor)).toBe(0);
    expect(resumeExerciseIndex(exercises, logged("Back Squat", "Back Squat", "Back Squat", "RDL"), targetFor)).toBe(1);
  });

  it("moves to the next exercise once the furthest one is done", () => {
    expect(resumeExerciseIndex(exercises, logged("Back Squat", "Back Squat", "Back Squat"), targetFor)).toBe(1);
  });

  it("goes by the furthest exercise with a set, even if earlier ones were skipped", () => {
    expect(resumeExerciseIndex(exercises, logged("Planks"), targetFor)).toBe(2);
    expect(resumeExerciseIndex(exercises, logged("Planks", "Planks", "Planks"), targetFor)).toBe(3);
  });

  it("stays on the last exercise when it is done, with nowhere further to go", () => {
    expect(resumeExerciseIndex(exercises, logged("Calf Raise", "Calf Raise"), targetFor)).toBe(3);
  });

  it("stays put when the target doesn't give a set count", () => {
    expect(resumeExerciseIndex(exercises, logged("RDL", "RDL", "RDL", "RDL"), () => "as many as possible")).toBe(1);
    expect(resumeExerciseIndex(exercises, logged("RDL"), () => undefined)).toBe(1);
  });

  it("ignores sets for exercises that aren't in today's list", () => {
    expect(resumeExerciseIndex(exercises, logged("Bench Press", "Bench Press"), targetFor)).toBe(0);
  });

  it("returns 0 for an empty day", () => {
    expect(resumeExerciseIndex([], logged("RDL"), targetFor)).toBe(0);
  });
});
