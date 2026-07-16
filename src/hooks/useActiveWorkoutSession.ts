"use client";

import { useEffect, useMemo, useState } from "react";

import { workoutDays } from "@/data/workoutPlan";
import { useTrackerContext } from "@/context/TrackerContext";
import { createClient } from "@/lib/supabase/client";
import { WorkoutSession, WorkoutSet } from "@/types";

export type PreviousSet = { weight: number | null; reps: number | null };

export function useActiveWorkoutSession(sessionId: string) {
  const { userId, setExerciseChecked } = useTrackerContext();
  const supabase = useMemo(() => createClient(), []);

  const [session, setSession] = useState<WorkoutSession | null>(null);
  const [sets, setSets] = useState<WorkoutSet[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [previousSets, setPreviousSets] = useState<Record<string, PreviousSet>>({});
  const [maxWeightByExercise, setMaxWeightByExercise] = useState<Record<string, number>>({});

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const [sessionRes, setsRes] = await Promise.all([
        supabase
          .from("workout_sessions")
          .select("*")
          .eq("id", sessionId)
          .eq("user_id", userId)
          .maybeSingle(),
        supabase
          .from("workout_sets")
          .select("*")
          .eq("session_id", sessionId)
          .eq("user_id", userId)
          .order("created_at", { ascending: true })
      ]);

      if (cancelled) return;

      if (!sessionRes.data) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      setSession(sessionRes.data as WorkoutSession);
      setSets((setsRes.data ?? []) as WorkoutSet[]);
      setLoading(false);
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [supabase, sessionId, userId]);

  useEffect(() => {
    if (!session) return;

    let cancelled = false;
    const day = workoutDays.find((d) => d.day === session.day);
    if (!day) return;

    supabase
      .from("workout_sets")
      .select("exercise, weight, reps, created_at")
      .eq("user_id", userId)
      .in("exercise", day.exercises)
      .neq("session_id", sessionId)
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (cancelled || error || !data) return;

        const lastSeen: Record<string, PreviousSet> = {};
        const maxWeight: Record<string, number> = {};

        data.forEach((row) => {
          if (!(row.exercise in lastSeen)) {
            lastSeen[row.exercise] = { weight: row.weight, reps: row.reps };
          }
          if (row.weight != null && row.weight > (maxWeight[row.exercise] ?? 0)) {
            maxWeight[row.exercise] = row.weight;
          }
        });

        setPreviousSets(lastSeen);
        setMaxWeightByExercise(maxWeight);
      });

    return () => {
      cancelled = true;
    };
  }, [supabase, session, sessionId, userId]);

  async function logSet(exercise: string, weight: number | null, reps: number | null) {
    const setNumber = sets.filter((s) => s.exercise === exercise).length + 1;
    const isNewPR = weight != null && weight > (maxWeightByExercise[exercise] ?? 0);

    const { data, error } = await supabase
      .from("workout_sets")
      .insert({
        session_id: sessionId,
        user_id: userId,
        exercise,
        set_number: setNumber,
        weight,
        reps
      })
      .select()
      .single();

    if (error) {
      console.error("Failed to log set", error);
      return null;
    }

    const newSet = data as WorkoutSet;
    setSets((current) => [...current, newSet]);

    if (isNewPR && weight != null) {
      setMaxWeightByExercise((current) => ({ ...current, [exercise]: weight }));
    }

    return { set: newSet, isNewPR };
  }

  function deleteSet(setId: string) {
    setSets((current) => current.filter((s) => s.id !== setId));

    supabase
      .from("workout_sets")
      .delete()
      .eq("id", setId)
      .eq("user_id", userId)
      .then(({ error }) => {
        if (error) console.error("Failed to delete set", error);
      });
  }

  async function finishWorkout(exercisesInDay: string[]) {
    if (!session) return null;

    const endedAt = new Date();
    const durationSeconds = Math.round(
      (endedAt.getTime() - new Date(session.started_at).getTime()) / 1000
    );

    const { error } = await supabase
      .from("workout_sessions")
      .update({ ended_at: endedAt.toISOString(), duration_seconds: durationSeconds })
      .eq("id", sessionId)
      .eq("user_id", userId);

    if (error) console.error("Failed to finish workout", error);

    const exercisesWithSets = new Set(sets.map((s) => s.exercise));
    exercisesInDay.forEach((exercise) => {
      if (exercisesWithSets.has(exercise)) {
        setExerciseChecked(session.week, session.day, exercise, true);
      }
    });

    setSession((current) =>
      current
        ? { ...current, ended_at: endedAt.toISOString(), duration_seconds: durationSeconds }
        : current
    );

    return { durationSeconds };
  }

  return {
    loading,
    notFound,
    session,
    sets,
    previousSets,
    logSet,
    deleteSet,
    finishWorkout
  };
}
