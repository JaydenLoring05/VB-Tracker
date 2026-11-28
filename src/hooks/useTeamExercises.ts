"use client";

import { useCallback, useEffect, useState } from "react";

import { useDemo } from "@/context/DemoContext";
import { useTrackerContext } from "@/context/TrackerContext";
import { ACTIVE_TEAM_KEY } from "@/hooks/useTeam";
import { useSupabase } from "@/hooks/useSupabase";
import {
  pickActiveTeamId,
  rowToTeamExercise,
  TeamExercise,
  TeamExercisePayload,
  TeamExerciseRow
} from "@/lib/teamExercises";
import { TeamRole } from "@/types";

const COLUMNS = "id, team_id, name, category, purpose, cues, video_url, measure";

type DbError = { code?: string; message?: string };

// 42P01 = undefined table, PGRST205 = not in the schema cache: schema_v59 hasn't been run yet.
const isMissingTable = (error: DbError) =>
  error.code === "42P01" || error.code === "PGRST205" || /does not exist|schema cache/i.test(error.message ?? "");

function saveErrorMessage(error: DbError) {
  if (error.code === "23505") return "Your team already has an exercise with this name.";
  return "Couldn't save the exercise. Try again.";
}

function readStoredTeamId(): string | null {
  try {
    return window.localStorage.getItem(ACTIVE_TEAM_KEY);
  } catch {
    return null;
  }
}

/**
 * The signed-in user's own team's exercises (schema_v59). Everyone on the
 * team reads them; only the coach's writes pass RLS (is_team_coach). Before
 * the SQL is run the list is empty and `notSetUp` is true, so the library
 * still works.
 *
 * It finds the team itself, the way useTeam() picks the active team, rather
 * than calling useTeam(): useTeam() also consumes removal notices, which must
 * stay put for the /coach page to show them (see useNavRole).
 */
export function useTeamExercises() {
  const supabase = useSupabase();
  const demo = useDemo();
  const { userId } = useTrackerContext();

  const [teamId, setTeamId] = useState<string | null>(null);
  const [role, setRole] = useState<TeamRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notSetUp, setNotSetUp] = useState(false);
  const [exercises, setExercises] = useState<TeamExercise[]>([]);

  const load = useCallback(async () => {
    if (demo || !userId) {
      setExercises([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const { data: memberRows, error: memberError } = await supabase
      .from("team_members")
      .select("team_id, role")
      .eq("user_id", userId);

    if (memberError) {
      console.error("Failed to load team membership for team exercises", memberError);
      setError("Couldn't load your team's exercises. Try again.");
      setLoading(false);
      return;
    }

    const memberships = (memberRows ?? []) as { team_id: string; role: TeamRole }[];
    const stored = readStoredTeamId();
    let newestFirst: string[] = [];
    if (memberships.length > 1 && !memberships.some((row) => row.team_id === stored)) {
      // Same tie-break as useTeam(): the newest team.
      const { data: teamRows } = await supabase
        .from("teams")
        .select("id")
        .in(
          "id",
          memberships.map((row) => row.team_id)
        )
        .order("created_at", { ascending: false });
      newestFirst = (teamRows ?? []).map((row: { id: string }) => row.id);
    }

    const activeId = pickActiveTeamId(
      memberships.map((row) => row.team_id),
      stored,
      newestFirst
    );
    setTeamId(activeId);
    setRole(memberships.find((row) => row.team_id === activeId)?.role ?? null);

    if (!activeId) {
      setExercises([]);
      setLoading(false);
      return;
    }

    const { data, error: fetchError } = await supabase
      .from("team_exercises")
      .select(COLUMNS)
      .eq("team_id", activeId)
      .order("name");

    if (fetchError) {
      if (isMissingTable(fetchError)) {
        setNotSetUp(true);
      } else {
        console.error("Failed to load team exercises", fetchError);
        setError("Couldn't load your team's exercises. Try again.");
      }
      setExercises([]);
      setLoading(false);
      return;
    }

    setNotSetUp(false);
    setExercises(((data ?? []) as TeamExerciseRow[]).map(rowToTeamExercise));
    setLoading(false);
  }, [demo, supabase, userId]);

  useEffect(() => {
    load();
  }, [load]);

  /** Returns null on success, or a message to show next to the form. */
  async function addExercise(payload: TeamExercisePayload): Promise<string | null> {
    if (!teamId) return "Join or create a team first.";

    const { data, error: insertError } = await supabase
      .from("team_exercises")
      .insert({ ...payload, team_id: teamId })
      .select(COLUMNS)
      .single();

    if (insertError || !data) {
      if (insertError) console.error("Failed to add team exercise", insertError);
      return insertError ? saveErrorMessage(insertError) : "Couldn't save the exercise. Try again.";
    }

    setExercises((current) => [...current, rowToTeamExercise(data as TeamExerciseRow)]);
    return null;
  }

  async function updateExercise(id: string, payload: TeamExercisePayload): Promise<string | null> {
    const { data, error: updateError } = await supabase
      .from("team_exercises")
      .update({ ...payload, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select(COLUMNS)
      .single();

    if (updateError || !data) {
      if (updateError) console.error("Failed to update team exercise", updateError);
      return updateError ? saveErrorMessage(updateError) : "Couldn't save the exercise. Try again.";
    }

    const updated = rowToTeamExercise(data as TeamExerciseRow);
    setExercises((current) => current.map((exercise) => (exercise.id === id ? updated : exercise)));
    return null;
  }

  async function deleteExercise(id: string): Promise<string | null> {
    const { error: deleteError } = await supabase.from("team_exercises").delete().eq("id", id);

    if (deleteError) {
      console.error("Failed to delete team exercise", deleteError);
      return "Couldn't delete the exercise. Try again.";
    }

    setExercises((current) => current.filter((exercise) => exercise.id !== id));
    return null;
  }

  return {
    teamId,
    role,
    loading,
    error,
    notSetUp,
    exercises,
    reload: load,
    addExercise,
    updateExercise,
    deleteExercise
  };
}
