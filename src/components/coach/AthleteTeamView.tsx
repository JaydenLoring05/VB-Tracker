"use client";

import { CalendarDays, Users } from "lucide-react";
import Link from "next/link";

import { EmptyState } from "@/components/shared/EmptyState";
import { useTrackerContext } from "@/context/TrackerContext";
import { useRecoveryStats } from "@/hooks/useRecoveryStats";
import { useTeamCalendar } from "@/hooks/useTeamCalendar";
import { todayISO } from "@/lib/storage";
import { Team } from "@/types";

import "@/styles/first-run.css";

/** What an athlete sees on the Team page once they have joined a team. */
export function AthleteTeamView({ team }: { team: Team }) {
  const { teamOverride } = useTrackerContext();
  const { hasLoggedStats } = useRecoveryStats();
  const { loading, events, error } = useTeamCalendar(team);

  const today = todayISO();
  const upcoming = events.filter((event) => event.date >= today).slice(0, 5);
  const customizedCount = teamOverride
    ? Object.keys(teamOverride.dayOverrides).length + Object.keys(teamOverride.exerciseDefaults).length
    : 0;

  return (
    <div className="athlete-team">
      <div className="panel">
        <h2>
          <Users size={22} /> {team.name}
        </h2>
        <p className="muted">
          You&apos;re on this team as an athlete. Your coach can see your recovery stats and training history to
          check in on you. Your data stays read-only to them.
        </p>
        <p className="muted">
          {customizedCount > 0
            ? "Your coach has adjusted the training plan for your team, and your Workouts page already reflects it."
            : "You're following the standard training plan. If your coach changes it, your Workouts page updates on its own."}
        </p>

        <div className="athlete-team-actions">
          {hasLoggedStats ? (
            <Link href="/workout" className="button-link">
              Start today&apos;s workout
            </Link>
          ) : (
            <Link href="/stats" className="button-link">
              Log your first check-in
            </Link>
          )}
        </div>
      </div>

      <div className="panel">
        <h2>
          <CalendarDays size={22} /> Team schedule
        </h2>

        {error ? (
          <p className="muted">{error}</p>
        ) : loading ? (
          <p className="muted">Loading team schedule...</p>
        ) : upcoming.length === 0 ? (
          <EmptyState
            compact
            icon={CalendarDays}
            title="Nothing scheduled yet"
            description="Practices, matches and travel days your coach adds will show up here and on your Calendar."
            actions={
              <Link href="/calendar" className="button-link secondary">
                Open my calendar
              </Link>
            }
          />
        ) : (
          <ul className="team-event-list">
            {upcoming.map((event) => (
              <li key={event.id} className="team-event-row">
                <span className={`event-chip ${event.type}`}>{event.type}</span>
                <span className="muted">{event.date}</span>
                <strong>{event.title}</strong>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
