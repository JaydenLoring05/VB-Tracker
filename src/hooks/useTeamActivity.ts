"use client";

import { useEffect, useMemo, useState } from "react";

import { useDemo } from "@/context/DemoContext";
import { fromStatsRow, StatsRow } from "@/context/TrackerContext";
import { useSupabase } from "@/hooks/useSupabase";
import { RosterAthlete, StatEntry, Team } from "@/types";

export type TeamActivity = {
  statsHistoryByUser: Record<string, StatEntry[]>;
  /** Completed workout sessions per athlete in the last 7 days. */
  completedLast7ByUser: Record<string, number>;
  /** PRs per athlete from the last 7 days. */
  recentPRsByUser: Record<string, { exercise: string; date: string }[]>;
};

const EMPTY: TeamActivity = { statsHistoryByUser: {}, completedLast7ByUser: {}, recentPRsByUser: {} };

/**
 * The roster's stats history, recent workouts and recent PRs in one load.
 * Shared by the Attention Center and the team progress page.
 */
export function useTeamActivity(team: Team | null, roster: RosterAthlete[]) {
  const supabase = useSupabase();
  const demo = useDemo();

  const [loading, setLoading] = useState(true);
  const [activity, setActivity] = useState<TeamActivity>(EMPTY);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  const athleteIds = useMemo(() => roster.map((athlete) => athlete.userId).sort().join(","), [roster]);

  useEffect(() => {
    if (!team || !athleteIds) {
      setActivity(EMPTY);
      setLoading(false);
      return;
    }

    if (demo) {
      // The static sample data stands in for Supabase.
      setActivity({
        statsHistoryByUser: demo.data.statsHistory,
        completedLast7ByUser: demo.data.completedLast7,
        recentPRsByUser: demo.data.recentPRs
      });
      setError(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    const ids = athleteIds.split(",");
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    Promise.all([
      supabase.from("stats_history").select("*").in("user_id", ids).order("created_at", { ascending: true }),
      supabase
        .from("workout_sessions")
        .select("user_id, ended_at")
        .in("user_id", ids)
        .not("ended_at", "is", null)
        .gte("ended_at", sevenDaysAgo),
      supabase.from("prs").select("user_id, exercise, created_at").in("user_id", ids).gte("created_at", sevenDaysAgo)
    ]).then(([historyRes, sessionsRes, prsRes]) => {
      if (cancelled) return;

      if (historyRes.error || sessionsRes.error || prsRes.error) {
        console.error("Failed to load team activity", historyRes.error ?? sessionsRes.error ?? prsRes.error);
        setError("Couldn't load your team's activity. Try again.");
        setLoading(false);
        return;
      }

      const statsHistoryByUser: Record<string, StatEntry[]> = {};
      (historyRes.data ?? []).forEach((row) => {
        const typedRow = row as StatsRow & { user_id: string };
        (statsHistoryByUser[typedRow.user_id] ??= []).push(fromStatsRow(typedRow));
      });

      const completedLast7ByUser: Record<string, number> = {};
      (sessionsRes.data ?? []).forEach((row) => {
        completedLast7ByUser[row.user_id] = (completedLast7ByUser[row.user_id] ?? 0) + 1;
      });

      const recentPRsByUser: Record<string, { exercise: string; date: string }[]> = {};
      (prsRes.data ?? []).forEach((row) => {
        (recentPRsByUser[row.user_id] ??= []).push({ exercise: row.exercise, date: row.created_at });
      });

      setActivity({ statsHistoryByUser, completedLast7ByUser, recentPRsByUser });
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase, demo, team, athleteIds, attempt]);

  const retry = () => setAttempt((current) => current + 1);

  return { loading, activity, error, retry };
}
