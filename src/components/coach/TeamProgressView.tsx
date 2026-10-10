"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useState } from "react";

import { Avatar } from "@/components/shared/Avatar";
import { EmptyState } from "@/components/shared/EmptyState";
import { InlineError } from "@/components/shared/InlineError";
import { SkeletonRegion, SkeletonRow } from "@/components/shared/Skeleton";
import { StatusLabel } from "@/components/shared/StatusLabel";
import { useCoachRoster } from "@/hooks/useCoachRoster";
import { useTeamActivity } from "@/hooks/useTeamActivity";
import { AthleteProgress, buildTeamProgress } from "@/lib/teamProgress";
import { Team } from "@/types";

import "@/styles/roster.css";

// Full charts are one tap deeper, in the same stats modal the roster opens.
const AthleteStatsModal = dynamic(
  () => import("./AthleteStatsModal").then((module) => module.AthleteStatsModal),
  { ssr: false }
);

function formatChange(change: number) {
  return `${change > 0 ? "+" : ""}${change.toFixed(1)}`;
}

/**
 * The coach's Progress tab: a headline line for the team, then one row per
 * athlete. Tap an athlete for their full charts, PRs and workout history.
 */
export function TeamProgressView({ team }: { team: Team }) {
  const { loading: rosterLoading, roster, error: rosterError, refresh } = useCoachRoster(team);
  const { loading: activityLoading, activity, error: activityError, retry } = useTeamActivity(team, roster);
  const [selected, setSelected] = useState<AthleteProgress | null>(null);

  const loading = rosterLoading || activityLoading;
  const rosterLoadFailed = Boolean(rosterError) && roster.length === 0;
  const { athletes, summary } = buildTeamProgress(
    roster,
    activity.statsHistoryByUser,
    activity.completedLast7ByUser,
    activity.recentPRsByUser
  );

  return (
    <div className="panel team-progress">
      <div className="section-heading">
        <div>
          <p className="micro micro-gold">Progress</p>
          <h2>{team.name}</h2>
        </div>
        <p className="section-caption">Last 7 days</p>
      </div>

      {loading ? (
        <SkeletonRegion label="Loading team progress">
          <SkeletonRow />
          <SkeletonRow />
          <SkeletonRow />
        </SkeletonRegion>
      ) : rosterLoadFailed ? (
        <InlineError message={rosterError ?? "Couldn't load your roster."} onRetry={refresh} />
      ) : activityError ? (
        <InlineError message={activityError} onRetry={retry} />
      ) : athletes.length === 0 ? (
        <EmptyState
          compact
          title="No athletes yet"
          description={
            <>
              Progress shows up here once athletes join and start logging. Share your invite code from the{" "}
              <Link href="/coach">Team</Link> tab.
            </>
          }
        />
      ) : (
        <>
          <p className="progress-summary">
            <span>
              Vertical{" "}
              <strong>
                {summary.avgVerticalChange === null ? "--" : `${formatChange(summary.avgVerticalChange)} in`}
              </strong>{" "}
              avg
              {summary.verticalTrackedCount > 0 && (
                <span className="muted">
                  {" "}
                  ({summary.improvingCount} of {summary.verticalTrackedCount} improving)
                </span>
              )}
            </span>
            <span>
              <strong>{summary.workoutsLast7}</strong> workout{summary.workoutsLast7 === 1 ? "" : "s"}
            </span>
            <span>
              <strong>{summary.prsLast7}</strong> new PR{summary.prsLast7 === 1 ? "" : "s"}
            </span>
          </p>

          <ul className="progress-list">
            {athletes.map((row) => (
              <li key={row.userId} className="progress-row">
                <Avatar name={row.displayName} />
                <button
                  type="button"
                  className="roster-open progress-name"
                  aria-haspopup="dialog"
                  onClick={() => setSelected(row)}
                >
                  {row.displayName}
                </button>

                <span className="progress-cell">
                  <span className="progress-cell-label">Vertical</span>
                  {row.verticalLatest === null ? (
                    <span className="muted">--</span>
                  ) : (
                    <>
                      <strong>{row.verticalLatest} in</strong>
                      {row.verticalChange !== null && row.verticalChange !== 0 && (
                        <span className={row.verticalChange > 0 ? "progress-up" : "progress-down"}>
                          {formatChange(row.verticalChange)}
                        </span>
                      )}
                    </>
                  )}
                </span>

                <span className="progress-cell">
                  <span className="progress-cell-label">Readiness</span>
                  {row.readiness === null || row.readinessLabel === null ? (
                    <span className="muted">No check-in</span>
                  ) : (
                    <>
                      <strong>{row.readiness}</strong>
                      <StatusLabel label={row.readinessLabel} />
                    </>
                  )}
                </span>

                <span className="progress-cell">
                  <span className="progress-cell-label">Workouts</span>
                  <strong>{row.workoutsLast7}</strong>
                </span>

                <span className="progress-cell">
                  <span className="progress-cell-label">PRs</span>
                  {row.prsLast7 > 0 ? (
                    <>
                      <strong>{row.prsLast7}</strong>
                      <span className="muted progress-pr-name">{row.latestPR}</span>
                    </>
                  ) : (
                    <span className="muted">--</span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </>
      )}

      {selected && (
        <AthleteStatsModal
          userId={selected.userId}
          displayName={selected.displayName}
          teamId={team.id}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}
