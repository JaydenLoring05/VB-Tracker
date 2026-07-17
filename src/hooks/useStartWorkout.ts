"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { useTrackerContext } from "@/context/TrackerContext";
import { createClient } from "@/lib/supabase/client";
import { WorkoutSession } from "@/types";

export function useStartWorkout() {
  const router = useRouter();
  const { userId, week, reportSyncError } = useTrackerContext();
  const supabase = useMemo(() => createClient(), []);

  const [openSession, setOpenSession] = useState<WorkoutSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    let cancelled = false;

    supabase
      .from("workout_sessions")
      .select("*")
      .eq("user_id", userId)
      .is("ended_at", null)
      .order("started_at", { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) console.error("Failed to check for an open workout session", error);
        setOpenSession(data as WorkoutSession | null);
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [supabase, userId]);

  async function startWorkout(day: string) {
    if (starting) return;
    setStarting(true);

    const { data, error } = await supabase
      .from("workout_sessions")
      .insert({ user_id: userId, week, day })
      .select()
      .single();

    if (error) {
      console.error("Failed to start workout", error);
      reportSyncError("Couldn't start that workout. Check your connection and try again.");
      setStarting(false);
      return;
    }

    router.push(`/workout/${data.id}`);
  }

  function resumeWorkout() {
    if (openSession) router.push(`/workout/${openSession.id}`);
  }

  return { loading, starting, openSession, startWorkout, resumeWorkout };
}
