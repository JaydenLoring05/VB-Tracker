"use client";

import { useEffect, useMemo, useState } from "react";

import { getWorkoutDays } from "@/data/workoutPlan";
import { createClient } from "@/lib/supabase/client";

const TOTAL_WEEKS = 20;

export type CompletedSession = {
  id: string;
  week: number;
  day: string;
  ended_at: string;
  duration_seconds: number | null;
};

export type AthleteAdherence = {
  sessions: CompletedSession[];
  totalSessions: number;
  totalMinutesTrained: number;
  exercisesCompleted: number;
  exercisesPlanned: number;
  completionPercent: number;
};

function countPlannedExercises() {
  let total = 0;
  for (let week = 1; week <= TOTAL_WEEKS; week++) {
    for (const day of getWorkoutDays(week)) {
      if (!day.rest) total += day.exercises.length;
    }
  }
  return total;
}

const PLANNED_EXERCISES = countPlannedExercises();

export function useAthleteAdherence(userId: string | null) {
  const supabase = useMemo(() => createClient(), []);

  const [loading, setLoading] = useState(false);
  const [adherence, setAdherence] = useState<AthleteAdherence | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setAdherence(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    Promise.all([
      supabase
        .from("workout_sessions")
        .select("id, week, day, ended_at, duration_seconds")
        .eq("user_id", userId)
        .not("ended_at", "is", null)
        .order("ended_at", { ascending: false }),
      supabase
        .from("exercise_checks")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("checked", true)
    ]).then(([sessionsRes, checksRes]) => {
      if (cancelled) return;

      if (sessionsRes.error || checksRes.error) {
        console.error("Failed to load athlete adherence", sessionsRes.error ?? checksRes.error);
        setError("Couldn't load this athlete's workout history.");
        setLoading(false);
        return;
      }

      const sessions = (sessionsRes.data ?? []) as CompletedSession[];
      const exercisesCompleted = checksRes.count ?? 0;
      const totalMinutesTrained = Math.round(
        sessions.reduce((sum, session) => sum + (session.duration_seconds ?? 0), 0) / 60
      );

      setAdherence({
        sessions,
        totalSessions: sessions.length,
        totalMinutesTrained,
        exercisesCompleted,
        exercisesPlanned: PLANNED_EXERCISES,
        completionPercent: PLANNED_EXERCISES
          ? Math.round(Math.min(100, (exercisesCompleted / PLANNED_EXERCISES) * 100))
          : 0
      });
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [supabase, userId]);

  return { loading, adherence, error };
}
