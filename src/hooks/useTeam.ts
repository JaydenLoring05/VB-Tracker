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
  const [removalNotice, setRemovalNotice] = useState<string | null>(null);

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
      const { data: notice } = await supabase
        .from("removal_notices")
        .select("id, team_name")
        .eq("user_id", userId)
        .order("removed_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (notice) {
        const { error: deleteError } = await supabase.from("removal_notices").delete().eq("id", notice.id);
        if (deleteError) {
          console.error("Failed to dismiss removal notice", deleteError);
        }
        setRemovalNotice(`You were removed from ${notice.team_name}.`);
      } else {
        setRemovalNotice(null);
      }

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

  async function regenerateInviteCode() {
    setError(null);

    const { error: rpcError } = await supabase.rpc("regenerate_invite_code");

    if (rpcError) {
      setError(rpcError.message || "Couldn't regenerate the invite code.");
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
    removalNotice,
    createTeam,
    joinTeam,
    regenerateInviteCode,
    refresh: loadTeam
  };
}
