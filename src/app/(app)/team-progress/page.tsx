"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { TeamProgressView } from "@/components/coach/TeamProgressView";
import { InlineError } from "@/components/shared/InlineError";
import { Skeleton, SkeletonRegion, SkeletonRow } from "@/components/shared/Skeleton";
import { useTeam } from "@/hooks/useTeam";

import "@/styles/coach.css";

/**
 * The coach's Progress tab. Athletes' Progress tab is their own /stats, so
 * they're sent there; a coach with no team yet goes to the Team tab to make one.
 */
export default function TeamProgressPage() {
  const router = useRouter();
  const { loading, teams, activeTeam, role, loadFailed, refresh } = useTeam();
  const isCoach = role === "coach" && activeTeam !== null;

  useEffect(() => {
    if (loading || loadFailed || isCoach) return;
    router.replace(activeTeam ? "/stats" : "/coach");
  }, [loading, loadFailed, isCoach, activeTeam, router]);

  if (loadFailed && teams.length === 0) {
    return (
      <div className="panel">
        <InlineError message="We couldn't load your team's progress. Your data is safe." onRetry={refresh} />
      </div>
    );
  }

  if (loading || !isCoach || !activeTeam) {
    return (
      <SkeletonRegion label="Loading team progress">
        <div className="panel">
          <Skeleton className="skeleton-line-lg" style={{ width: "40%", marginBottom: 16 }} />
          <SkeletonRow />
          <SkeletonRow />
        </div>
      </SkeletonRegion>
    );
  }

  return <TeamProgressView team={activeTeam} />;
}
