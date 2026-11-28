"use client";

import { useRouter } from "next/navigation";
import { useMemo } from "react";

import { exercises } from "@/data/exercises";
import { useTrackerContext } from "@/context/TrackerContext";
import { buildLibrary, filterLibrary, TeamExercise } from "@/lib/teamExercises";

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .trim();
}

const NO_TEAM_EXERCISES: TeamExercise[] = [];

/** `teamExercises` adds the team's own exercises (F-22) to the list the library shows. */
export function useExerciseLibrary(teamExercises: TeamExercise[] = NO_TEAM_EXERCISES) {
  const router = useRouter();

  const {
    selectedFilter,
    setSelectedFilter,
    selectedLevel,
    setSelectedLevel,
    exerciseSearch,
    setExerciseSearch,
    expandedExercises,
    toggleExerciseCard,
    setExpandedExercises
  } = useTrackerContext();

  const library = useMemo(() => buildLibrary(teamExercises), [teamExercises]);

  const filteredExercises = useMemo(
    () => filterLibrary(library, { category: selectedFilter, level: selectedLevel, search: exerciseSearch }),
    [library, selectedFilter, selectedLevel, exerciseSearch]
  );

  function expandAllVisibleExercises() {
    const expanded = { ...expandedExercises };

    filteredExercises.forEach((exercise) => {
      expanded[exercise.name] = true;
    });

    setExpandedExercises(expanded);
  }

  function collapseAllExercises() {
    setExpandedExercises({});
  }

  function openExerciseFromWorkout(workoutExercise: string) {
    const workoutName = normalizeText(workoutExercise);

    const match = exercises.find((exercise) => {
      const libraryName = normalizeText(exercise.name);

      return (
        libraryName === workoutName ||
        libraryName.includes(workoutName) ||
        workoutName.includes(libraryName)
      );
    });

    setSelectedFilter("All");

    if (!match) {
      setExerciseSearch(workoutExercise);
      router.push("/library");
      return;
    }

    setExerciseSearch(match.name);
    setExpandedExercises((current) => ({
      ...current,
      [match.name]: true
    }));

    router.push("/library");
  }

  return {
    exerciseSearch,
    setExerciseSearch,
    selectedFilter,
    setSelectedFilter,
    selectedLevel,
    setSelectedLevel,
    expandedExercises,
    toggleExerciseCard,
    expandAllVisibleExercises,
    collapseAllExercises,
    libraryCount: library.length,
    filteredExercises,
    openExerciseFromWorkout
  };
}
