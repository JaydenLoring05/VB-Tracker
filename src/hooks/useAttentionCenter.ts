"use client";

import { useMemo } from "react";

import { useTeamActivity } from "@/hooks/useTeamActivity";
import { computeAttentionItems } from "@/lib/attentionCenter";
import { RosterAthlete, Team } from "@/types";

export function useAttentionCenter(team: Team | null, roster: RosterAthlete[]) {
  const { loading, activity, error, retry } = useTeamActivity(team, roster);

  const items = useMemo(
    () =>
      loading || error
        ? []
        : computeAttentionItems(
            roster,
            activity.statsHistoryByUser,
            activity.completedLast7ByUser,
            activity.recentPRsByUser
          ),
    [loading, error, roster, activity]
  );

  return {
    loading,
    items,
    error: error ? "Couldn't load attention items. Try again." : null,
    retry
  };
}
