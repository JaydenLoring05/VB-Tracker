import type { WorkoutDay } from "@/types";

/**
 * The athlete dashboard's one big call to action. Which label it shows depends
 * on the day: every program phase makes Sunday a rest day, so on Sunday there
 * is no "Start Today's Workout" button at all, only a quieter link offering a
 * workout anyway. Both go to /workout.
 *
 * This lives here, not in the component, so tests (and the /demo end-to-end
 * spec) can ask what the dashboard shows on a given day without rendering React.
 */

export const START_WORKOUT_LABEL = "Start Today's Workout";
export const CONTINUE_WORKOUT_LABEL = "Continue Workout";
export const REST_DAY_WORKOUT_LABEL = "Want to train anyway? Pick a workout";

/** Every label `todayWorkoutCta` can return. The e2e spec builds its locator from this. */
export const WORKOUT_CTA_LABELS = [START_WORKOUT_LABEL, CONTINUE_WORKOUT_LABEL, REST_DAY_WORKOUT_LABEL] as const;

/** Where the call to action goes when no workout is in progress, rest day or not. */
export const WORKOUT_CTA_HREF = "/workout";

/** The Workout Mode screen for one session. */
export function workoutSessionHref(sessionId: string) {
  return `/workout/${sessionId}`;
}

export type WorkoutCta = {
  label: string;
  href: string;
  /** True when today's program has nothing to do: drives the "Recovery day" line. */
  isRestDay: boolean;
  /** True when the call to action is the big button rather than the quiet link. */
  prominent: boolean;
};

/**
 * @param todayWorkout Today's resolved program day, or undefined when the
 *   program doesn't list today at all. Both count as a rest day.
 * @param hasOpenSession True when the athlete left a workout part-finished.
 * @param openSessionId That workout's id. "Continue Workout" opens it directly.
 *   Without it the button falls back to /workout, which offers Resume.
 */
export function todayWorkoutCta(
  todayWorkout: WorkoutDay | undefined,
  hasOpenSession: boolean,
  openSessionId?: string | null
): WorkoutCta {
  const isRestDay = !todayWorkout || Boolean(todayWorkout.rest);

  if (hasOpenSession) {
    // Straight back into the workout. Sending the athlete to /workout put a
    // big "Start Workout" button under a small Resume banner, and tapping it
    // began a second, empty session, so it looked like nothing had saved.
    const href = openSessionId ? workoutSessionHref(openSessionId) : WORKOUT_CTA_HREF;
    return { label: CONTINUE_WORKOUT_LABEL, href, isRestDay, prominent: true };
  }
  if (isRestDay) {
    return { label: REST_DAY_WORKOUT_LABEL, href: WORKOUT_CTA_HREF, isRestDay, prominent: false };
  }
  return { label: START_WORKOUT_LABEL, href: WORKOUT_CTA_HREF, isRestDay, prominent: true };
}
