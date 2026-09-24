"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { useDemo } from "@/context/DemoContext";
import { useTrackerContext } from "@/context/TrackerContext";
import { useSupabase } from "@/hooks/useSupabase";
import { WorkoutSession } from "@/types";

export function useStartWorkout() {
  const router = useRouter();
  const { userId, week, reportSyncError } = useTrackerContext();
  const supabase = useSupabase();
  const demo = useDemo();

  const [openSession, setOpenSession] = useState<WorkoutSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    if (demo) {
      setLoading(false);
      return;
    }

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
  }, [supabase, demo, userId]);

  async function startWorkout(day: string) {
    if (demo) {
      demo.requestSignup("Logging workouts");
      return;
    }

    if (starting) return;
    setStarting(true);

    const { data, error } = await supabase
      .from("workout_sessions")
      .insert({ user_id: userId, week, day })
      .select()
      .single();

    if (error) {
      console.error("Failed to start workout", error);
      reportSyncError("Couldn't start that workout. Check your connection and try again.", () =>
        startWorkout(day)
      );
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
