"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { Brand } from "@/components/shared/Brand";
import { createClient } from "@/lib/supabase/client";
import { parseViewerToken, summarizeViewerData, type ViewerSummary } from "@/lib/viewerLinks";

type State = { kind: "loading" } | { kind: "invalid" } | { kind: "error" } | { kind: "ready"; summary: ViewerSummary };

function workoutDate(dateISO: string): string {
  return new Date(`${dateISO}T12:00:00`).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

function inches(value: number | null): string {
  return value == null ? "Not logged" : `${Number.isInteger(value) ? value : value.toFixed(1)} in`;
}

/**
 * The page a parent or coach opens from an athlete's private link (P-06).
 * Read-only, no sign-in. Loads in the browser so dates are the viewer's own.
 */
export function TrainingViewer({ token }: { token: string | null }) {
  const valid = parseViewerToken(token);
  const supabase = useMemo(() => createClient(), []);
  const [state, setState] = useState<State>(valid ? { kind: "loading" } : { kind: "invalid" });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!valid) return;
    let cancelled = false;
    supabase.rpc("viewer_summary", { p_token: valid }).then(({ data, error }) => {
      if (cancelled) return;
      if (error) {
        console.error("viewer summary failed", error.message);
        setState({ kind: "error" });
        return;
      }
      const summary = summarizeViewerData(data);
      setState(summary ? { kind: "ready", summary } : { kind: "invalid" });
    });
    return () => {
      cancelled = true;
    };
  }, [supabase, valid, attempt]);

  return (
    <main id="main-content" tabIndex={-1} className="auth-shell">
      <div className="panel auth-card viewer-card" aria-live="polite" aria-busy={state.kind === "loading"}>
        <div className="auth-brand">
          <Brand />
        </div>

        {state.kind === "loading" && <p className="muted">Loading training summary…</p>}

        {state.kind === "invalid" && (
          <>
            <h1>This link doesn&apos;t work</h1>
            <p className="muted">
              The athlete may have stopped sharing, or the link was copied incompletely. Ask them to send a new one.
            </p>
          </>
        )}

        {state.kind === "error" && (
          <>
            <h1>Couldn&apos;t load this right now</h1>
            <p className="muted">Check your connection and try again.</p>
            <button
              type="button"
              className="viewer-retry"
              onClick={() => {
                setState({ kind: "loading" });
                setAttempt((n) => n + 1);
              }}
            >
              Try again
            </button>
          </>
        )}

        {state.kind === "ready" && <ViewerBody summary={state.summary} />}
      </div>
    </main>
  );
}

function ViewerBody({ summary }: { summary: ViewerSummary }) {
  const name = summary.firstName;
  return (
    <>
      <h1>{name ? `${name}'s training` : "Training summary"}</h1>
      <p className="muted">
        Shared with you as {summary.role === "parent" ? "a parent" : "a coach"}. Read-only, and it updates as{" "}
        {name ?? "they"} train{name ? "s" : ""}.
      </p>

      <dl className="viewer-stats">
        <div>
          <dt>Workouts this week</dt>
          <dd>{summary.workoutsThisWeek}</dd>
        </div>
        <div>
          <dt>Workouts, last 4 weeks</dt>
          <dd>{summary.workoutsLast4Weeks}</dd>
        </div>
        <div>
          <dt>Check-in days</dt>
          <dd>
            {summary.checkInDays14}
            <span className="viewer-of"> of the last 14</span>
          </dd>
        </div>
        <div>
          <dt>Training days</dt>
          <dd>
            {summary.workoutDays14}
            <span className="viewer-of"> of the last 14</span>
          </dd>
        </div>
        <div>
          <dt>Best vertical</dt>
          <dd>{inches(summary.bestVertical)}</dd>
        </div>
        <div>
          <dt>Best approach touch</dt>
          <dd>{inches(summary.bestApproach)}</dd>
        </div>
      </dl>

      <h2 className="viewer-heading">Recent workouts</h2>
      {summary.recentWorkouts.length === 0 ? (
        <p className="muted">No finished workouts in the last 5 weeks.</p>
      ) : (
        <ul className="viewer-workouts">
          {summary.recentWorkouts.map((workout, index) => (
            <li key={`${workout.date}-${index}`}>
              <span>{workoutDate(workout.date)}</span>
              <span className="muted">{workout.minutes ? `${workout.minutes} min` : "Finished"}</span>
            </li>
          ))}
        </ul>
      )}

      <p className="muted viewer-footer">
        Pain, sleep and notes stay private to the athlete. <Link href="/">What is NextRep?</Link>
      </p>
    </>
  );
}
