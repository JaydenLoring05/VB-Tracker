import { getWorkoutDays } from "@/data/workoutPlan";
import type { ProgramDay } from "@/lib/customProgram";
import { assignedDaysInWindow, countMissedAssignedDays } from "@/lib/programSchedule";

/** Length of the recommended plan in src/data/workoutPlan.ts. */
export const RECOMMENDED_PLAN_WEEKS = 20;

/**
 * How many of the training days an athlete's program assigned in the last 7
 * days (not counting today) have no completed session.
 *
 * `programDays` is the coach-built program the athlete is assigned (a
 * repeating week; a day it doesn't list is a rest day), or null for the
 * recommended 20-week plan.
 */
export function missedAssignedWorkouts({
  startDate,
  today,
  programDays,
  completed
}: {
  startDate: string;
  today: string;
  programDays: ProgramDay[] | null;
  completed: { week: number; day: string }[];
}): { assigned: number; missed: number } {
  const isTrainingDay = programDays
    ? (_week: number, day: string) => programDays.some((d) => d.day === day && !d.rest)
    : (week: number, day: string) => getWorkoutDays(week).some((d) => d.day === day && !d.rest);

  const assigned = assignedDaysInWindow({
    startDate,
    today,
    isTrainingDay,
    totalWeeks: programDays ? undefined : RECOMMENDED_PLAN_WEEKS
  });

  return countMissedAssignedDays(assigned, completed);
}
