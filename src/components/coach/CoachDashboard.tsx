"use client";

import { AlertTriangle, Copy, RefreshCw, Trophy, UserMinus, Users } from "lucide-react";
import { useState } from "react";

import { useCoachRoster } from "@/hooks/useCoachRoster";
import { formatLastActive } from "@/lib/time";
import { RosterAthlete, Team } from "@/types";

import { AthleteStatsModal } from "./AthleteStatsModal";

function recoverySlug(label: string) {
  return label.toLowerCase();
}

export function CoachDashboard({ team }: { team: Team }) {
  const { loading, roster, flagged, error, removeAthlete, refresh } = useCoachRoster(team);
  const [copied, setCopied] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [selectedAthlete, setSelectedAthlete] = useState<RosterAthlete | null>(null);

  async function handleCopyCode() {
    try {
      await navigator.clipboard.writeText(team.invite_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard isn't critical; the code is still shown on screen.
    }
  }

  async function handleRemove(userId: string, displayName: string) {
    if (removingId) return;

    const confirmed = window.confirm(`Remove ${displayName} from your roster?`);
    if (!confirmed) return;

    setRemovingId(userId);
    await removeAthlete(userId);
    setRemovingId(null);
  }

  return (
    <div className="coach-dashboard">
      <div className="panel team-header">
        <div>
          <h2>
            <Users size={22} /> {team.name}
          </h2>
          <p className="muted">
            {roster.length} athlete{roster.length === 1 ? "" : "s"} on your roster
          </p>
        </div>

        <button className="secondary invite-code-button" onClick={handleCopyCode} type="button">
          <Copy size={16} /> {copied ? "Copied!" : `Invite code: ${team.invite_code}`}
        </button>
      </div>

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
        ) : roster.length === 0 ? (
          <div className="empty-state">
            <p className="muted">
              No athletes yet. Share your invite code above to build your roster.
            </p>
          </div>
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
                  {athlete.needsCheckIn && <span className="pill roster-flag">Needs check-in</span>}
                  <span className="muted roster-last-active">{formatLastActive(athlete.lastActiveAt)}</span>
                </div>

                <span className={`pill roster-recovery roster-recovery-${recoverySlug(athlete.recoveryLabel)}`}>
                  {athlete.recovery}% · {athlete.recoveryLabel}
                </span>

                <button
                  type="button"
                  className="ghost danger-button"
                  onClick={(event) => {
                    event.stopPropagation();
                    handleRemove(athlete.userId, athlete.displayName);
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

      {error && (
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
    </div>
  );
}
