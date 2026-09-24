"use client";

import { useEffect, useState } from "react";

import { useDemo } from "@/context/DemoContext";
import { fromStatsRow, StatsRow } from "@/context/TrackerContext";
import { useSupabase } from "@/hooks/useSupabase";
import { calculateRecovery, recoveryStatus } from "@/lib/recovery";
import { StatEntry } from "@/types";

export type AthleteStatsPoint = StatEntry & { recovery: number; recoveryLabel: string };

function toStatsPoint(entry: StatEntry): AthleteStatsPoint {
  const recovery = calculateRecovery(entry);
  return { ...entry, recovery, recoveryLabel: recoveryStatus(recovery).label };
}

export function useAthleteStatsHistory(userId: string | null) {
  const supabase = useSupabase();
  const demo = useDemo();

  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<AthleteStatsPoint[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setHistory([]);
      return;
    }

    if (demo) {
      setHistory((demo.data.statsHistory[userId] ?? []).map(toStatsPoint));
      setError(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    supabase
      .from("stats_history")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: true })
      .then(({ data, error: fetchError }) => {
        if (cancelled) return;

        if (fetchError) {
          console.error("Failed to load athlete stats history", fetchError);
          setError("Couldn't load this athlete's stats history.");
          setLoading(false);
          return;
        }

        setHistory(((data ?? []) as StatsRow[]).map((row) => toStatsPoint(fromStatsRow(row))));
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [supabase, demo, userId]);

  return { loading, history, error };
}
