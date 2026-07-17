"use client";

import { exercises } from "@/data/exercises";
import { useTrackerContext } from "@/context/TrackerContext";
import { Exercise } from "@/types";

export function resolveExercise(original: string, substitutions: Record<string, string>) {
  return substitutions[original] ?? original;
}

/**
 * Only offers exercises that have a full catalog entry (icon, cues, category,
 * etc.) -- some free-text names in an exercise's own `substitutions` list
 * (e.g. "Assisted Chin-Up") don't have a dedicated entry yet, so they're
 * left out of the picker rather than swapping an athlete onto an exercise
 * with no coaching info behind it.
 */
export function getSubstitutionCandidates(original: string): Exercise[] {
  const canonical = exercises.find((exercise) => exercise.name === original);
  if (!canonical) return [];

  const curatedNames = new Set(canonical.substitutions);
  const curated = exercises.filter((exercise) => curatedNames.has(exercise.name));
  const sameCategory = exercises.filter(
    (exercise) =>
      exercise.category === canonical.category &&
      exercise.name !== canonical.name &&
      !curatedNames.has(exercise.name)
  );

  return [...curated, ...sameCategory];
}

export function useExerciseSubstitutions() {
  const { substitutions, setSubstitution, clearSubstitution } = useTrackerContext();

  return {
    substitutions,
    setSubstitution,
    clearSubstitution,
    resolveExercise: (original: string) => resolveExercise(original, substitutions)
  };
}
