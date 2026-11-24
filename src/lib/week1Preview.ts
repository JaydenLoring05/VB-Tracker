import { getWorkoutDays } from "@/data/workoutPlan";
import { resolveWorkoutDays } from "@/lib/programResolution";
import { applyStartingProgram, startingProgramKeyForPosition } from "@/lib/positionProgram";
import { AGE_GROUPS, TRAINING_LEVELS, type TrainingProfile } from "@/lib/trainingProfile";

/**
 * Week 1 of the plan the athlete just set up, shown read-only at the end of
 * onboarding, before any paywall. It runs the same resolution the dashboard
 * uses (starting program from position, then level / age / injury changes),
 * so what they preview is what they get.
 */
export type Week1Day = {
  day: string;
  title: string;
  minutes: string;
  rest: boolean;
  /** The first few exercises, for a glance. */
  highlights: string[];
  moreCount: number;
};

export type Week1Preview = {
  days: Week1Day[];
  /** "Outside hitter · Intermediate · 14-17", for the header. */
  summary: string;
};

const HIGHLIGHTS = 3;

export function week1Preview(input: {
  sport: string;
  position: string;
  positionLabel: string;
  profile: TrainingProfile;
}): Week1Preview {
  const key = input.sport === "volleyball" ? startingProgramKeyForPosition(input.position) : null;
  const days = resolveWorkoutDays(getWorkoutDays(1), 1, applyStartingProgram(null, key), {}, input.profile).map(
    (day): Week1Day => ({
      day: day.day,
      title: day.title,
      minutes: day.minutes,
      rest: Boolean(day.rest) || day.exercises.length === 0,
      highlights: day.exercises.slice(0, HIGHLIGHTS),
      moreCount: Math.max(0, day.exercises.length - HIGHLIGHTS)
    })
  );

  const level = TRAINING_LEVELS.find((option) => option.value === input.profile.level)?.label;
  const age = AGE_GROUPS.find((option) => option.value === input.profile.ageGroup)?.label;
  return { days, summary: [input.positionLabel, level, age].filter(Boolean).join(" · ") };
}
