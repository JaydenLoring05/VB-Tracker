"use client";

import { useEffect, useMemo, useState } from "react";

import { useTrackerContext } from "@/context/TrackerContext";
import { emptySkillRatings, normalizeSkillRatings, type SkillRatings } from "@/lib/skillRatings";
import { createClient } from "@/lib/supabase/client";

/**
 * Loads and saves the athlete's self-rated skills
 * (performance_profiles.skill_ratings, added in schema_v44).
 *
 * Kept separate from usePerformanceProfile on purpose: if the v44 column
 * hasn't been added yet, only the radar panel shows an error and the
 * measurements form keeps working.
 */
export function useSkillRatings() {
  const { userId, reportSyncError } = useTrackerContext();
  const supabase = useMemo(() => createClient(), []);

  const [loading, setLoading] = useState(true);
  const [ratings, setRatings] = useState<SkillRatings>(emptySkillRatings);
  const [saved, setSaved] = useState<SkillRatings>(emptySkillRatings);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;

    setLoading(true);
    setError(null);

    supabase
      .from("performance_profiles")
      .select("skill_ratings")
      .eq("user_id", userId)
      .maybeSingle()
      .then(({ data, error: loadError }) => {
        if (cancelled) return;
        if (loadError) {
          console.error("Failed to load skill ratings", loadError);
          setError("Couldn't load your skill ratings. Try again.");
        } else {
          const loaded = normalizeSkillRatings(data?.skill_ratings);
          setRatings(loaded);
          setSaved(loaded);
        }
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [supabase, userId, attempt]);

  async function saveRatings() {
    setSaving(true);

    // Only the ratings column is sent, so an existing row keeps its measurements.
    const { error: saveError } = await supabase
      .from("performance_profiles")
      .upsert(
        { user_id: userId, skill_ratings: ratings, updated_at: new Date().toISOString() },
        { onConflict: "user_id" }
      );

    setSaving(false);

    if (saveError) {
      console.error("Failed to save skill ratings", saveError);
      reportSyncError("Couldn't save your skill ratings. Check your connection and try again.");
      return false;
    }

    setSaved(ratings);
    return true;
  }

  const dirty = JSON.stringify(ratings) !== JSON.stringify(saved);
  const retry = () => setAttempt((current) => current + 1);

  return { loading, ratings, setRatings, saveRatings, saving, dirty, error, retry };
}
