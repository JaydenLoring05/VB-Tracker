import { CustomProgram, programToWorkoutDays } from "@/lib/customProgram";
import { adaptWorkoutDays, DEFAULT_TRAINING_PROFILE, TrainingProfile } from "@/lib/trainingProfile";
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
  if (!day.targets && !day.adaptNotes) return { ...day, exercises };
  // Keep the coach's target attached to the exercise the athlete swapped in.
  // A profile note only stays on an exercise the athlete didn't swap away.
  const targets: Record<string, string> = {};
  const adaptNotes: Record<string, string> = {};
  day.exercises.forEach((exercise, index) => {
    const target = day.targets?.[exercise];
    if (target) targets[exercises[index]] = target;
    const note = day.adaptNotes?.[exercise];
    if (note && exercises[index] === exercise) adaptNotes[exercise] = note;
  });
  const result: WorkoutDay = { ...day, exercises };
  if (day.targets) result.targets = targets;
  if (day.adaptNotes) {
    if (Object.keys(adaptNotes).length > 0) result.adaptNotes = adaptNotes;
    else delete result.adaptNotes;
  }
  return result;
}

/**
 * A coach-built program replaces the recommended plan entirely (its own
 * days, exercises and targets); the athlete's personal swaps still apply.
 *
 * Otherwise, resolution order: athlete's personal substitution -> team's full day edit
 * (paid tier only, if that day has one) -> team's per-exercise preset
 * default (pilot tier only, if set) -> the plan's original exercise.
 *
 * The athlete's training profile (level and injuries, F-31) adapts the
 * team-resolved week before personal swaps, so an injury swap always wins
 * over the plan or the coach's defaults but the athlete can still swap by hand.
 */
export function resolveWorkoutDays(
  days: WorkoutDay[],
  week: number,
  team: TeamOverrideData | null,
  substitutions: Record<string, string>,
  profile: TrainingProfile = DEFAULT_TRAINING_PROFILE
): WorkoutDay[] {
  if (team?.customProgram) {
    return adaptWorkoutDays(programToWorkoutDays(team.customProgram), week, profile, { coachProgram: true }).map(
      (day) => applySubstitutions(day, substitutions)
    );
  }

  if (!team) {
    return adaptWorkoutDays(days, week, profile).map((day) => applySubstitutions(day, substitutions));
  }

  const phase = phaseSlug(week);

  const teamDays = days.map((day) => {
    const fullOverride =
      team.planTier === "paid" ? team.dayOverrides[dayOverrideKey(phase, day.day)] : undefined;

    const exercises =
      fullOverride ??
      day.exercises.map((exercise) =>
        team.planTier === "pilot" && team.exerciseDefaults[exercise]
          ? team.exerciseDefaults[exercise]
          : exercise
      );

    return { ...day, exercises };
  });

  return adaptWorkoutDays(teamDays, week, profile).map((day) => applySubstitutions(day, substitutions));
}
