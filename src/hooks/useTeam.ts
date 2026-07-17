"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { useTrackerContext } from "@/context/TrackerContext";
import { createClient } from "@/lib/supabase/client";
import { Team, TeamRole } from "@/types";

export function useTeam() {
  const { userId } = useTrackerContext();
  const supabase = useMemo(() => createClient(), []);

  const [loading, setLoading] = useState(true);
  const [team, setTeam] = useState<Team | null>(null);
  const [role, setRole] = useState<TeamRole | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadTeam = useCallback(async () => {
    setLoading(true);
    setError(null);

    const { data: memberRow, error: memberError } = await supabase
      .from("team_members")
      .select("team_id, role")
      .eq("user_id", userId)
      .maybeSingle();

    if (memberError) {
      console.error("Failed to load team membership", memberError);
      setError("Couldn't load your team. Try again.");
      setLoading(false);
      return;
    }

    if (!memberRow) {
      setTeam(null);
      setRole(null);
      setLoading(false);
      return;
    }

    const { data: teamRow, error: teamError } = await supabase
      .from("teams")
      .select("*")
      .eq("id", memberRow.team_id)
      .maybeSingle();

    if (teamError || !teamRow) {
      console.error("Failed to load team", teamError);
      setError("Couldn't load your team. Try again.");
      setLoading(false);
      return;
    }

    setTeam(teamRow as Team);
    setRole(memberRow.role as TeamRole);
    setLoading(false);
  }, [supabase, userId]);

  useEffect(() => {
    loadTeam();
  }, [loadTeam]);

  async function createTeam(name: string) {
    setError(null);

    const { error: rpcError } = await supabase.rpc("create_team", { p_name: name });

    if (rpcError) {
      setError(rpcError.message || "Couldn't create the team.");
      return false;
    }

    await loadTeam();
    return true;
  }

  async function joinTeam(code: string) {
    setError(null);

    const { error: rpcError } = await supabase.rpc("join_team", {
      p_invite_code: code
    });

    if (rpcError) {
      setError(rpcError.message || "Couldn't join that team.");
      return false;
    }

    await loadTeam();
    return true;
  }

  return {
    loading,
    team,
    role,
    error,
    createTeam,
    joinTeam,
    refresh: loadTeam
  };
}
