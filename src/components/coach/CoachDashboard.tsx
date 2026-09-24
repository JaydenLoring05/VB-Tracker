"use client";

import { AlertTriangle, Copy, RefreshCw, UserMinus, Users } from "lucide-react";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

import { useDemo } from "@/context/DemoContext";
import { useAttentionCenter } from "@/hooks/useAttentionCenter";
import { useCoachRoster } from "@/hooks/useCoachRoster";
import { buildInviteMessage } from "@/lib/teamSetup";
import { formatLastActive } from "@/lib/time";
import { RosterAthlete, Team } from "@/types";
import { ConfirmModal } from "@/components/shared/ConfirmModal";
import { InlineError } from "@/components/shared/InlineError";
import { SkeletonRegion, SkeletonRow } from "@/components/shared/Skeleton";
import { CopyButton } from "@/components/shared/CopyButton";
import { Avatar } from "@/components/shared/Avatar";
import { EmptyState } from "@/components/shared/EmptyState";
import { StatusLabel } from "@/components/shared/StatusLabel";

import { AttentionCenter } from "./AttentionCenter";
import { ProgramEditor } from "./ProgramEditor";
import { TeamCalendarPanel } from "./TeamCalendarPanel";
import { TeamStatStrip } from "./TeamStatStrip";
import { TeamReadyChecklist } from "./TeamReadyChecklist";
import { TeamSwitcher } from "./TeamSwitcher";

import "@/styles/roster.css";

// The stats modal pulls in the whole charting library, which the roster itself never needs. Load it
// as a separate chunk (fetched when the browser is idle, see below) to keep the dashboard's first
// load small.
const loadAthleteStatsModal = () => import("./AthleteStatsModal").then((module) => module.AthleteStatsModal);
const AthleteStatsModal = dynamic(loadAthleteStatsModal, { ssr: false });

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
  const demo = useDemo();
  const { loading, roster, flagged, error, removeAthlete, refresh } = useCoachRoster(team);
  const {
    loading: attentionLoading,
    items: attentionItems,
    error: attentionError,
    retry: retryAttention
  } = useAttentionCenter(team, roster);
  // A failed roster load leaves the roster empty; a failed removal leaves it
  // populated. Only the first should replace the roster with an error state.
  const rosterLoadFailed = Boolean(error) && roster.length === 0;
  const [activeTab, setActiveTab] = useState<"roster" | "program">("roster");
  const [copied, setCopied] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [selectedAthlete, setSelectedAthlete] = useState<RosterAthlete | null>(null);
  const [pendingRemoval, setPendingRemoval] = useState<RosterAthlete | null>(null);
  const [regenerating, setRegenerating] = useState(false);
  const [regeneratedCode, setRegeneratedCode] = useState<string | null>(null);

  useEffect(() => {
    // Warm the modal's chunk once the page has settled so the first click opens it instantly.
    const idle = window.requestIdleCallback ?? ((callback: () => void) => window.setTimeout(callback, 2000));
    const handle = idle(() => void loadAthleteStatsModal());
    return () => {
      if (window.cancelIdleCallback) window.cancelIdleCallback(handle);
      else window.clearTimeout(handle);
    };
  }, []);

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
    if (demo) {
      demo.requestSignup("Managing your roster");
      return;
    }

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
        // While the roster is still loading (or failed), the attention hook sees
        // an empty roster; without this it would briefly report "All caught up".
        loading={attentionLoading || loading}
        error={rosterLoadFailed ? error : attentionError}
        onRetry={rosterLoadFailed ? refresh : retryAttention}
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
          <p className="micro micro-gold">Team dashboard</p>
          <h2>{team.name}</h2>
          <p className="muted">
            {loading
              ? "Loading roster..."
              : rosterLoadFailed
                ? "Roster unavailable"
                : `${roster.length} athlete${roster.length === 1 ? "" : "s"} on your roster`}
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

      {!demo && !loading && !rosterLoadFailed && <TeamStatStrip roster={roster} attentionItems={attentionItems} />}

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
          <h2>Roster</h2>
          <button type="button" className="ghost roster-refresh" onClick={refresh} disabled={loading}>
            <RefreshCw size={14} /> Refresh
          </button>
        </div>

        {loading ? (
          <SkeletonRegion label="Loading roster">
            <SkeletonRow />
            <SkeletonRow />
            <SkeletonRow />
            <SkeletonRow />
          </SkeletonRegion>
        ) : rosterLoadFailed && error ? (
          <InlineError message={error} onRetry={refresh} />
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
                  <StatusLabel label="Good" className="roster-status" />
                </div>
                <div className="preview-row">
                  <span>
                    <strong>Riley K.</strong> <span className="muted">Opened yesterday</span>
                  </span>
                  <StatusLabel label="Caution" className="roster-status" />
                </div>
              </>
            }
          />
        ) : (
          <div className="roster-table">
            {roster.map((athlete) => (
              <div className="roster-row" key={athlete.userId}>
                <Avatar name={athlete.displayName} />
                <div className="roster-athlete-name">
                  {/* The name is the row's real button; its ::after stretches over the whole row so
                      the entire row still clicks, without nesting the Remove button inside a button. */}
                  <button
                    type="button"
                    className="roster-open"
                    aria-haspopup="dialog"
                    onClick={() => setSelectedAthlete(athlete)}
                  >
                    {athlete.displayName}
                  </button>
                  {athlete.needsCheckIn && athlete.lastCheckIn !== null && (
                    <span className="pill roster-flag">Needs check-in</span>
                  )}
                  <span className="muted roster-last-active">{formatLastActive(athlete.lastActiveAt)}</span>
                </div>

                {athlete.lastCheckIn === null ? (
                  // A brand-new athlete hasn't been scored yet. Showing "0% Low" would read as an emergency.
                  <span className="status roster-status">No check-in yet</span>
                ) : (
                  <>
                    <StatusLabel label={athlete.recoveryLabel} className="roster-status" />
                    <span className="roster-score">
                      {athlete.recovery}
                    </span>
                  </>
                )}

                <button
                  type="button"
                  className="ghost danger-button"
                  onClick={() => requestRemove(athlete)}
                  disabled={removingId === athlete.userId}
                  aria-label={`Remove ${athlete.displayName}`}
                >
                  <UserMinus size={14} aria-hidden="true" /> Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {error && !rosterLoadFailed && (
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
