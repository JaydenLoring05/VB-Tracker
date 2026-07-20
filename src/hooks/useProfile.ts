"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { useTrackerContext } from "@/context/TrackerContext";
import { createClient } from "@/lib/supabase/client";

export type Profile = {
  user_id: string;
  display_name: string | null;
  competitive_level: string | null;
  position: string | null;
  season_start: string | null;
  season_end: string | null;
  training_days_per_week: number | null;
  athletes_expected: number | null;
  training_goals: string[] | null;
};

export function useProfile() {
  const { userId } = useTrackerContext();
  const supabase = useMemo(() => createClient(), []);

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);

  const load = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const { data, error } = await supabase.from("profiles").select("*").eq("user_id", userId).maybeSingle();

    if (error) {
      console.error("Failed to load profile", error);
    }

    setProfile((data as Profile) ?? null);
    setLoading(false);
  }, [supabase, userId]);

  useEffect(() => {
    load();
  }, [load]);

  async function updateProfile(fields: Partial<Omit<Profile, "user_id">>) {
    if (!userId) return false;

    const { error } = await supabase
      .from("profiles")
      .upsert({ user_id: userId, ...fields }, { onConflict: "user_id" });

    if (error) {
      console.error("Failed to update profile", error);
      return false;
    }

    await load();
    return true;
  }

  return { loading, profile, updateProfile, refresh: load };
}
