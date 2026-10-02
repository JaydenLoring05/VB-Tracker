"use client";

import { Check, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { InviteShare } from "@/components/coach/InviteShare";
import { CopyButton } from "@/components/shared/CopyButton";
import { useDemo } from "@/context/DemoContext";
import { useTeamSetup } from "@/hooks/useTeamSetup";
import { buildCheckInReminder, buildInviteMessage, SetupStep } from "@/lib/teamSetup";
import { RosterAthlete, Team } from "@/types";

import "@/styles/first-run.css";

type Props = {
  team: Team;
  roster: RosterAthlete[];
  rosterLoading: boolean;
};

export function TeamReadyChecklist(props: Props) {
  // The demo's sample team is already set up; the guide is for real first-run coaches.
  if (useDemo()) return null;
  return <TeamReadyChecklistContent {...props} />;
}

function TeamReadyChecklistContent({ team, roster, rosterLoading }: Props) {
  const { ready, progress, dismissed, finished, dismiss, restore, markProgramReviewed } = useTeamSetup(
    team,
    roster,
    rosterLoading
  );
  const restoreRef = useRef<HTMLButtonElement>(null);
  const [justDismissed, setJustDismissed] = useState(false);
  useEffect(() => {
    if (justDismissed && dismissed) restoreRef.current?.focus();
  }, [justDismissed, dismissed]);

  if (!ready) return null;

  if (dismissed) {
    // Finished and put away: never show anything again.
    if (finished || progress.complete) return null;

    return (
      <div className="setup-restore">
        <button ref={restoreRef} type="button" className="setup-link" onClick={restore}>
          Show setup guide ({progress.completed} of {progress.total} done)
        </button>
      </div>
    );
  }

  const { next } = progress;

  function handleDismiss() {
    setJustDismissed(true);
    dismiss(progress.complete);
  }

  function renderActions(step: SetupStep) {
    if (step.id === "invite") {
      return (
        <div className="setup-actions">
          <CopyButton
            className=""
            getText={() => buildInviteMessage(team.name, team.invite_code, window.location.origin)}
          >
            Copy invite message
          </CopyButton>
          <InviteShare team={team} compact />
          <span className="muted setup-code">
            Code <strong>{team.invite_code}</strong>
          </span>
        </div>
      );
    }

    if (step.id === "program") {
      return (
        <div className="setup-actions">
          {/* The program lives on the Plan page; opening it counts as reviewing it. Coming back
              to /coach remounts the guide, so any changes made there are picked up. */}
          <Link href="/plan" className="button-link" onClick={markProgramReviewed}>
            Open program
          </Link>
        </div>
      );
    }

    if (step.id === "readiness" && roster.length > 0) {
      return (
        <div className="setup-actions">
          <CopyButton className="" getText={() => buildCheckInReminder(team.name, window.location.origin)}>
            Copy check-in reminder
          </CopyButton>
        </div>
      );
    }

    return null;
  }

  return (
    <section className="panel setup-guide" aria-labelledby="setup-guide-title">
      <div className="setup-header">
        <div>
          <p className="setup-eyebrow">{progress.complete ? "All set" : "Getting started"}</p>
          <h2 id="setup-guide-title" className="setup-title">
            {progress.complete ? "Your team is ready" : "Get your team ready"}
          </h2>
          <p className="muted setup-summary">
            {progress.complete
              ? "Athletes are checking in and readiness shows on your roster."
              : progress.coachWorkDone
                ? "Your part is done. Readiness fills in as athletes check in."
                : `${progress.completed} of ${progress.total} steps done. Most teams finish in a few minutes.`}
          </p>
        </div>

        <button type="button" className={progress.complete ? "" : "ghost setup-hide"} onClick={handleDismiss}>
          {progress.complete ? (
            "Got it"
          ) : (
            <>
              <X size={14} aria-hidden="true" /> Hide
            </>
          )}
        </button>
      </div>

      <div
        className="progress-bar setup-progress"
        role="progressbar"
        aria-label="Team setup progress"
        aria-valuemin={0}
        aria-valuemax={progress.total}
        aria-valuenow={progress.completed}
        aria-valuetext={`${progress.completed} of ${progress.total} steps done`}
      >
        <div className="progress-fill" style={{ width: `${progress.percent}%` }} />
      </div>

      <ol className="setup-steps">
        {progress.steps.map((step, index) => {
          const isCurrent = next?.id === step.id;
          const state = step.done ? "done" : isCurrent ? "current" : "todo";

          return (
            <li key={step.id} className={`setup-step setup-step-${state}`} aria-current={isCurrent ? "step" : undefined}>
              <span className="setup-marker" aria-hidden="true">
                {step.done ? <Check size={14} strokeWidth={3} /> : index + 1}
              </span>
              <div className="setup-step-body">
                <p className="setup-step-title">
                  {step.title}
                  <span className="sr-only">{step.done ? " (done)" : isCurrent ? " (next)" : ""}</span>
                </p>
                {step.done && <p className="muted setup-step-note">{step.doneText}</p>}
                {isCurrent && (
                  <>
                    <p className="muted setup-step-note">{step.hint}</p>
                    {renderActions(step)}
                  </>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
