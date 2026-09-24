"use client";

import { useCallback, useEffect, useState } from "react";

import { useDemo } from "@/context/DemoContext";
import { useSupabase } from "@/hooks/useSupabase";
import { PhaseSlug } from "@/lib/programResolution";
import { Team } from "@/types";

export function useTeamProgram(team: Team) {
  const supabase = useSupabase();
  const demo = useDemo();

  const [loading, setLoading] = useState(true);
  const [exerciseDefaults, setExerciseDefaults] = useState<Record<string, string>>({});
  const [dayOverrides, setDayOverrides] = useState<Record<string, string[]>>({});
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (demo) {
      // The sample team runs the stock program with no customizations.
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const [defaultsRes, overridesRes] = await Promise.all([
      supabase
        .from("team_exercise_defaults")
        .select("original_exercise, chosen_exercise")
        .eq("team_id", team.id),
      supabase.from("team_day_overrides").select("phase, day, exercises").eq("team_id", team.id)
    ]);

    if (defaultsRes.error || overridesRes.error) {
      console.error("Failed to load team program", defaultsRes.error ?? overridesRes.error);
      setError("Couldn't load this team's program. Try again.");
      setLoading(false);
      return;
    }

    const nextDefaults: Record<string, string> = {};
    (defaultsRes.data ?? []).forEach((row) => {
      nextDefaults[row.original_exercise] = row.chosen_exercise;
    });
    setExerciseDefaults(nextDefaults);

    const nextOverrides: Record<string, string[]> = {};
    (overridesRes.data ?? []).forEach((row) => {
      nextOverrides[`${row.phase}-${row.day}`] = row.exercises;
    });
    setDayOverrides(nextOverrides);

    setLoading(false);
  }, [supabase, demo, team.id]);

  useEffect(() => {
    load();
  }, [load]);

  async function setExerciseDefault(original: string, chosen: string) {
    if (demo) {
      demo.requestSignup("Customizing your team's program");
      return false;
    }

    setError(null);
    const { error: upsertError } = await supabase
      .from("team_exercise_defaults")
      .upsert(
        { team_id: team.id, original_exercise: original, chosen_exercise: chosen },
        { onConflict: "team_id,original_exercise" }
      );

    if (upsertError) {
      setError("Couldn't save that default. Try again.");
      return false;
    }

    await load();
    return true;
  }

  async function clearExerciseDefault(original: string) {
    if (demo) {
      demo.requestSignup("Customizing your team's program");
      return false;
    }

    setError(null);
    const { error: deleteError } = await supabase
      .from("team_exercise_defaults")
      .delete()
      .eq("team_id", team.id)
      .eq("original_exercise", original);

    if (deleteError) {
      setError("Couldn't clear that default. Try again.");
      return false;
    }

    await load();
    return true;
  }

  async function setDayOverride(phase: PhaseSlug, day: string, exercises: string[]) {
    if (demo) {
      demo.requestSignup("Saving program changes");
      return false;
    }

    setError(null);
    const { error: upsertError } = await supabase
      .from("team_day_overrides")
      .upsert(
        { team_id: team.id, phase, day, exercises },
        { onConflict: "team_id,phase,day" }
      );

    if (upsertError) {
      setError("Couldn't save this day's program. Try again.");
      return false;
    }

    await load();
    return true;
  }

  async function resetDayOverride(phase: PhaseSlug, day: string) {
    if (demo) {
      demo.requestSignup("Saving program changes");
      return false;
    }

    setError(null);
    const { error: deleteError } = await supabase
      .from("team_day_overrides")
      .delete()
      .eq("team_id", team.id)
      .eq("phase", phase)
      .eq("day", day);

    if (deleteError) {
      setError("Couldn't reset this day. Try again.");
      return false;
    }

    await load();
    return true;
  }

  return {
    loading,
    error,
    exerciseDefaults,
    dayOverrides,
    setExerciseDefault,
    clearExerciseDefault,
    setDayOverride,
    resetDayOverride
  };
}
