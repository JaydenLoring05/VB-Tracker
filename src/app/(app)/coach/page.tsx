"use client";

import { Users } from "lucide-react";

import { CoachDashboard } from "@/components/coach/CoachDashboard";
import { TeamSetup } from "@/components/coach/TeamSetup";
import { useTeam } from "@/hooks/useTeam";

import "@/styles/coach.css";

export default function CoachPage() {
  const { loading, team, role, error, createTeam, joinTeam } = useTeam();

  if (loading) {
    return (
      <div className="panel">
        <p className="muted">Loading your team...</p>
      </div>
    );
  }

  if (!team || !role) {
    return <TeamSetup onCreateTeam={createTeam} onJoinTeam={joinTeam} error={error} />;
  }

  if (role === "coach") {
    return <CoachDashboard team={team} />;
  }

  return (
    <div className="panel">
      <h2>
        <Users size={22} /> {team.name}
      </h2>
      <p className="muted">
        You&apos;re on this team as an athlete. Your coach can see your recovery stats and
        training history to check in on you -- your data stays read-only to them.
      </p>
    </div>
  );
}
