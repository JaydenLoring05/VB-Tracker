"use client";

import { KeyRound, Users } from "lucide-react";
import { FormEvent, useState } from "react";

import "@/styles/first-run.css";

export function TeamSetup({
  onCreateTeam,
  onJoinTeam,
  error,
  notice
}: {
  onCreateTeam: (name: string) => Promise<boolean>;
  onJoinTeam: (code: string) => Promise<boolean>;
  error: string | null;
  notice?: string | null;
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
      {notice && (
        <div className="empty-state team-setup-notice">
          <p className="muted">{notice}</p>
        </div>
      )}
      <div className="team-setup-intro">
        <h1>Set up your team</h1>
        <p className="muted">
          Coaches create a team and share its invite code. Athletes join with that code, so you can see how
          everyone is recovering before practice. You can also use NextRep on your own without a team.
        </p>
        <ol className="team-setup-steps">
          <li>
            <span aria-hidden="true">1</span> Create the team
          </li>
          <li>
            <span aria-hidden="true">2</span> Share the invite code
          </li>
          <li>
            <span aria-hidden="true">3</span> Athletes check in
          </li>
        </ol>
      </div>

      <div className="panel">
        <h2>
          <Users size={22} /> I coach a team
        </h2>
        <p className="muted">
          Create a team to get an invite code for your athletes. This takes about 10 seconds.
        </p>

        <form className="team-form" onSubmit={handleCreate}>
          <input
            aria-label="Team name"
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
          <KeyRound size={22} /> I have an invite code
        </h2>
        <p className="muted">Your coach gives you a 6-character code. Enter it to join their team.</p>

        <form className="team-form" onSubmit={handleJoin}>
          <input
            aria-label="Invite code"
            autoComplete="off"
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
        <div className="empty-state team-setup-error" role="alert">
          <p className="muted">{error}</p>
        </div>
      )}
    </div>
  );
}
