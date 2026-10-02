"use client";

import { useCallback, useEffect, useState } from "react";

import { useDemo } from "@/context/DemoContext";
import { fromStatsRow, StatsRow } from "@/context/TrackerContext";
import { useSupabase } from "@/hooks/useSupabase";
import { displayMemberName, normalizeMemberName } from "@/lib/memberName";
import { guardianStatus } from "@/lib/guardian";
import { rosterPageRange, splitRosterPage } from "@/lib/rosterPaging";
import { calculateRecovery, recoveryStatus } from "@/lib/recovery";
import { RosterAthlete, Team } from "@/types";

const STALE_DAYS = 3;

type MemberRow = {
  user_id: string;
  display_name: string | null;
  joined_at: string;
};

export function useCoachRoster(team: Team | null) {
  const supabase = useSupabase();
  const demo = useDemo();

  const [loading, setLoading] = useState(true);
  const [roster, setRoster] = useState<RosterAthlete[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  // One page of athletes, starting at `offset`, with their latest stats and
  // last-active time. Returns an error message instead of throwing.
  const fetchPage = useCallback(
    async (
      teamId: string,
      offset: number
    ): Promise<{ athletes: RosterAthlete[]; hasMore: boolean } | { error: string }> => {
      const { from, to } = rosterPageRange(offset);
      const { data: members, error: membersError } = await supabase
        .from("team_members")
        .select("user_id, display_name, joined_at")
        .eq("team_id", teamId)
        .eq("role", "athlete")
        .order("joined_at", { ascending: true })
        // Tie-breaker so pages never overlap or skip when two athletes joined in the same instant.
        .order("user_id", { ascending: true })
        .range(from, to);

      if (membersError) {
        console.error("Failed to load roster", membersError);
        return { error: "Couldn't load your roster. Try again." };
      }

      const page = splitRosterPage((members ?? []) as MemberRow[]);
      const athletes = page.rows;

      if (athletes.length === 0) return { athletes: [], hasMore: false };

      const athleteIds = athletes.map((athlete) => athlete.user_id);

      const [{ data: statsRows, error: statsError }, { data: profileRows, error: profilesError }] =
        await Promise.all([
          supabase.from("latest_stats").select("*").in("user_id", athleteIds),
          supabase.from("profiles").select("user_id, last_active_at").in("user_id", athleteIds)
        ]);

      if (statsError) {
        console.error("Failed to load roster stats", statsError);
        return { error: "Couldn't load athlete stats. Try again." };
      }

      if (profilesError) {
        console.error("Failed to load roster activity", profilesError);
      }

      // Guardian status, read separately: before schema_v52 these columns
      // don't exist, and that must not hide the roster. On error, no flags.
      const { data: guardianRows, error: guardianError } = await supabase
        .from("profiles")
        .select("user_id, is_adult, guardian_name, guardian_email, guardian_acknowledged_at")
        .in("user_id", athleteIds);
      const guardianMissing = new Set(
        guardianError
          ? []
          : (guardianRows ?? []).filter((row) => guardianStatus(row) === "missing").map((row) => row.user_id as string)
      );
      // An athlete with no profile row at all hasn't answered either.
      const withProfile = new Set((guardianRows ?? []).map((row) => row.user_id as string));

      const statsByUser = new Map<string, StatsRow & { updated_at: string }>(
        (statsRows ?? []).map((row) => [row.user_id as string, row])
      );
      const lastActiveByUser = new Map<string, string>(
        (profileRows ?? []).map((row) => [row.user_id as string, row.last_active_at as string])
      );
      const now = Date.now();

      return {
        hasMore: page.hasMore,
        athletes: athletes.map((member) => {
          const row = statsByUser.get(member.user_id);
          const recovery = calculateRecovery(row ? fromStatsRow(row) : null);
          const lastCheckIn = row?.updated_at ?? null;
          const daysSinceCheckIn = lastCheckIn
            ? (now - new Date(lastCheckIn).getTime()) / (1000 * 60 * 60 * 24)
            : Infinity;

          return {
            userId: member.user_id,
            displayName: displayMemberName(member.display_name),
            joinedAt: member.joined_at,
            recovery,
            recoveryLabel: recoveryStatus(recovery).label,
            lastCheckIn,
            needsCheckIn: daysSinceCheckIn >= STALE_DAYS,
            lastActiveAt: lastActiveByUser.get(member.user_id) ?? null,
            guardianInfoMissing: !guardianError && (guardianMissing.has(member.user_id) || !withProfile.has(member.user_id))
          };
        })
      };
    },
    [supabase]
  );

  const loadRoster = useCallback(async () => {
    if (!team) {
      setRoster([]);
      setHasMore(false);
      setLoading(false);
      return;
    }

    if (demo) {
      setRoster(demo.data.roster);
      setHasMore(false);
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const result = await fetchPage(team.id, 0);
    if ("error" in result) {
      setError(result.error);
      setLoading(false);
      return;
    }

    setRoster(result.athletes);
    setHasMore(result.hasMore);
    setLoading(false);
  }, [demo, team, fetchPage]);

  /** Appends the next page of athletes. Only needed for rosters past ROSTER_PAGE_SIZE. */
  async function loadMore() {
    if (!team || demo || !hasMore || loadingMore) return;

    setLoadingMore(true);
    const result = await fetchPage(team.id, roster.length);
    setLoadingMore(false);

    if ("error" in result) {
      setError(result.error);
      return;
    }

    setRoster((current) => {
      const seen = new Set(current.map((athlete) => athlete.userId));
      return [...current, ...result.athletes.filter((athlete) => !seen.has(athlete.userId))];
    });
    setHasMore(result.hasMore);
  }

  useEffect(() => {
    loadRoster();
  }, [loadRoster]);

  async function removeAthlete(userId: string) {
    if (demo) {
      demo.requestSignup("Managing your roster");
      return false;
    }

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

  /** Returns null on success, or a message to show next to the name field. */
  async function renameAthlete(userId: string, input: string): Promise<string | null> {
    if (demo) {
      demo.requestSignup("Managing your roster");
      return null;
    }

    if (!team) return "No team selected.";

    const normalized = normalizeMemberName(input);
    if (!normalized.ok) return normalized.error;

    const previous = roster;
    setRoster((current) =>
      current.map((athlete) => (athlete.userId === userId ? { ...athlete, displayName: normalized.name } : athlete))
    );

    const { error: renameError } = await supabase.rpc("set_team_member_name", {
      p_team_id: team.id,
      p_user_id: userId,
      p_name: normalized.name
    });

    if (renameError) {
      console.error("Failed to rename athlete", renameError);
      setRoster(previous);
      return "Couldn't save that name. Try again.";
    }

    return null;
  }

  const flagged = roster.filter((athlete) => athlete.needsCheckIn);

  return {
    loading,
    roster,
    flagged,
    error,
    hasMore,
    loadingMore,
    loadMore,
    removeAthlete,
    renameAthlete,
    refresh: loadRoster
  };
}
