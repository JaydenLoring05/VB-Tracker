"use client";

import { useEffect, useMemo, useState } from "react";

import { useDemo } from "@/context/DemoContext";
import { fromStatsRow, StatsRow } from "@/context/TrackerContext";
import { useSupabase } from "@/hooks/useSupabase";
import { parseProgramDays, pickAssignedProgramId, type ProgramDay } from "@/lib/customProgram";
import { missedAssignedWorkouts } from "@/lib/missedWorkouts";
import { todayISO } from "@/lib/storage";
import { RosterAthlete, StatEntry, Team } from "@/types";

export type TeamActivity = {
  statsHistoryByUser: Record<string, StatEntry[]>;
  /** Completed workout sessions per athlete in the last 7 days. */
  completedLast7ByUser: Record<string, number>;
  /** PRs per athlete from the last 7 days. */
  recentPRsByUser: Record<string, { exercise: string; date: string }[]>;
  /**
   * Assigned vs. missed training days in the last 7 days, only for athletes
   * with a program start date (schema_v44). Others use the session-count proxy.
   */
  missedAssignedByUser: Record<string, { assigned: number; missed: number }>;
};

const EMPTY: TeamActivity = {
  statsHistoryByUser: {},
  completedLast7ByUser: {},
  recentPRsByUser: {},
  missedAssignedByUser: {}
};

type SessionRow = { user_id: string; ended_at: string; week: number; day: string };

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
        recentPRsByUser: demo.data.recentPRs,
        missedAssignedByUser: {}
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
    // One extra day so a session finished early on the first day of the
    // 7-calendar-day window still counts toward that day.
    const eightDaysAgo = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString();

    // Optional: start dates (schema_v44) and coach programs (schema_v43). Any
    // error here, including the columns or tables not existing yet, just
    // means every athlete falls back to the session-count proxy.
    const scheduleQueries = Promise.all([
      supabase.from("profiles").select("user_id, program_start_date").in("user_id", ids),
      supabase.from("team_program_assignments").select("program_id, scope, group_id, user_id, updated_at").eq("team_id", team.id),
      supabase.from("team_group_members").select("group_id, user_id").eq("team_id", team.id),
      supabase.from("team_programs").select("id, days").eq("team_id", team.id)
    ]);

    Promise.all([
      supabase.from("stats_history").select("*").in("user_id", ids).order("created_at", { ascending: true }),
      supabase
        .from("workout_sessions")
        .select("user_id, ended_at, week, day")
        .in("user_id", ids)
        .not("ended_at", "is", null)
        .gte("ended_at", eightDaysAgo),
      supabase.from("prs").select("user_id, exercise, created_at").in("user_id", ids).gte("created_at", sevenDaysAgo),
      scheduleQueries
    ]).then(([historyRes, sessionsRes, prsRes, [startDatesRes, assignmentsRes, groupMembersRes, programsRes]]) => {
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

      const sessions = (sessionsRes.data ?? []) as SessionRow[];
      const completedLast7ByUser: Record<string, number> = {};
      sessions
        .filter((row) => row.ended_at >= sevenDaysAgo)
        .forEach((row) => {
          completedLast7ByUser[row.user_id] = (completedLast7ByUser[row.user_id] ?? 0) + 1;
        });

      const missedAssignedByUser: Record<string, { assigned: number; missed: number }> = {};
      if (!startDatesRes.error) {
        const programsReady = !assignmentsRes.error && !groupMembersRes.error && !programsRes.error;
        const programDaysById = new Map<string, ProgramDay[]>(
          programsReady ? (programsRes.data ?? []).map((row) => [row.id as string, parseProgramDays(row.days)]) : []
        );
        const assignments = programsReady
          ? (assignmentsRes.data ?? []).map((row) => ({
              programId: row.program_id as string,
              scope: row.scope as "team" | "group" | "athlete",
              groupId: row.group_id as string | null,
              userId: row.user_id as string | null,
              updatedAt: row.updated_at as string
            }))
          : [];
        const today = todayISO();

        (startDatesRes.data ?? []).forEach((row) => {
          const startDate = row.program_start_date as string | null;
          if (!startDate) return;
          const userId = row.user_id as string;
          const groupIds = programsReady
            ? (groupMembersRes.data ?? []).filter((m) => m.user_id === userId).map((m) => m.group_id as string)
            : [];
          const programId = pickAssignedProgramId(assignments, userId, groupIds);
          missedAssignedByUser[userId] = missedAssignedWorkouts({
            startDate,
            today,
            programDays: programId ? (programDaysById.get(programId) ?? null) : null,
            completed: sessions.filter((session) => session.user_id === userId)
          });
        });
      }

      const recentPRsByUser: Record<string, { exercise: string; date: string }[]> = {};
      (prsRes.data ?? []).forEach((row) => {
        (recentPRsByUser[row.user_id] ??= []).push({ exercise: row.exercise, date: row.created_at });
      });

      setActivity({ statsHistoryByUser, completedLast7ByUser, recentPRsByUser, missedAssignedByUser });
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
