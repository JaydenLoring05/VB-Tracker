"use client";

import { useCallback, useEffect, useState } from "react";

import { useDemo } from "@/context/DemoContext";
import { useTrackerContext } from "@/context/TrackerContext";
import { useSupabase } from "@/hooks/useSupabase";
import { useTodayISO } from "@/hooks/useToday";
import { challengeForWeek, weekStartFor, type Challenge } from "@/lib/challenge";

export type BoardRow = { label: string; total: number; is_me: boolean };

export type WeeklyChallengeState = {
  challenge: Challenge | null;
  /** False until loaded, and when schema_v63 isn't there yet: the line hides. */
  available: boolean;
  joined: boolean;
  onLeaderboard: boolean;
  /** Under 13: can join, never on the leaderboard. */
  leaderboardAllowed: boolean;
  myTotal: number;
  board: BoardRow[];
  join: () => Promise<void>;
  setLeaderboard: (show: boolean) => Promise<void>;
};

const DEMO_BOARD: BoardRow[] = [
  { label: "Maya R.", total: 96, is_me: false },
  { label: "Ava T.", total: 64, is_me: true },
  { label: "Jordan K.", total: 52, is_me: false },
  { label: "Sam P.", total: 30, is_me: false }
];

/** This week's challenge (G-06): the caller's progress, entry and the opt-in leaderboard. */
export function useWeeklyChallenge(): WeeklyChallengeState {
  const { userId } = useTrackerContext();
  const supabase = useSupabase();
  const demo = useDemo();
  const weekStart = weekStartFor(useTodayISO());
  const challenge = challengeForWeek(weekStart);

  const [available, setAvailable] = useState(false);
  const [joined, setJoined] = useState(false);
  const [onLeaderboard, setOnLeaderboardState] = useState(false);
  const [leaderboardAllowed, setLeaderboardAllowed] = useState(true);
  const [myTotal, setMyTotal] = useState(0);
  const [board, setBoard] = useState<BoardRow[]>([]);

  const [reloadKey, setReloadKey] = useState(0);
  const metric = challenge?.metric ?? null;

  useEffect(() => {
    if (demo || !userId || !metric) return;
    let cancelled = false;
    Promise.all([
      supabase.from("challenge_entries").select("on_leaderboard").eq("user_id", userId).eq("week_start", weekStart).maybeSingle(),
      supabase.rpc("weekly_challenge_my_total", { p_week_start: weekStart, p_metric: metric }),
      supabase.rpc("weekly_challenge_board", { p_week_start: weekStart, p_metric: metric }),
      supabase.from("profiles").select("under_13").eq("user_id", userId).maybeSingle()
    ]).then(([entryRes, totalRes, boardRes, profileRes]) => {
      if (cancelled) return;
      if (entryRes.error || totalRes.error || boardRes.error) {
        // Before schema_v63 (or offline): hide the challenge rather than show a broken one.
        setAvailable(false);
        return;
      }
      setJoined(Boolean(entryRes.data));
      setOnLeaderboardState(Boolean(entryRes.data?.on_leaderboard));
      setMyTotal(Number(totalRes.data ?? 0));
      setBoard((boardRes.data ?? []) as BoardRow[]);
      setLeaderboardAllowed(!(profileRes.data as { under_13?: boolean | null } | null)?.under_13);
      setAvailable(true);
    });
    return () => {
      cancelled = true;
    };
  }, [demo, userId, supabase, weekStart, metric, reloadKey]);

  const join = useCallback(async () => {
    if (demo) return demo.requestSignup("Joining the weekly challenge");
    if (!userId || !challenge) return;
    const { error } = await supabase
      .from("challenge_entries")
      .upsert({ user_id: userId, week_start: weekStart, challenge_id: challenge.id }, { onConflict: "user_id,week_start" });
    if (error) {
      console.error("Failed to join the challenge", error);
      return;
    }
    setJoined(true);
  }, [demo, userId, supabase, weekStart, challenge]);

  const setLeaderboard = useCallback(
    async (show: boolean) => {
      if (demo) return demo.requestSignup("The leaderboard");
      if (!userId || !leaderboardAllowed) return;
      setOnLeaderboardState(show);
      const { error } = await supabase
        .from("challenge_entries")
        .update({ on_leaderboard: show })
        .eq("user_id", userId)
        .eq("week_start", weekStart);
      if (error) {
        console.error("Failed to update leaderboard choice", error);
        setOnLeaderboardState(!show);
        return;
      }
      setReloadKey((key) => key + 1);
    },
    [demo, userId, supabase, weekStart, leaderboardAllowed]
  );

  if (demo) {
    return {
      challenge,
      available: Boolean(challenge),
      joined: true,
      onLeaderboard: true,
      leaderboardAllowed: true,
      myTotal: challenge?.metric === "workouts" ? 3 : 64,
      board: challenge?.metric === "workouts" ? DEMO_BOARD.map((row) => ({ ...row, total: Math.max(1, Math.round(row.total / 20)) })) : DEMO_BOARD,
      join,
      setLeaderboard
    };
  }

  return { challenge, available, joined, onLeaderboard, leaderboardAllowed, myTotal, board, join, setLeaderboard };
}
