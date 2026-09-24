"use client";

import { useMemo } from "react";

import { emptyStats, TrackerContext, type TrackerContextValue } from "@/context/TrackerContext";
import type { DemoData } from "@/data/demoData";

/**
 * Feeds the real athlete-facing components a read-only TrackerContext built
 * from one sample athlete. Every setter is a no-op that raises the demo's
 * sign-up prompt, so nothing persists and nothing reaches Supabase.
 */
export function DemoTrackerProvider({
  data,
  requestSignup,
  children
}: {
  data: DemoData;
  requestSignup: (feature?: string) => void;
  children: React.ReactNode;
}) {
  const value = useMemo<TrackerContextValue>(() => {
    const { spotlight } = data;
    const history = data.statsHistory[spotlight.userId] ?? [];
    const blocked = (feature: string) => () => requestSignup(feature);

    return {
      userId: spotlight.userId,

      week: spotlight.week,
      setWeek: blocked("Changing weeks"),

      checked: spotlight.checked,
      toggleExercise: blocked("Checking off exercises"),
      setExerciseChecked: blocked("Checking off exercises"),

      stats: history[history.length - 1] ?? emptyStats,
      setStats: blocked("Logging your check-in"),
      history,
      saveStats: blocked("Logging your check-in"),
      clearStats: blocked("Logging your check-in"),

      calendarEvents: [],
      addGame: blocked("Adding games"),

      selectedFilter: "All",
      setSelectedFilter: () => {},
      selectedLevel: "All",
      setSelectedLevel: () => {},
      exerciseSearch: "",
      setExerciseSearch: () => {},
      expandedExercises: {},
      toggleExerciseCard: () => {},
      setExpandedExercises: () => {},

      workoutLogs: {},
      updateWorkoutLog: blocked("Logging workouts"),
      workoutNotes: {},
      updateWorkoutNote: blocked("Logging workouts"),

      prs: data.prs[spotlight.userId] ?? [],
      addPR: blocked("Tracking PRs"),
      deletePR: blocked("Tracking PRs"),

      substitutions: {},
      setSubstitution: blocked("Swapping exercises"),
      clearSubstitution: blocked("Swapping exercises"),
      teamOverride: null,

      workoutStreak: spotlight.workoutStreak,

      syncError: null,
      syncRetry: null,
      reportSyncError: () => {},
      retrySyncError: () => {},
      clearSyncError: () => {}
    };
  }, [data, requestSignup]);

  return <TrackerContext.Provider value={value}>{children}</TrackerContext.Provider>;
}
