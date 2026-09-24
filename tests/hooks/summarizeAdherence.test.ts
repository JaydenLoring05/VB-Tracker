import { describe, expect, it } from "vitest";

import { getWorkoutDays } from "@/data/workoutPlan";
import { summarizeAdherence, type CompletedSession } from "@/hooks/useAthleteAdherence";

const session = (id: string, durationSeconds: number | null): CompletedSession => ({
  id,
  week: 3,
  day: "Monday",
  ended_at: "2026-07-20T18:00:00Z",
  duration_seconds: durationSeconds
});

// Same definition as the hook: every non-rest exercise across the 20 weeks.
function plannedExercises() {
  let total = 0;
  for (let week = 1; week <= 20; week++) {
    for (const day of getWorkoutDays(week)) if (!day.rest) total += day.exercises.length;
  }
  return total;
}

describe("summarizeAdherence", () => {
  it("summarizes an athlete with no history", () => {
    expect(summarizeAdherence([], 0)).toEqual({
      sessions: [],
      totalSessions: 0,
      totalMinutesTrained: 0,
      exercisesCompleted: 0,
      exercisesPlanned: plannedExercises(),
      completionPercent: 0
    });
  });

  it("counts sessions and rounds total minutes", () => {
    const summary = summarizeAdherence([session("a", 45 * 60), session("b", 50 * 60 + 40), session("c", null)], 10);

    expect(summary.totalSessions).toBe(3);
    // 45 min + 50m40s + null (counted as 0) = 95m40s -> 96
    expect(summary.totalMinutesTrained).toBe(96);
  });

  it("computes completion percent from planned exercises", () => {
    const planned = plannedExercises();
    expect(planned).toBeGreaterThan(100);

    expect(summarizeAdherence([], Math.round(planned / 2)).completionPercent).toBe(50);
    expect(summarizeAdherence([], planned).completionPercent).toBe(100);
  });

  it("caps completion at 100% when more exercises are checked than planned", () => {
    expect(summarizeAdherence([], plannedExercises() * 2).completionPercent).toBe(100);
  });
});
