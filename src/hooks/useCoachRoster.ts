"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { fromStatsRow, StatsRow } from "@/context/TrackerContext";
import { createClient } from "@/lib/supabase/client";
import { calculateRecovery, recoveryStatus } from "@/lib/recovery";
import { RosterAthlete, Team } from "@/types";

const STALE_DAYS = 3;

type MemberRow = {
  user_id: string;
  display_name: string | null;
  joined_at: string;
};

export function useCoachRoster(team: Team | null) {
  const supabase = useMemo(() => createClient(), []);

  const [loading, setLoading] = useState(true);
  const [roster, setRoster] = useState<RosterAthlete[]>([]);
  const [error, setError] = useState<string | null>(null);

  const loadRoster = useCallback(async () => {
    if (!team) {
      setRoster([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const { data: members, error: membersError } = await supabase
      .from("team_members")
      .select("user_id, display_name, joined_at")
      .eq("team_id", team.id)
      .eq("role", "athlete")
      .order("joined_at", { ascending: true });

    if (membersError) {
      console.error("Failed to load roster", membersError);
      setError("Couldn't load your roster. Try again.");
      setLoading(false);
      return;
    }

    const athletes = (members ?? []) as MemberRow[];

    if (athletes.length === 0) {
      setRoster([]);
      setLoading(false);
      return;
    }

    const athleteIds = athletes.map((athlete) => athlete.user_id);

    const [{ data: statsRows, error: statsError }, { data: profileRows, error: profilesError }] =
      await Promise.all([
        supabase.from("latest_stats").select("*").in("user_id", athleteIds),
        supabase.from("profiles").select("user_id, last_active_at").in("user_id", athleteIds)
      ]);

    if (statsError) {
      console.error("Failed to load roster stats", statsError);
      setError("Couldn't load athlete stats. Try again.");
      setLoading(false);
      return;
    }

    if (profilesError) {
      console.error("Failed to load roster activity", profilesError);
    }

    const statsByUser = new Map<string, StatsRow & { updated_at: string }>(
      (statsRows ?? []).map((row) => [row.user_id as string, row])
    );
    const lastActiveByUser = new Map<string, string>(
      (profileRows ?? []).map((row) => [row.user_id as string, row.last_active_at as string])
    );
    const now = Date.now();

    const nextRoster: RosterAthlete[] = athletes.map((member) => {
      const row = statsByUser.get(member.user_id);
      const recovery = calculateRecovery(row ? fromStatsRow(row) : null);
      const lastCheckIn = row?.updated_at ?? null;
      const daysSinceCheckIn = lastCheckIn
        ? (now - new Date(lastCheckIn).getTime()) / (1000 * 60 * 60 * 24)
        : Infinity;

      return {
        userId: member.user_id,
        displayName: member.display_name || "Athlete",
        joinedAt: member.joined_at,
        recovery,
        recoveryLabel: recoveryStatus(recovery).label,
        lastCheckIn,
        needsCheckIn: daysSinceCheckIn >= STALE_DAYS,
        lastActiveAt: lastActiveByUser.get(member.user_id) ?? null
      };
    });

    setRoster(nextRoster);
    setLoading(false);
  }, [supabase, team]);

  useEffect(() => {
    loadRoster();
  }, [loadRoster]);

  async function removeAthlete(userId: string) {
    if (!team) return false;

    const previous = roster;
    setRoster((current) => current.filter((athlete) => athlete.userId !== userId));

    const { error: deleteError } = await supabase
      .from("team_members")
      .delete()
      .eq("team_id", team.id)
      .eq("user_id", userId)
      .eq("role", "athlete");

    if (deleteError) {
      console.error("Failed to remove athlete", deleteError);
      setRoster(previous);
      setError("Couldn't remove that athlete. Try again.");
      return false;
    }

    return true;
  }

  const flagged = roster.filter((athlete) => athlete.needsCheckIn);

  return {
    loading,
    roster,
    flagged,
    error,
    removeAthlete,
    refresh: loadRoster
  };
}
