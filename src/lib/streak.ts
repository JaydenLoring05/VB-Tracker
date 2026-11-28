/**
 * Daily training streak with freeze tokens (G-01). Pure and replayed from
 * the athlete's finished-workout dates every time, so nothing is stored and
 * nothing can be faked.
 *
 * Rules:
 * - A day with a finished workout adds 1 to the streak.
 * - Every Monday-to-Sunday week with at least FREEZE_EARN_WORKOUTS workouts
 *   earns one freeze, credited at the end of that Sunday. At most
 *   MAX_FREEZES are banked.
 * - A missed day spends a freeze if one is banked: the streak survives (it
 *   doesn't grow). With none banked, the streak resets to 0.
 * - Today never breaks the streak: it's still going until midnight.
 */

export const FREEZE_EARN_WORKOUTS = 3;
export const MAX_FREEZES = 2;

export type StreakState = {
  /** Days in the current streak (frozen days don't count). */
  current: number;
  /** Freezes banked right now. */
  freezes: number;
  /** Days a freeze saved the streak, oldest first. */
  frozenDays: string[];
  /** True when today already has a workout. */
  trainedToday: boolean;
  /** True when a freeze saved the streak yesterday (worth telling the athlete). */
  frozeYesterday: boolean;
};

const ISO = /^\d{4}-\d{2}-\d{2}$/;

function toDay(iso: string): number {
  const [y, m, d] = iso.split("-").map(Number);
  return Math.floor(Date.UTC(y, m - 1, d) / 86_400_000);
}

function toIso(day: number): string {
  return new Date(day * 86_400_000).toISOString().slice(0, 10);
}

/** 0 = Monday ... 6 = Sunday. 1970-01-01 (day 0) was a Thursday. */
function weekday(day: number): number {
  return (day + 3) % 7;
}

export function computeStreak(workoutDates: string[], todayIso: string): StreakState {
  const empty: StreakState = { current: 0, freezes: 0, frozenDays: [], trainedToday: false, frozeYesterday: false };
  if (!ISO.test(todayIso)) return empty;
  const today = toDay(todayIso);
  const trained = new Set(workoutDates.filter((d) => ISO.test(d)).map(toDay).filter((d) => d <= today));
  if (trained.size === 0) return empty;

  let streak = 0;
  let freezes = 0;
  let weekWorkouts = 0;
  const frozenDays: number[] = [];
  const start = Math.min(...trained);

  for (let day = start; day <= today; day++) {
    if (trained.has(day)) {
      streak++;
      weekWorkouts++;
    } else if (day !== today) {
      if (streak > 0 && freezes > 0) {
        freezes--;
        frozenDays.push(day);
      } else {
        streak = 0;
      }
    }
    if (weekday(day) === 6) {
      if (weekWorkouts >= FREEZE_EARN_WORKOUTS) freezes = Math.min(MAX_FREEZES, freezes + 1);
      weekWorkouts = 0;
    }
  }

  return {
    current: streak,
    freezes,
    frozenDays: frozenDays.map(toIso),
    trainedToday: trained.has(today),
    frozeYesterday: streak > 0 && frozenDays.at(-1) === today - 1
  };
}
