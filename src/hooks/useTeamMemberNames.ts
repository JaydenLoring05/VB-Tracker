"use client";

import { useEffect, useState } from "react";

import { useSupabase } from "@/hooks/useSupabase";
import { Team } from "@/types";

export type TeamMemberName = { userId: string; displayName: string };

/**
 * Lightweight athlete-name list for a team, for views that only need
 * names (not the coach roster's stats). Under RLS an athlete sees every
 * teammate once the "team members can view teammates" policy
 * (schema_v41_team_member_names.sql) is in place; before that the query
 * just returns their own row, and callers fall back to "Teammate".
 */
export function useTeamMemberNames(team: Team | null) {
  const supabase = useSupabase();
  const [members, setMembers] = useState<TeamMemberName[]>([]);

  useEffect(() => {
    let cancelled = false;

    if (!team) {
      setMembers([]);
      return;
    }

    supabase
      .from("team_members")
      .select("user_id, display_name")
      .eq("team_id", team.id)
      .eq("role", "athlete")
      .order("joined_at", { ascending: true })
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          console.error("Failed to load team member names", error);
          setMembers([]);
          return;
        }
        setMembers(
          (data ?? []).map((row) => ({
            userId: row.user_id as string,
            displayName: (row.display_name as string | null) || "Athlete"
          }))
        );
      });

    return () => {
      cancelled = true;
    };
  }, [supabase, team]);

  return members;
}
