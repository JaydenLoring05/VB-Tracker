import { CustomProgram, programToWorkoutDays } from "@/lib/customProgram";
import { WorkoutDay } from "@/types";

export type PhaseSlug = "foundation" | "build" | "power" | "taper";

export type TeamOverrideData = {
  planTier: "pilot" | "paid";
  exerciseDefaults: Record<string, string>;
  dayOverrides: Record<string, string[]>;
  /** The coach-built program assigned to this athlete, if any (schema_v43). */
  customProgram?: Pick<CustomProgram, "id" | "name" | "days"> | null;
};

export function phaseSlug(week: number): PhaseSlug {
  if (week <= 4) return "foundation";
  if (week <= 8) return "build";
  if (week <= 16) return "power";
  return "taper";
}

export function dayOverrideKey(phase: PhaseSlug, day: string) {
  return `${phase}-${day}`;
}

function applySubstitutions(day: WorkoutDay, substitutions: Record<string, string>): WorkoutDay {
  const exercises = day.exercises.map((exercise) => substitutions[exercise] ?? exercise);
  if (!day.targets) return { ...day, exercises };
  // Keep the coach's target attached to the exercise the athlete swapped in.
  const targets: Record<string, string> = {};
  day.exercises.forEach((exercise, index) => {
    const target = day.targets?.[exercise];
    if (target) targets[exercises[index]] = target;
  });
  return { ...day, exercises, targets };
}

/**
 * A coach-built program replaces the recommended plan entirely (its own
 * days, exercises and targets); the athlete's personal swaps still apply.
 *
 * Otherwise, resolution order: athlete's personal substitution -> team's full day edit
 * (paid tier only, if that day has one) -> team's per-exercise preset
 * default (pilot tier only, if set) -> the plan's original exercise.
 */
export function resolveWorkoutDays(
  days: WorkoutDay[],
  week: number,
  team: TeamOverrideData | null,
  substitutions: Record<string, string>
): WorkoutDay[] {
  if (team?.customProgram) {
    return programToWorkoutDays(team.customProgram).map((day) => applySubstitutions(day, substitutions));
  }

  if (!team) {
    return days.map((day) => applySubstitutions(day, substitutions));
  }

  const phase = phaseSlug(week);

  return days.map((day) => {
    const fullOverride =
      team.planTier === "paid" ? team.dayOverrides[dayOverrideKey(phase, day.day)] : undefined;

    const teamResolved =
      fullOverride ??
      day.exercises.map((exercise) =>
        team.planTier === "pilot" && team.exerciseDefaults[exercise]
          ? team.exerciseDefaults[exercise]
          : exercise
      );

    return {
      ...day,
      exercises: teamResolved.map((exercise) => substitutions[exercise] ?? exercise)
    };
  });
}
