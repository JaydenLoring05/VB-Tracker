"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { useTrackerContext } from "@/context/TrackerContext";
import { createClient } from "@/lib/supabase/client";
import { userFacingMessage } from "@/lib/supabaseErrors";
import { Team, TeamRole } from "@/types";

const ACTIVE_TEAM_KEY = "elevateos:activeTeamId";

export function useTeam() {
  const { userId } = useTrackerContext();
  const supabase = useMemo(() => createClient(), []);

  const [loading, setLoading] = useState(true);
  const [teams, setTeams] = useState<Team[]>([]);
  const [activeTeamId, setActiveTeamId] = useState<string | null>(null);
  const [role, setRole] = useState<TeamRole | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [removalNotice, setRemovalNotice] = useState<string | null>(null);
  // Distinct from `error` (which create/join also set): true only when the
  // list of teams itself couldn't be read. Without it a failed read looks
  // like "no team yet" and shows the create/join screen to an existing coach.
  const [loadFailed, setLoadFailed] = useState(false);

  const loadTeams = useCallback(async () => {
    setLoading(true);
    setError(null);
    setLoadFailed(false);

    const { data: memberRows, error: memberError } = await supabase
      .from("team_members")
      .select("team_id, role")
      .eq("user_id", userId);

    if (memberError) {
      console.error("Failed to load team membership", memberError);
      setError("Couldn't load your team. Try again.");
      setLoadFailed(true);
      setLoading(false);
      return;
    }

    if (!memberRows || memberRows.length === 0) {
      const { data: notice } = await supabase
        .from("removal_notices")
        .select("id, team_name")
        .eq("user_id", userId)
        .order("removed_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (notice) {
        await supabase.from("removal_notices").delete().eq("id", notice.id);
        setRemovalNotice(`You were removed from ${notice.team_name}.`);
      } else {
        setRemovalNotice(null);
      }

      setTeams([]);
      setActiveTeamId(null);
      setRole(null);
      setLoading(false);
      return;
    }

    const teamIds = memberRows.map((row) => row.team_id);
    const { data: teamRows, error: teamsError } = await supabase
      .from("teams")
      .select("*")
      .in("id", teamIds)
      .order("created_at", { ascending: false });

    if (teamsError || !teamRows) {
      console.error("Failed to load teams", teamsError);
      setError("Couldn't load your team. Try again.");
      setLoadFailed(true);
      setLoading(false);
      return;
    }

    setTeams(teamRows as Team[]);
    setRole(memberRows[0].role as TeamRole);

    const stored = typeof window !== "undefined" ? window.localStorage.getItem(ACTIVE_TEAM_KEY) : null;
    const nextActiveId = teamRows.find((team) => team.id === stored)?.id ?? teamRows[0]?.id ?? null;
    setActiveTeamId(nextActiveId);
    setLoading(false);
  }, [supabase, userId]);

  useEffect(() => {
    loadTeams();
  }, [loadTeams]);

  function selectTeam(teamId: string) {
    setActiveTeamId(teamId);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(ACTIVE_TEAM_KEY, teamId);
    }
  }

  const activeTeam = teams.find((team) => team.id === activeTeamId) ?? null;

  async function createTeam(name: string) {
    setError(null);

    const { error: rpcError } = await supabase.rpc("create_team", { p_name: name });

    if (rpcError) {
      console.error("Failed to create team", rpcError);
      setError(userFacingMessage(rpcError, "Couldn't create the team. Check your connection and try again."));
      return false;
    }

    await loadTeams();
    return true;
  }

  async function joinTeam(code: string) {
    setError(null);

    const { error: rpcError } = await supabase.rpc("join_team", {
      p_invite_code: code
    });

    if (rpcError) {
      console.error("Failed to join team", rpcError);
      setError(userFacingMessage(rpcError, "Couldn't join that team. Check your connection and try again."));
      return false;
    }

    await loadTeams();
    return true;
  }

  async function regenerateInviteCode(teamId: string) {
    setError(null);

    const { error: rpcError } = await supabase.rpc("regenerate_invite_code", {
      p_team_id: teamId
    });

    if (rpcError) {
      console.error("Failed to regenerate invite code", rpcError);
      setError(userFacingMessage(rpcError, "Couldn't regenerate the invite code. Try again."));
      return false;
    }

    await loadTeams();
    return true;
  }

  return {
    loading,
    teams,
    activeTeam,
    role,
    error,
    loadFailed,
    removalNotice,
    createTeam,
    joinTeam,
    regenerateInviteCode,
    selectTeam,
    refresh: loadTeams
  };
}
