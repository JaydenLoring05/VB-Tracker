"use client";

import { useEffect, useMemo, useState } from "react";

import { useDemo } from "@/context/DemoContext";
import { fromStatsRow, StatsRow } from "@/context/TrackerContext";
import { useSupabase } from "@/hooks/useSupabase";
import { AttentionItem, computeAttentionItems } from "@/lib/attentionCenter";
import { RosterAthlete, StatEntry, Team } from "@/types";

export function useAttentionCenter(team: Team | null, roster: RosterAthlete[]) {
  const supabase = useSupabase();
  const demo = useDemo();

  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<AttentionItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  const athleteIds = useMemo(() => roster.map((athlete) => athlete.userId).sort().join(","), [roster]);

  useEffect(() => {
    if (!team || !athleteIds) {
      setItems([]);
      setLoading(false);
      return;
    }

    if (demo) {
      // Same real ranking logic, fed by the static sample data instead of Supabase.
      setItems(computeAttentionItems(roster, demo.data.statsHistory, demo.data.completedLast7, demo.data.recentPRs));
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
        console.error(
          "Failed to load attention center data",
          historyRes.error ?? sessionsRes.error ?? prsRes.error
        );
        setError("Couldn't load attention items. Try again.");
        setLoading(false);
        return;
      }

      const statsHistoryByUser: Record<string, StatEntry[]> = {};
      (historyRes.data ?? []).forEach((row) => {
        const typedRow = row as StatsRow & { user_id: string };
        (statsHistoryByUser[typedRow.user_id] ??= []).push(fromStatsRow(typedRow));
      });

      const completedSessionsByUser: Record<string, number> = {};
      (sessionsRes.data ?? []).forEach((row) => {
        completedSessionsByUser[row.user_id] = (completedSessionsByUser[row.user_id] ?? 0) + 1;
      });

      const recentPRsByUser: Record<string, { exercise: string; date: string }[]> = {};
      (prsRes.data ?? []).forEach((row) => {
        (recentPRsByUser[row.user_id] ??= []).push({ exercise: row.exercise, date: row.created_at });
      });

      setItems(computeAttentionItems(roster, statsHistoryByUser, completedSessionsByUser, recentPRsByUser));
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase, demo, team, athleteIds]);

  return { loading, items, error };
}
