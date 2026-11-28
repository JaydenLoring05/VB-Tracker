/**
 * Weight targets as a percent of an athlete's max ("5x5 @ 75%"), worked out
 * per athlete from their own logged sets (F-27, part 2).
 *
 * The max is an estimate from the athlete's best set, not the heaviest
 * weight ever lifted: 200 lb for 5 reps is worth more than 200 lb for 1, so
 * "75% of the heaviest weight" would come out too light.
 */

/** Sets of more reps than this say little about a one-rep max, so they're ignored. */
export const MAX_REPS_FOR_ESTIMATE = 12;

/** Plates go up in 5 lb, so suggested weights do too. */
export const WEIGHT_STEP = 5;

/**
 * Estimated one-rep max from one set (Epley: weight × (1 + reps / 30)). A
 * single is its own max. Null when the set can't give an estimate.
 */
export function estimateOneRepMax(weight: number | null, reps: number | null): number | null {
  if (weight == null || reps == null || !Number.isFinite(weight) || !Number.isFinite(reps)) return null;
  if (weight <= 0 || reps < 1 || reps > MAX_REPS_FOR_ESTIMATE) return null;
  if (reps === 1) return weight;
  return weight * (1 + reps / 30);
}

/** The best estimated max per exercise from logged sets. Exercises with no usable set are left out. */
export function estimatedMaxByExercise(
  sets: { exercise: string; weight: number | null; reps: number | null }[]
): Record<string, number> {
  const best: Record<string, number> = {};
  for (const set of sets) {
    const estimate = estimateOneRepMax(set.weight, set.reps);
    if (estimate != null && estimate > (best[set.exercise] ?? 0)) best[set.exercise] = estimate;
  }
  return best;
}

/** The weight to lift for a percent of a max, rounded to the nearest 5 lb. */
export function weightForPercent(max: number, percent: number): number {
  return Math.round((max * percent) / 100 / WEIGHT_STEP) * WEIGHT_STEP;
}

/** The percent in a target such as "5x5 @ 75%", or null when there isn't one. */
export function parseTargetPercent(target: string): number | null {
  const match = target.match(/@\s*(\d+(?:\.\d+)?)\s*%/);
  if (!match) return null;
  const percent = Number(match[1]);
  return percent > 0 ? percent : null;
}
