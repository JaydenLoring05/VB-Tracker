"use client";

import { useMemo, useRef, useState } from "react";

import type { DemoWorkout } from "@/data/demoData";
import type { useActiveWorkoutSession } from "@/hooks/useActiveWorkoutSession";
import { WorkoutSession, WorkoutSet } from "@/types";

type WorkoutSessionController = ReturnType<typeof useActiveWorkoutSession>;

/**
 * The public demo's Workout Mode session: the same shape as
 * useActiveWorkoutSession, kept entirely in memory. Sets, PRs, the timer and
 * the finish summary all work; nothing is saved and nothing reaches Supabase.
 * PRs use the same rules as the real session (weighted sets on weight,
 * unweighted timed sets on hold length, ties don't count).
 */
export function useDemoWorkoutSession(workout: DemoWorkout): WorkoutSessionController {
  const [session, setSession] = useState<WorkoutSession>(() => {
    const now = new Date().toISOString();
    return {
      id: "demo-session",
      week: workout.week,
      day: workout.day,
      started_at: now,
      ended_at: null,
      duration_seconds: null,
      active_seconds: 0,
      resumed_at: now,
      rpe: null
    };
  });
  const [sets, setSets] = useState<WorkoutSet[]>([]);

  const best = useRef({
    weight: Object.fromEntries(
      Object.entries(workout.previousSets).map(([exercise, set]) => [exercise, set.weight ?? 0])
    ) as Record<string, number>,
    seconds: Object.fromEntries(
      Object.entries(workout.previousSets).map(([exercise, set]) => [exercise, set.seconds ?? 0])
    ) as Record<string, number>
  });

  const previousSets = useMemo(() => workout.previousSets, [workout]);

  async function logSet(exercise: string, weight: number | null, reps: number | null, seconds: number | null = null) {
    const isWeightPR = weight != null && weight > (best.current.weight[exercise] ?? 0);
    const isHoldPR = weight == null && seconds != null && seconds > (best.current.seconds[exercise] ?? 0);
    if (isWeightPR && weight != null) best.current.weight[exercise] = weight;
    if (isHoldPR && seconds != null) best.current.seconds[exercise] = seconds;

    const set: WorkoutSet = {
      id: `demo-set-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      session_id: session.id,
      exercise,
      set_number: sets.filter((s) => s.exercise === exercise).length + 1,
      weight,
      reps,
      seconds,
      created_at: new Date().toISOString()
    };
    setSets((current) => [...current, set]);
    return { set, isNewPR: isWeightPR || isHoldPR };
  }

  function deleteSet(setId: string) {
    setSets((current) => current.filter((s) => s.id !== setId));
  }

  async function finishWorkout(_exercisesInDay: string[]) {
    const endedAt = new Date();
    const openWindow = session.resumed_at
      ? Math.max(0, Math.round((endedAt.getTime() - new Date(session.resumed_at).getTime()) / 1000))
      : 0;
    const durationSeconds = (session.active_seconds ?? 0) + openWindow;
    setSession((current) => ({
      ...current,
      ended_at: endedAt.toISOString(),
      duration_seconds: durationSeconds,
      active_seconds: durationSeconds,
      resumed_at: null
    }));
    return { durationSeconds };
  }

  async function updateSessionRPE(rpe: number) {
    setSession((current) => ({ ...current, rpe }));
    return true;
  }

  return {
    loading: false,
    notFound: false,
    loadError: false,
    retryLoad: () => {},
    session,
    sets,
    previousSets,
    logSet,
    deleteSet,
    finishWorkout,
    updateSessionRPE
  };
}
