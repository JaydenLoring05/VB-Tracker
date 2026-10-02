"use client";

import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import { useTrackerContext } from "@/context/TrackerContext";
import { ACTIVE_TEAM_KEY } from "@/hooks/useTeam";
import { normalizeStatDate } from "@/lib/statsHistory";
import { createClient } from "@/lib/supabase/client";
import { computeTeamStreak, TeamStreak } from "@/lib/teamStreak";

/** Long enough for any realistic streak to show; keeps the query small. */
const LOOKBACK_DAYS = 90;
/** The sidebar stays mounted across pages; don't reload on every navigation. */
const REFRESH_MS = 2 * 60 * 1000;

function readActiveTeamId(): string | null {
  try {
    return window.localStorage.getItem(ACTIVE_TEAM_KEY);
  } catch {
    return null;
  }
}

/** The coach's team streak (see lib/teamStreak). Null until loaded, or when `enabled` is false. */
export function useTeamStreak(enabled: boolean): TeamStreak | null {
  const { userId } = useTrackerContext();
  const pathname = usePathname();
  const supabase = useMemo(() => createClient(), []);
  const [streak, setStreak] = useState<TeamStreak | null>(null);
  const lastLoad = useRef(0);

  useEffect(() => {
    if (!enabled || !userId) return;
    if (Date.now() - lastLoad.current < REFRESH_MS) return;
    lastLoad.current = Date.now();

    let cancelled = false;

    (async () => {
      const { data: coachRows, error: coachError } = await supabase
        .from("team_members")
        .select("team_id")
        .eq("user_id", userId)
        .eq("role", "coach");
      if (cancelled || coachError || !coachRows?.length) return;

      const stored = readActiveTeamId();
      const teamId = coachRows.some((row) => row.team_id === stored) ? stored : coachRows[0].team_id;

      const { data: athletes, error: athleteError } = await supabase
        .from("team_members")
        .select("user_id")
        .eq("team_id", teamId)
        .eq("role", "athlete");
      if (cancelled || athleteError) return;

      const ids = (athletes ?? []).map((row) => row.user_id as string);
      if (ids.length === 0) {
        setStreak(computeTeamStreak({}, 0));
        return;
      }

      const since = new Date(Date.now() - LOOKBACK_DAYS * 24 * 60 * 60 * 1000).toISOString();
      const { data: rows, error: historyError } = await supabase
        .from("stats_history")
        .select("user_id, date, created_at")
        .in("user_id", ids)
        .gte("created_at", since);
      if (cancelled || historyError) return;

      const checkInDays: Record<string, string[]> = {};
      (rows ?? []).forEach((row: { user_id: string; date: string | null; created_at: string | null }) => {
        const day = normalizeStatDate(row.date, row.created_at);
        if (day) (checkInDays[row.user_id] ??= []).push(day);
      });
      setStreak(computeTeamStreak(checkInDays, ids.length));
    })();

    return () => {
      cancelled = true;
    };
  }, [enabled, userId, supabase, pathname]);

  return enabled ? streak : null;
}
