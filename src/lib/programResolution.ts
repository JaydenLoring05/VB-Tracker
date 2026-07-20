import { WorkoutDay } from "@/types";

export type PhaseSlug = "foundation" | "build" | "power" | "taper";

export type TeamOverrideData = {
  planTier: "pilot" | "paid";
  exerciseDefaults: Record<string, string>;
  dayOverrides: Record<string, string[]>;
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

/**
 * Resolution order: athlete's personal substitution -> team's full day edit
 * (paid tier only, if that day has one) -> team's per-exercise preset
 * default (pilot tier only, if set) -> the plan's original exercise.
 */
export function resolveWorkoutDays(
  days: WorkoutDay[],
  week: number,
  team: TeamOverrideData | null,
  substitutions: Record<string, string>
): WorkoutDay[] {
  if (!team) {
    return days.map((day) => ({
      ...day,
      exercises: day.exercises.map((exercise) => substitutions[exercise] ?? exercise)
    }));
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
