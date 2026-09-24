"use client";

import { AlertTriangle, Copy, RefreshCw, Trophy, UserMinus, Users } from "lucide-react";
import { useEffect, useState } from "react";

import { useAttentionCenter } from "@/hooks/useAttentionCenter";
import { useCoachRoster } from "@/hooks/useCoachRoster";
import { buildInviteMessage } from "@/lib/teamSetup";
import { formatLastActive } from "@/lib/time";
import { RosterAthlete, Team } from "@/types";
import { ConfirmModal } from "@/components/shared/ConfirmModal";
import { CopyButton } from "@/components/shared/CopyButton";
import { EmptyState } from "@/components/shared/EmptyState";

import { AthleteStatsModal } from "./AthleteStatsModal";
import { AttentionCenter } from "./AttentionCenter";
import { ProgramEditor } from "./ProgramEditor";
import { TeamCalendarPanel } from "./TeamCalendarPanel";
import { TeamReadyChecklist } from "./TeamReadyChecklist";
import { TeamSwitcher } from "./TeamSwitcher";

function recoverySlug(label: string) {
  return label.toLowerCase();
}

export function CoachDashboard({
  teams,
  activeTeam,
  onSelectTeam,
  onCreateTeam,
  regenerateInviteCode,
  onTeamChange
}: {
  teams: Team[];
  activeTeam: Team;
  onSelectTeam: (teamId: string) => void;
  onCreateTeam: (name: string) => Promise<boolean>;
  regenerateInviteCode: (teamId: string) => Promise<boolean>;
  onTeamChange?: () => void;
}) {
  const team = activeTeam;
  const { loading, roster, flagged, error, removeAthlete, refresh } = useCoachRoster(team);
  const { loading: attentionLoading, items: attentionItems } = useAttentionCenter(team, roster);
  const [activeTab, setActiveTab] = useState<"roster" | "program">("roster");
  const [copied, setCopied] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [selectedAthlete, setSelectedAthlete] = useState<RosterAthlete | null>(null);
  const [pendingRemoval, setPendingRemoval] = useState<RosterAthlete | null>(null);
  const [regenerating, setRegenerating] = useState(false);
  const [regeneratedCode, setRegeneratedCode] = useState<string | null>(null);

  useEffect(() => {
    // The dashboard setup guide links here with #program.
    if (window.location.hash === "#program") setActiveTab("program");
  }, []);

  async function handleCopyCode() {
    try {
      await navigator.clipboard.writeText(team.invite_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard isn't critical; the code is still shown on screen.
    }
  }

  function requestRemove(athlete: RosterAthlete) {
    if (removingId) return;
    setPendingRemoval(athlete);
  }

  async function confirmRemove() {
    if (!pendingRemoval) return;
    const userId = pendingRemoval.userId;
    setPendingRemoval(null);
    setRemovingId(userId);
    await removeAthlete(userId);
    setRemovingId(null);
  }

  async function handleRegenerateCode() {
    if (regenerating) return;
    setRegenerating(true);
    const ok = await regenerateInviteCode(team.id);
    setRegenerating(false);
    if (ok) {
      setRegeneratedCode("Invite code regenerated.");
      onTeamChange?.();
    }
    setTimeout(() => setRegeneratedCode(null), 3000);
  }

  return (
    <div className="coach-dashboard">
      <TeamSwitcher teams={teams} activeTeamId={team.id} onSelect={onSelectTeam} onCreateTeam={onCreateTeam} />

      <TeamReadyChecklist
        team={team}
        roster={roster}
        rosterLoading={loading}
        programTabActive={activeTab === "program"}
        onOpenProgram={() => setActiveTab("program")}
      />

      <AttentionCenter
        items={attentionItems}
        loading={attentionLoading}
        hasAthletes={loading || roster.length > 0}
        onSelectAthlete={(userId) => {
          const athlete = roster.find((candidate) => candidate.userId === userId);
          if (athlete) setSelectedAthlete(athlete);
        }}
      />

      <div className="tabs">
        <button
          type="button"
          className={activeTab === "roster" ? "" : "ghost"}
          onClick={() => setActiveTab("roster")}
        >
          Roster
        </button>
        <button
          type="button"
          className={activeTab === "program" ? "" : "ghost"}
          onClick={() => setActiveTab("program")}
        >
          Program
        </button>
      </div>

      {activeTab === "program" && <ProgramEditor team={team} />}

      {activeTab === "roster" && (
      <>
      <div className="panel team-header">
        <div>
          <h2>
            <Users size={22} /> {team.name}
          </h2>
          <p className="muted">
            {roster.length} athlete{roster.length === 1 ? "" : "s"} on your roster
          </p>
        </div>

        <div className="team-header-actions">
          <button className="secondary invite-code-button" onClick={handleCopyCode} type="button">
            <Copy size={16} /> {copied ? "Copied!" : `Invite code: ${team.invite_code}`}
          </button>

          <button className="ghost" onClick={handleRegenerateCode} disabled={regenerating} type="button">
            <RefreshCw size={16} /> {regenerating ? "Regenerating..." : "Regenerate code"}
          </button>

          {regeneratedCode && <span className="muted regenerate-code-status">{regeneratedCode}</span>}
        </div>
      </div>

      <TeamCalendarPanel team={team} />

      {flagged.length > 0 && (
        <div className="panel checkin-alert">
          <h3>
            <AlertTriangle size={18} /> Needs a Check-In
          </h3>
          <p className="muted">No stats logged in the last 3+ days.</p>
          <ul>
            {flagged.map((athlete) => (
              <li key={athlete.userId}>{athlete.displayName}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="panel">
        <div className="roster-heading">
          <h2>
            <Trophy size={22} /> Roster
          </h2>
          <button type="button" className="ghost roster-refresh" onClick={refresh} disabled={loading}>
            <RefreshCw size={14} /> Refresh
          </button>
        </div>

        {loading ? (
          <p className="muted">Loading roster...</p>
        ) : roster.length === 0 && error ? (
          <EmptyState
            icon={AlertTriangle}
            title="Couldn't load your roster"
            description={`${error} This is usually a connection problem, and nothing was lost.`}
            actions={
              <button type="button" onClick={refresh}>
                <RefreshCw size={16} aria-hidden="true" /> Try again
              </button>
            }
          />
        ) : roster.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No athletes on your roster yet"
            description={
              <>
                Athletes join with your invite code{" "}
                <strong className="invite-code-inline">{team.invite_code}</strong>. Once they do, each one shows up
                here with a readiness score and when they last checked in. Tap a name to see their stats and PRs.
              </>
            }
            actions={
              <CopyButton
                className=""
                getText={() => buildInviteMessage(team.name, team.invite_code, window.location.origin)}
              >
                Copy invite message
              </CopyButton>
            }
            preview={
              <>
                <div className="preview-row">
                  <span>
                    <strong>Jordan M.</strong> <span className="muted">Opened 2h ago</span>
                  </span>
                  <span className="pill roster-recovery roster-recovery-good">84% · Good</span>
                </div>
                <div className="preview-row">
                  <span>
                    <strong>Riley K.</strong> <span className="muted">Opened yesterday</span>
                  </span>
                  <span className="pill roster-recovery roster-recovery-caution">61% · Caution</span>
                </div>
              </>
            }
          />
        ) : (
          <div className="roster-table">
            {roster.map((athlete) => (
              <div
                role="button"
                tabIndex={0}
                className="roster-row"
                key={athlete.userId}
                onClick={() => setSelectedAthlete(athlete)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    setSelectedAthlete(athlete);
                  }
                }}
              >
                <div className="roster-athlete-name">
                  <strong>{athlete.displayName}</strong>
                  {athlete.needsCheckIn && athlete.lastCheckIn !== null && (
                    <span className="pill roster-flag">Needs check-in</span>
                  )}
                  <span className="muted roster-last-active">{formatLastActive(athlete.lastActiveAt)}</span>
                </div>

                {athlete.lastCheckIn === null ? (
                  // A brand-new athlete hasn't been scored yet. Showing "0% Low" would read as an emergency.
                  <span className="pill roster-recovery roster-recovery-none">No check-in yet</span>
                ) : (
                  <span className={`pill roster-recovery roster-recovery-${recoverySlug(athlete.recoveryLabel)}`}>
                    {athlete.recovery}% · {athlete.recoveryLabel}
                  </span>
                )}

                <button
                  type="button"
                  className="ghost danger-button"
                  onClick={(event) => {
                    event.stopPropagation();
                    requestRemove(athlete);
                  }}
                  disabled={removingId === athlete.userId}
                >
                  <UserMinus size={14} /> Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {error && roster.length > 0 && (
        <div className="empty-state">
          <p className="muted">{error}</p>
        </div>
      )}

      {selectedAthlete && (
        <AthleteStatsModal
          userId={selectedAthlete.userId}
          displayName={selectedAthlete.displayName}
          onClose={() => setSelectedAthlete(null)}
        />
      )}

      {pendingRemoval && (
        <ConfirmModal
          title="Remove athlete?"
          message={`Remove ${pendingRemoval.displayName} from your roster?`}
          confirmLabel="Remove"
          danger
          onConfirm={confirmRemove}
          onCancel={() => setPendingRemoval(null)}
        />
      )}
      </>
      )}
    </div>
  );
}
