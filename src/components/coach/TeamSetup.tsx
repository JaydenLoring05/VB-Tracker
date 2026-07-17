"use client";

import { KeyRound, Users } from "lucide-react";
import { FormEvent, useState } from "react";

export function TeamSetup({
  onCreateTeam,
  onJoinTeam,
  error
}: {
  onCreateTeam: (name: string) => Promise<boolean>;
  onJoinTeam: (code: string) => Promise<boolean>;
  error: string | null;
}) {
  const [teamName, setTeamName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);

  async function handleCreate(event: FormEvent) {
    event.preventDefault();
    if (!teamName.trim() || isCreating) return;

    setIsCreating(true);
    await onCreateTeam(teamName.trim());
    setIsCreating(false);
  }

  async function handleJoin(event: FormEvent) {
    event.preventDefault();
    if (!inviteCode.trim() || isJoining) return;

    setIsJoining(true);
    await onJoinTeam(inviteCode.trim());
    setIsJoining(false);
  }

  return (
    <div className="team-setup lower-grid">
      <div className="panel">
        <h2>
          <Users size={22} /> Create a Team
        </h2>
        <p className="muted">
          Set up a roster and get an invite code to share with your athletes.
        </p>

        <form className="team-form" onSubmit={handleCreate}>
          <input
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            placeholder="Team name, ex: Varsity Girls"
          />
          <button type="submit" disabled={!teamName.trim() || isCreating}>
            {isCreating ? "Creating…" : "Create Team"}
          </button>
        </form>
      </div>

      <div className="panel">
        <h2>
          <KeyRound size={22} /> Join a Team
        </h2>
        <p className="muted">Have an invite code from your coach? Enter it below.</p>

        <form className="team-form" onSubmit={handleJoin}>
          <input
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
            placeholder="Invite code"
            maxLength={6}
          />
          <button type="submit" disabled={!inviteCode.trim() || isJoining}>
            {isJoining ? "Joining…" : "Join Team"}
          </button>
        </form>
      </div>

      {error && (
        <div className="empty-state team-setup-error">
          <p className="muted">{error}</p>
        </div>
      )}
    </div>
  );
}
