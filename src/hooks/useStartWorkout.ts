"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { useTrackerContext } from "@/context/TrackerContext";
import { createClient } from "@/lib/supabase/client";
import { WorkoutSession } from "@/types";

export function useStartWorkout() {
  const router = useRouter();
  const { userId, week } = useTrackerContext();
  const supabase = useMemo(() => createClient(), []);

  const [openSession, setOpenSession] = useState<WorkoutSession | null>(null);
  const [loading, setLoading] = useState(true);

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
      .then(({ data }) => {
        if (!cancelled) {
          setOpenSession(data as WorkoutSession | null);
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [supabase, userId]);

  async function startWorkout(day: string) {
    const { data, error } = await supabase
      .from("workout_sessions")
      .insert({ user_id: userId, week, day })
      .select()
      .single();

    if (error) {
      console.error("Failed to start workout", error);
      return;
    }

    router.push(`/workout/${data.id}`);
  }

  function resumeWorkout() {
    if (openSession) router.push(`/workout/${openSession.id}`);
  }

  return { loading, openSession, startWorkout, resumeWorkout };
}
