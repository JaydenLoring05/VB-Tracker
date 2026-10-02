"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { getWorkoutDays } from "@/data/workoutPlan";
import { useTrackerContext } from "@/context/TrackerContext";
import { useExerciseSubstitutions } from "@/hooks/useExerciseSubstitutions";
import { requestNotionSync } from "@/lib/notionSyncTrigger";
import { bestMarksByExercise, detectPersonalRecord, personalRecordEntry } from "@/lib/personalRecord";
import { resolveWorkoutDays } from "@/lib/programResolution";
import { createClient } from "@/lib/supabase/client";
import { WorkoutSession, WorkoutSet } from "@/types";

export type PreviousSet = { weight: number | null; reps: number | null; seconds: number | null };

export function useActiveWorkoutSession(sessionId: string) {
  const { userId, setExerciseChecked, addPR, reportSyncError, teamOverride, substitutions } = useTrackerContext();
  const { resolveExercise } = useExerciseSubstitutions();
  const supabase = useMemo(() => createClient(), []);

  const [session, setSession] = useState<WorkoutSession | null>(null);
  const [sets, setSets] = useState<WorkoutSet[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [previousSets, setPreviousSets] = useState<Record<string, PreviousSet>>({});
  const [maxWeightByExercise, setMaxWeightByExercise] = useState<Record<string, number>>({});
  const [maxSecondsByExercise, setMaxSecondsByExercise] = useState<Record<string, number>>({});

  const sessionRef = useRef(session);
  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setLoadError(false);

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

      if (sessionRes.error || setsRes.error) {
        console.error("Failed to load workout session", sessionRes.error ?? setsRes.error);
        setLoadError(true);
        setLoading(false);
        return;
      }

      if (!sessionRes.data) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      setSession(sessionRes.data as WorkoutSession);
      setSets((setsRes.data ?? []) as WorkoutSet[]);
      setLoading(false);
    }

    load().catch((error) => {
      // A rejected request (not just a returned { error }) must not leave the
      // screen stuck on the loading state.
      console.error("Failed to load workout session", error);
      if (cancelled) return;
      setLoadError(true);
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [supabase, sessionId, userId, loadAttempt]);

  useEffect(() => {
    if (!session) return;

    let cancelled = false;
    const day = resolveWorkoutDays(getWorkoutDays(session.week), session.week, teamOverride, substitutions).find(
      (d) => d.day === session.day
    );
    if (!day) return;

    const resolvedExercises = day.exercises.map(resolveExercise);

    supabase
      .from("workout_sets")
      // "*" rather than a column list so this still works before the
      // seconds column (schema_v42) exists.
      .select("*")
      .eq("user_id", userId)
      .in("exercise", resolvedExercises)
      .neq("session_id", sessionId)
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (cancelled || error || !data) return;

        const rows = data as WorkoutSet[];
        const lastSeen: Record<string, PreviousSet> = {};
        rows.forEach((row) => {
          if (!(row.exercise in lastSeen)) {
            lastSeen[row.exercise] = { weight: row.weight, reps: row.reps, seconds: row.seconds ?? null };
          }
        });
        const { maxWeight, maxSeconds } = bestMarksByExercise(rows);

        setPreviousSets(lastSeen);
        setMaxWeightByExercise(maxWeight);
        setMaxSecondsByExercise(maxSeconds);
      });

    return () => {
      cancelled = true;
    };
  }, [supabase, session, sessionId, userId, resolveExercise, teamOverride, substitutions]);

  // Tracks only the time this screen was actually open (not wall-clock time
  // since the workout was started), so navigating away and coming back
  // later doesn't inflate the recorded duration. See
  // schema_v30_workout_active_time.sql for the active_seconds/resumed_at
  // columns this reads and writes.
  useEffect(() => {
    if (!session || session.ended_at) return;

    async function markResumed() {
      const now = new Date().toISOString();
      const { error } = await supabase
        .from("workout_sessions")
        .update({ resumed_at: now })
        .eq("id", sessionId)
        .eq("user_id", userId);

      if (!error) {
        setSession((current) => (current ? { ...current, resumed_at: now } : current));
      }
    }

    async function flushActiveWindow() {
      const current = sessionRef.current;
      if (!current || !current.resumed_at) return;

      const elapsed = Math.max(0, Math.round((Date.now() - new Date(current.resumed_at).getTime()) / 1000));
      const nextActive = (current.active_seconds ?? 0) + elapsed;

      const { error } = await supabase
        .from("workout_sessions")
        .update({ active_seconds: nextActive, resumed_at: null })
        .eq("id", current.id)
        .eq("user_id", userId);

      if (!error) {
        setSession((session) =>
          session && session.id === current.id ? { ...session, active_seconds: nextActive, resumed_at: null } : session
        );
      }
    }

    // Always start a fresh active window on mount/resume, even if
    // resumed_at was already set (e.g. the tab crashed instead of closing
    // cleanly last time) -- overwriting it here means a missed cleanup
    // undercounts a little rather than silently resurrecting the original
    // bug of counting all the away time as active.
    markResumed();

    function handleVisibilityChange() {
      if (document.visibilityState === "hidden") {
        flushActiveWindow();
      } else {
        markResumed();
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("pagehide", flushActiveWindow);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("pagehide", flushActiveWindow);
      flushActiveWindow();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.id, session?.ended_at]);

  async function logSet(exercise: string, weight: number | null, reps: number | null, seconds: number | null = null) {
    const setNumber = sets.filter((s) => s.exercise === exercise).length + 1;
    const prKind = detectPersonalRecord({
      weight,
      seconds,
      previousMaxWeight: maxWeightByExercise[exercise],
      previousMaxSeconds: maxSecondsByExercise[exercise]
    });
    const isNewPR = prKind !== null;

    const { data, error } = await supabase
      .from("workout_sets")
      .insert({
        session_id: sessionId,
        user_id: userId,
        exercise,
        set_number: setNumber,
        weight,
        reps,
        // Only sent for timed sets, so rep sets keep saving even before
        // schema_v42 adds the column.
        ...(seconds != null ? { seconds } : {})
      })
      .select()
      .single();

    if (error) {
      console.error("Failed to log set", error);
      reportSyncError("That set didn't save. Check your connection and log it again.", () =>
        logSet(exercise, weight, reps, seconds)
      );
      return null;
    }

    const newSet = data as WorkoutSet;
    setSets((current) => [...current, newSet]);

    if (prKind === "weight" && weight != null) {
      setMaxWeightByExercise((current) => ({ ...current, [exercise]: weight }));
      addPR(personalRecordEntry(prKind, { exercise, weight, reps, seconds }));
    } else if (prKind === "hold" && seconds != null) {
      setMaxSecondsByExercise((current) => ({ ...current, [exercise]: seconds }));
      addPR(personalRecordEntry(prKind, { exercise, weight, reps, seconds }));
    }

    return { set: newSet, isNewPR };
  }

  function deleteSet(setId: string) {
    const previous = sets;
    setSets((current) => current.filter((s) => s.id !== setId));

    supabase
      .from("workout_sets")
      .delete()
      .eq("id", setId)
      .eq("user_id", userId)
      .then(({ error }) => {
        if (error) {
          console.error("Failed to delete set", error);
          setSets(previous);
          reportSyncError("Couldn't remove that set. Try again.", () => deleteSet(setId));
        }
      });
  }

  async function finishWorkout(exercisesInDay: string[]) {
    if (!session) return null;

    const endedAt = new Date();
    // Flush whatever's left of the currently-open active window into the
    // total instead of trusting ended_at - started_at, which would include
    // any time the athlete spent away from this screen.
    const openWindowSeconds = session.resumed_at
      ? Math.max(0, Math.round((endedAt.getTime() - new Date(session.resumed_at).getTime()) / 1000))
      : 0;
    const durationSeconds = (session.active_seconds ?? 0) + openWindowSeconds;

    const { error } = await supabase
      .from("workout_sessions")
      .update({
        ended_at: endedAt.toISOString(),
        duration_seconds: durationSeconds,
        active_seconds: durationSeconds,
        resumed_at: null
      })
      .eq("id", sessionId)
      .eq("user_id", userId);

    if (error) {
      console.error("Failed to finish workout", error);
      reportSyncError("Couldn't finish the workout. Check your connection and try again.", () =>
        finishWorkout(exercisesInDay)
      );
      return null;
    }

    const exercisesWithSets = new Set(sets.map((s) => s.exercise));
    exercisesInDay.forEach((exercise) => {
      if (exercisesWithSets.has(exercise)) {
        setExerciseChecked(session.week, session.day, exercise, true);
      }
    });

    setSession((current) =>
      current
        ? {
            ...current,
            ended_at: endedAt.toISOString(),
            duration_seconds: durationSeconds,
            active_seconds: durationSeconds,
            resumed_at: null
          }
        : current
    );

    requestNotionSync();
    return { durationSeconds };
  }

  async function updateSessionRPE(rpe: number) {
    const { error } = await supabase
      .from("workout_sessions")
      .update({ rpe })
      .eq("id", sessionId)
      .eq("user_id", userId);

    if (error) {
      console.error("Failed to save RPE", error);
      return false;
    }

    setSession((current) => (current ? { ...current, rpe } : current));
    requestNotionSync();
    return true;
  }

  return {
    loading,
    notFound,
    loadError,
    retryLoad: () => setLoadAttempt((attempt) => attempt + 1),
    session,
    sets,
    previousSets,
    logSet,
    deleteSet,
    finishWorkout,
    updateSessionRPE
  };
}
