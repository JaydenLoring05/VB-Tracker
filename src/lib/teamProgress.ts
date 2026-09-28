import { RosterAthlete, StatEntry } from "@/types";

export type AthleteProgress = {
  userId: string;
  displayName: string;
  /** Most recent logged vertical, in inches. */
  verticalLatest: number | null;
  /** Latest minus first logged vertical; null with fewer than two. */
  verticalChange: number | null;
  /** Today's readiness from the roster; null until the athlete's first check-in. */
  readiness: number | null;
  readinessLabel: string | null;
  workoutsLast7: number;
  prsLast7: number;
  latestPR: string | null;
};

export type TeamProgressSummary = {
  /** Average vertical change across athletes who have one, to one decimal. */
  avgVerticalChange: number | null;
  improvingCount: number;
  verticalTrackedCount: number;
  workoutsLast7: number;
  prsLast7: number;
};

const roundTenth = (value: number) => Math.round(value * 10) / 10;

function verticals(history: StatEntry[]): number[] {
  return history.map((entry) => Number(entry.vertical)).filter((value) => Number.isFinite(value) && value > 0);
}

/**
 * The coach's team progress view: a few headline numbers plus one row per
 * athlete, from the same data the Attention Center loads (stats history,
 * workouts and PRs from the last 7 days). Full charts stay one tap deeper,
 * in each athlete's stats modal.
 */
export function buildTeamProgress(
  roster: RosterAthlete[],
  statsHistoryByUser: Record<string, StatEntry[]>,
  completedLast7ByUser: Record<string, number>,
  recentPRsByUser: Record<string, { exercise: string; date: string }[]>
): { athletes: AthleteProgress[]; summary: TeamProgressSummary } {
  const athletes = roster
    .map((athlete): AthleteProgress => {
      const jumps = verticals(statsHistoryByUser[athlete.userId] ?? []);
      const prs = [...(recentPRsByUser[athlete.userId] ?? [])].sort((a, b) => b.date.localeCompare(a.date));
      const checkedIn = athlete.lastCheckIn !== null;

      return {
        userId: athlete.userId,
        displayName: athlete.displayName,
        verticalLatest: jumps.length ? jumps[jumps.length - 1] : null,
        verticalChange: jumps.length > 1 ? roundTenth(jumps[jumps.length - 1] - jumps[0]) : null,
        readiness: checkedIn ? athlete.recovery : null,
        readinessLabel: checkedIn ? athlete.recoveryLabel : null,
        workoutsLast7: completedLast7ByUser[athlete.userId] ?? 0,
        prsLast7: prs.length,
        latestPR: prs[0]?.exercise ?? null
      };
    })
    .sort((a, b) => a.displayName.localeCompare(b.displayName, undefined, { sensitivity: "base" }));

  const changes = athletes.map((row) => row.verticalChange).filter((change): change is number => change !== null);

  return {
    athletes,
    summary: {
      avgVerticalChange: changes.length
        ? roundTenth(changes.reduce((sum, change) => sum + change, 0) / changes.length)
        : null,
      improvingCount: changes.filter((change) => change > 0).length,
      verticalTrackedCount: changes.length,
      workoutsLast7: athletes.reduce((sum, row) => sum + row.workoutsLast7, 0),
      prsLast7: athletes.reduce((sum, row) => sum + row.prsLast7, 0)
    }
  };
}
