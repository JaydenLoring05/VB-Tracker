import { describe, expect, it } from "vitest";

import { getWorkoutDays } from "@/data/workoutPlan";
import {
  CONTINUE_WORKOUT_LABEL,
  REST_DAY_WORKOUT_LABEL,
  START_WORKOUT_LABEL,
  WORKOUT_CTA_HREF,
  WORKOUT_CTA_LABELS,
  todayWorkoutCta
} from "@/lib/dashboardCta";
import { resolveWorkoutDays } from "@/lib/programResolution";

const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

// One week from each phase, so a phase that stopped resting on Sunday is caught.
const PHASE_WEEKS: Record<string, number> = { foundation: 1, build: 5, power: 9, taper: 17 };

/** What the athlete dashboard (and /demo's athlete view) shows on a given day. */
function ctaOn(week: number, today: string, hasOpenSession = false) {
  // The same lookup DashboardCards does, with the demo's empty override and substitutions.
  const todayWorkout = resolveWorkoutDays(getWorkoutDays(week), week, null, {}).find((day) => day.day === today);
  return todayWorkoutCta(todayWorkout, hasOpenSession);
}

describe("todayWorkoutCta", () => {
  it("always offers a way into /workout, on every day of every phase", () => {
    for (const [phase, week] of Object.entries(PHASE_WEEKS)) {
      for (const day of WEEKDAYS) {
        const cta = ctaOn(week, day);
        expect(cta.href, `${phase} ${day}`).toBe(WORKOUT_CTA_HREF);
        expect(WORKOUT_CTA_LABELS, `${phase} ${day}`).toContain(cta.label);
      }
    }
  });

  // The regression: e2e/demo-workout-and-film.spec.ts looked for "Start today"
  // only, so it timed out every Sunday and turned CI red on any PR opened then.
  it("shows the rest-day link, not a Start button, on Sunday in every phase", () => {
    for (const [phase, week] of Object.entries(PHASE_WEEKS)) {
      const cta = ctaOn(week, "Sunday");
      expect(cta.isRestDay, phase).toBe(true);
      expect(cta.label, phase).toBe(REST_DAY_WORKOUT_LABEL);
      expect(cta.prominent, phase).toBe(false);
    }
  });

  it("shows Start Today's Workout on a training day", () => {
    const cta = ctaOn(PHASE_WEEKS.power, "Monday");
    expect(cta.isRestDay).toBe(false);
    expect(cta.label).toBe(START_WORKOUT_LABEL);
    expect(cta.prominent).toBe(true);
  });

  it("offers Continue Workout when a session is part-finished, rest day or not", () => {
    for (const day of ["Monday", "Sunday"]) {
      const cta = ctaOn(PHASE_WEEKS.power, day, true);
      expect(cta.label, day).toBe(CONTINUE_WORKOUT_LABEL);
      expect(cta.prominent, day).toBe(true);
    }
  });

  it("treats a weekday the program never lists as a rest day", () => {
    const cta = todayWorkoutCta(undefined, false);
    expect(cta.isRestDay).toBe(true);
    expect(cta.label).toBe(REST_DAY_WORKOUT_LABEL);
  });
});
