"use client";

import { useEffect, useMemo, useState } from "react";

import { useTrackerContext } from "@/context/TrackerContext";
import { createClient } from "@/lib/supabase/client";

export type PerformanceProfile = {
  position: string | null;
  height_in: number | null;
  standing_reach_in: number | null;
  approach_touch_in: number | null;
  block_touch_in: number | null;
  body_weight_lbs: number | null;
  approach_vertical_in: number | null;
};

const emptyProfile: PerformanceProfile = {
  position: null,
  height_in: null,
  standing_reach_in: null,
  approach_touch_in: null,
  block_touch_in: null,
  body_weight_lbs: null,
  approach_vertical_in: null
};

export function usePerformanceProfile() {
  const { userId, reportSyncError } = useTrackerContext();
  const supabase = useMemo(() => createClient(), []);

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<PerformanceProfile>(emptyProfile);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;

    setLoading(true);
    setError(null);

    supabase
      .from("performance_profiles")
      .select("position, height_in, standing_reach_in, approach_touch_in, block_touch_in, body_weight_lbs, approach_vertical_in")
      .eq("user_id", userId)
      .maybeSingle()
      .then(({ data, error: loadError }) => {
        if (cancelled) return;
        if (loadError) {
          console.error("Failed to load performance profile", loadError);
          setError("Couldn't load your profile. Try again.");
        } else if (data) {
          setProfile(data as PerformanceProfile);
        }
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [supabase, userId, attempt]);

  async function saveProfile() {
    setError(null);

    const { position, height_in, standing_reach_in, approach_touch_in, block_touch_in, body_weight_lbs } = profile;

    const { error: saveError } = await supabase
      .from("performance_profiles")
      .upsert(
        {
          user_id: userId,
          position,
          height_in,
          standing_reach_in,
          approach_touch_in,
          block_touch_in,
          body_weight_lbs,
          updated_at: new Date().toISOString()
        },
        { onConflict: "user_id" }
      );

    if (saveError) {
      console.error("Failed to save performance profile", saveError);
      reportSyncError("Couldn't save your profile. Check your connection and try again.");
      return false;
    }

    return true;
  }

  const retry = () => setAttempt((current) => current + 1);

  return { loading, profile, setProfile, saveProfile, error, retry };
}
