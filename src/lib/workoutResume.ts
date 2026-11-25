/**
 * Where Workout Mode should open when an athlete comes back to a workout
 * they left part-way through. Pure, so it can be tested without React.
 */

/**
 * How many sets a target asks for: "3x8" is 3, "3-4x8" is 4 (the top of the
 * range, so the athlete is only moved on once every set is clearly done),
 * "10-20 min" is 1. Null when the target doesn't say.
 */
export function targetSetCount(target: string | null | undefined): number | null {
  if (!target) return null;
  const sets = target.match(/^\s*(\d+)(?:\s*-\s*(\d+))?\s*x/i);
  if (sets) return Number(sets[2] ?? sets[1]);
  return /\d\s*(min|sec)/i.test(target) ? 1 : null;
}

/**
 * The exercise to show first. With nothing logged, the first one. Otherwise
 * the furthest exercise that has a set: stay on it while it still has sets
 * to go, and move to the next one once it is done. Exercises the athlete
 * skipped on the way are left for them to go back to.
 */
export function resumeExerciseIndex(
  exercises: string[],
  loggedSets: { exercise: string }[],
  targetFor: (exercise: string) => string | null | undefined
): number {
  if (exercises.length === 0) return 0;

  const counts = new Map<string, number>();
  for (const set of loggedSets) counts.set(set.exercise, (counts.get(set.exercise) ?? 0) + 1);

  let furthest = -1;
  exercises.forEach((exercise, index) => {
    if ((counts.get(exercise) ?? 0) > 0) furthest = index;
  });
  if (furthest === -1) return 0;

  const done = counts.get(exercises[furthest]) ?? 0;
  const wanted = targetSetCount(targetFor(exercises[furthest]));
  const finished = wanted != null && done >= wanted;

  return finished && furthest < exercises.length - 1 ? furthest + 1 : furthest;
}
