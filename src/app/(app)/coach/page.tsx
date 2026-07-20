"use client";

import { Users } from "lucide-react";

import { CoachDashboard } from "@/components/coach/CoachDashboard";
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
    removalNotice,
    createTeam,
    joinTeam,
    regenerateInviteCode,
    selectTeam,
    refresh
  } = useTeam();

  if (loading) {
    return (
      <div className="panel">
        <p className="muted">Loading your team...</p>
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

  return (
    <div className="panel">
      <h2>
        <Users size={22} /> {activeTeam.name}
      </h2>
      <p className="muted">
        You&apos;re on this team as an athlete. Your coach can see your recovery stats and
        training history to check in on you -- your data stays read-only to them.
      </p>
    </div>
  );
}
