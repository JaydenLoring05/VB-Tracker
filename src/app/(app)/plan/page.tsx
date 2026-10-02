"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { CustomProgramPanel } from "@/components/coach/CustomProgramPanel";
import { ProgramEditor } from "@/components/coach/ProgramEditor";
import { TeamCalendarPanel } from "@/components/coach/TeamCalendarPanel";
import { InlineError } from "@/components/shared/InlineError";
import { Skeleton, SkeletonRegion, SkeletonRow } from "@/components/shared/Skeleton";
import { useTeam } from "@/hooks/useTeam";

import "@/styles/coach.css";
import "@/styles/roster.css";

/**
 * The coach's Plan tab: the team program and the team calendar. Athletes'
 * Plan tab is /workouts (with /calendar next to it), so they're sent there.
 */
export default function PlanPage() {
  const router = useRouter();
  const { loading, teams, activeTeam, role, loadFailed, refresh } = useTeam();
  const isCoach = role === "coach" && activeTeam !== null;

  useEffect(() => {
    if (loading || loadFailed || isCoach) return;
    // No team yet: the Team tab is where one gets created or joined.
    router.replace(activeTeam ? "/workouts" : "/coach");
  }, [loading, loadFailed, isCoach, activeTeam, router]);

  if (loadFailed && teams.length === 0) {
    return (
      <div className="panel">
        <InlineError message="We couldn't load your team's plan. Your program is safe." onRetry={refresh} />
      </div>
    );
  }

  if (loading || !isCoach || !activeTeam) {
    return (
      <SkeletonRegion label="Loading your plan">
        <div className="panel">
          <Skeleton className="skeleton-line-lg" style={{ width: "40%", marginBottom: 16 }} />
          <SkeletonRow />
          <SkeletonRow />
        </div>
      </SkeletonRegion>
    );
  }

  return (
    <div className="coach-dashboard">
      <div className="panel team-header">
        <div>
          <p className="micro micro-gold">Plan</p>
          <h2>{activeTeam.name}</h2>
          <p className="muted">
            The team program and calendar. Switch teams on the <Link href="/coach">Team</Link> tab.
          </p>
        </div>
      </div>

      <CustomProgramPanel team={activeTeam} />
      <ProgramEditor team={activeTeam} />
      <TeamCalendarPanel team={activeTeam} />
    </div>
  );
}
