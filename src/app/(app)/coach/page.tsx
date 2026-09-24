"use client";

import { AthleteTeamView } from "@/components/coach/AthleteTeamView";
import { CoachDashboard } from "@/components/coach/CoachDashboard";
import { InlineError } from "@/components/shared/InlineError";
import { Skeleton, SkeletonRegion, SkeletonRow } from "@/components/shared/Skeleton";
import { TeamSetup } from "@/components/coach/TeamSetup";
import { useTeam } from "@/hooks/useTeam";

import "@/styles/coach.css";

export default function CoachPage() {
  const {
    loading,
    teams,
    activeTeam,
    role,
    error,
    loadFailed,
    removalNotice,
    createTeam,
    joinTeam,
    regenerateInviteCode,
    selectTeam,
    refresh
  } = useTeam();

  if (loading) {
    return (
      <SkeletonRegion label="Loading your team">
        <div className="panel">
          <Skeleton className="skeleton-line-lg" style={{ width: "40%", marginBottom: 16 }} />
          <SkeletonRow />
          <SkeletonRow />
          <SkeletonRow />
        </div>
      </SkeletonRegion>
    );
  }

  // A failed read must not fall through to the create/join screen: an
  // existing coach would be invited to create a second team.
  if (loadFailed && teams.length === 0) {
    return (
      <div className="panel">
        <InlineError message="We couldn't load your team. Your team and roster are safe." onRetry={refresh} />
      </div>
    );
  }

  if (teams.length === 0 || !activeTeam || !role) {
    return <TeamSetup onCreateTeam={createTeam} onJoinTeam={joinTeam} error={error} notice={removalNotice} />;
  }

  if (role === "coach") {
    return (
      <CoachDashboard
        teams={teams}
        activeTeam={activeTeam}
        onSelectTeam={selectTeam}
        onCreateTeam={createTeam}
        regenerateInviteCode={regenerateInviteCode}
        onTeamChange={refresh}
      />
    );
  }

  return <AthleteTeamView team={activeTeam} />;
}
