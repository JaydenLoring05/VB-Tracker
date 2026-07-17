"use client";

import { useRouter } from "next/navigation";
import { useMemo } from "react";

import { exercises } from "@/data/exercises";
import { useTrackerContext } from "@/context/TrackerContext";

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .trim();
}

export function useExerciseLibrary() {
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

  const filteredExercises = useMemo(() => {
    return exercises.filter((exercise) => {
      const matchesCategory = selectedFilter === "All" || exercise.category === selectedFilter;
      const matchesLevel = selectedLevel === "All" || exercise.level === selectedLevel;
      const search = exerciseSearch.toLowerCase().trim();

      const searchableText = [
        exercise.name,
        exercise.category,
        exercise.purpose,
        ...(exercise.cues ?? []),
        ...(exercise.mistakes ?? []),
        ...(exercise.substitutions ?? [])
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch = !search || searchableText.includes(search);

      return matchesCategory && matchesLevel && matchesSearch;
    });
  }, [selectedFilter, selectedLevel, exerciseSearch]);

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
    filteredExercises,
    openExerciseFromWorkout
  };
}
