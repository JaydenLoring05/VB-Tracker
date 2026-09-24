"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { useDemo } from "@/context/DemoContext";
import { useSupabase } from "@/hooks/useSupabase";
import { computeSetupProgress } from "@/lib/teamSetup";
import { RosterAthlete, Team } from "@/types";

const KEY_PREFIX = "nextrep:setup";

function readFlag(key: string): boolean {
  try {
    return window.localStorage.getItem(key) === "1";
  } catch {
    return false;
  }
}

function writeFlag(key: string, value: boolean) {
  try {
    if (value) window.localStorage.setItem(key, "1");
    else window.localStorage.removeItem(key);
  } catch {
    // Storage can be unavailable (private mode). The guide still works for this visit.
  }
}

/**
 * Progress for the coach's "Get your team ready" guide. Team, roster and
 * check-in state come from data that already exists; only two small
 * preferences (dismissed, program reviewed) live in this browser.
 */
export function useTeamSetup(team: Team, roster: RosterAthlete[], rosterLoading: boolean) {
  const supabase = useSupabase();
  const demo = useDemo();
  const dismissedKey = `${KEY_PREFIX}:${team.id}:dismissed`;
  const reviewedKey = `${KEY_PREFIX}:${team.id}:program-reviewed`;
  const finishedKey = `${KEY_PREFIX}:${team.id}:finished`;

  const [prefsLoaded, setPrefsLoaded] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [finished, setFinished] = useState(false);
  const [programReviewed, setProgramReviewed] = useState(false);
  const [programCustomized, setProgramCustomized] = useState<boolean | null>(null);

  useEffect(() => {
    setDismissed(readFlag(dismissedKey));
    setFinished(readFlag(finishedKey));
    setProgramReviewed(readFlag(reviewedKey));
    setPrefsLoaded(true);
  }, [dismissedKey, finishedKey, reviewedKey]);

  const refreshProgram = useCallback(async () => {
    if (demo) {
      // The public demo has no Supabase client; the sample team counts as set up.
      setProgramCustomized(true);
      return;
    }

    const [overrides, defaults] = await Promise.all([
      supabase.from("team_day_overrides").select("team_id", { count: "exact", head: true }).eq("team_id", team.id),
      supabase
        .from("team_exercise_defaults")
        .select("team_id", { count: "exact", head: true })
        .eq("team_id", team.id)
    ]);

    if (overrides.error || defaults.error) {
      // Not being able to tell is not the same as "not customized": fall back to the review flag.
      setProgramCustomized(false);
      return;
    }

    setProgramCustomized((overrides.count ?? 0) + (defaults.count ?? 0) > 0);
  }, [supabase, demo, team.id]);

  useEffect(() => {
    setProgramCustomized(null);
    refreshProgram();
  }, [refreshProgram]);

  const markProgramReviewed = useCallback(() => {
    setProgramReviewed(true);
    writeFlag(reviewedKey, true);
  }, [reviewedKey]);

  // "Finished" is remembered separately so a completed guide never comes back,
  // even if the roster later changes (for example an athlete leaves).
  const dismiss = useCallback(
    (wasComplete: boolean) => {
      setDismissed(true);
      writeFlag(dismissedKey, true);
      if (wasComplete) {
        setFinished(true);
        writeFlag(finishedKey, true);
      }
    },
    [dismissedKey, finishedKey]
  );

  const restore = useCallback(() => {
    setDismissed(false);
    writeFlag(dismissedKey, false);
  }, [dismissedKey]);

  const progress = useMemo(
    () =>
      computeSetupProgress({
        athleteCount: roster.length,
        checkedInCount: roster.filter((athlete) => athlete.lastCheckIn !== null).length,
        programCustomized: programCustomized === true,
        programReviewed
      }),
    [roster, programCustomized, programReviewed]
  );

  return {
    // Hold rendering until everything is known so the guide never flashes wrong progress.
    ready: prefsLoaded && !rosterLoading && programCustomized !== null,
    progress,
    dismissed,
    finished,
    dismiss,
    restore,
    markProgramReviewed,
    refreshProgram
  };
}
