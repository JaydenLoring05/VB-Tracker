"use client";

import { Users, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { TeamReadyChecklist } from "@/components/coach/TeamReadyChecklist";
import { useCoachRoster } from "@/hooks/useCoachRoster";
import { useProfile } from "@/hooks/useProfile";
import { useTeam } from "@/hooks/useTeam";
import { Team } from "@/types";

import "@/styles/first-run.css";

const JOIN_NUDGE_KEY = "nextrep:dismissed:join-team-nudge";

function CoachSetup({ team }: { team: Team }) {
  const { loading, roster } = useCoachRoster(team);
  return <TeamReadyChecklist team={team} roster={roster} rosterLoading={loading} />;
}

function JoinTeamNudge() {
  const { loading, profile } = useProfile();
  // Start hidden so a previously dismissed card never flashes on load.
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      setVisible(window.localStorage.getItem(JOIN_NUDGE_KEY) !== "1");
    } catch {
      setVisible(true);
    }
  }, []);

  if (!visible || loading) return null;

  // Accounts confirmed by email skip the sign-up onboarding, so they have no
  // role details saved yet. Send those to the full flow instead of the bare team page.
  const onboarded = !!(profile?.position || profile?.competitive_level);

  function dismiss() {
    setVisible(false);
    try {
      window.localStorage.setItem(JOIN_NUDGE_KEY, "1");
    } catch {
      // Fine: the card just shows again next visit.
    }
  }

  return (
    <section className="panel" aria-labelledby="join-team-title">
      <div className="nudge-row">
        <div>
          <h2 id="join-team-title">
            <Users size={20} aria-hidden="true" /> {onboarded ? "Train with a team" : "Finish setting up"}
          </h2>
          <p className="muted">
            {onboarded
              ? "Got an invite code from your coach? Join to share your check-ins with them. Coaches can create a team here too. NextRep works on your own either way."
              : "Tell us if you're a coach or an athlete, then create or join your team. It takes about a minute, and you can skip it and train on your own."}
          </p>
        </div>

        <div className="nudge-actions">
          <Link href={onboarded ? "/coach" : "/onboarding"} className="button-link secondary">
            {onboarded ? "Join or create a team" : "Start setup"}
          </Link>
          <button type="button" className="ghost setup-hide" onClick={dismiss} aria-label="Dismiss team suggestion">
            <X size={14} aria-hidden="true" />
          </button>
        </div>
      </div>
    </section>
  );
}

/**
 * Sits above the dashboard cards. Coaches see their setup guide until the team
 * is ready; athletes without a team get one dismissible pointer to join.
 * Athletes already on a team see nothing.
 */
export function TeamNudge() {
  const { loading, teams, activeTeam, role } = useTeam();

  if (loading) return null;

  let content = null;

  if (teams.length === 0 || !activeTeam || !role) content = <JoinTeamNudge />;
  else if (role === "coach") content = <CoachSetup team={activeTeam} />;

  if (!content) return null;

  return <div className="dashboard-nudge">{content}</div>;
}
