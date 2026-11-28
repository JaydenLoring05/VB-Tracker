"use client";

import { useEffect } from "react";

import { useDemo } from "@/context/DemoContext";
import { useTrackerContext } from "@/context/TrackerContext";
import { useSupabase } from "@/hooks/useSupabase";

const CACHE_KEY = "nextrep:push-training-days";

/**
 * Keeps profiles.push_training_days (schema_v55) in step with the weekdays
 * the player's plan trains, so phone reminders only say "time to train" on
 * training days. Writes only when the days change; any failure (no schema
 * yet, offline) is ignored and retried on the next visit.
 */
export function usePushTrainingDays(days: string[]) {
  const isDemo = useDemo() !== null;
  const { userId } = useTrackerContext();
  const supabase = useSupabase();
  const joined = days.join(",");
  const key = `${userId}:${joined}`;

  useEffect(() => {
    if (isDemo || !userId) return;
    try {
      if (window.localStorage.getItem(CACHE_KEY) === key) return;
    } catch {
      // No storage: write anyway.
    }
    let cancelled = false;
    supabase
      .rpc("set_push_training_days", { p_days: joined ? joined.split(",") : [] })
      .then(({ error }) => {
        if (cancelled || error) return;
        try {
          window.localStorage.setItem(CACHE_KEY, key);
        } catch {
          // Writes again next visit; harmless.
        }
      });
    return () => {
      cancelled = true;
    };
  }, [isDemo, joined, key, supabase, userId]);
}
