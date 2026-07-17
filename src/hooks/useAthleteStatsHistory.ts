"use client";

import { useEffect, useMemo, useState } from "react";

import { fromStatsRow, StatsRow } from "@/context/TrackerContext";
import { createClient } from "@/lib/supabase/client";
import { calculateRecovery, recoveryStatus } from "@/lib/recovery";
import { StatEntry } from "@/types";

export type AthleteStatsPoint = StatEntry & { recovery: number; recoveryLabel: string };

export function useAthleteStatsHistory(userId: string | null) {
  const supabase = useMemo(() => createClient(), []);

  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<AthleteStatsPoint[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setHistory([]);
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

        const points = ((data ?? []) as StatsRow[]).map((row) => {
          const entry = fromStatsRow(row);
          const recovery = calculateRecovery(entry);
          return { ...entry, recovery, recoveryLabel: recoveryStatus(recovery).label };
        });

        setHistory(points);
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [supabase, userId]);

  return { loading, history, error };
}
