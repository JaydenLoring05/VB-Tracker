"use client";

import { CalendarDays, Trash2 } from "lucide-react";
import { FormEvent, useState } from "react";

import { EmptyState } from "@/components/shared/EmptyState";
import { useTeamCalendar } from "@/hooks/useTeamCalendar";
import { todayISO } from "@/lib/storage";
import { Team, TeamCalendarEventType } from "@/types";

import "@/styles/calendar.css";

const EVENT_TYPES: { value: TeamCalendarEventType; label: string }[] = [
  { value: "practice", label: "Practice" },
  { value: "match", label: "Match" },
  { value: "tournament", label: "Tournament" },
  { value: "travel", label: "Travel" },
  { value: "testing", label: "Testing Day" },
  { value: "playoffs", label: "Playoffs" }
];

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function toISODate(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

/** The Monday-to-Sunday week that contains the given ISO date. */
function weekOf(todayIso: string) {
  const [year, month, day] = todayIso.split("-").map(Number);
  const today = new Date(year, month - 1, day);
  const offset = (today.getDay() + 6) % 7;
  return WEEKDAYS.map((label, index) => {
    const date = new Date(year, month - 1, day - offset + index);
    return { label, date: toISODate(date), dayOfMonth: date.getDate() };
  });
}

export function TeamCalendarPanel({ team }: { team: Team }) {
  const { loading, events, error, addEvent, deleteEvent } = useTeamCalendar(team);
  const [showForm, setShowForm] = useState(false);
  const [date, setDate] = useState(todayISO());
  const [type, setType] = useState<TeamCalendarEventType>("practice");
  const [title, setTitle] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!title.trim() || saving) return;

    setSaving(true);
    const ok = await addEvent({ date, type, title: title.trim() });
    setSaving(false);

    if (ok) {
      setTitle("");
      setShowForm(false);
    }
  }

  const today = todayISO();
  const upcoming = events.filter((event) => event.date >= today).slice(0, 8);
  const week = weekOf(today);

  return (
    <div className="panel">
      <div className="roster-heading">
        <h2>Team Calendar</h2>
        <button type="button" className="ghost" onClick={() => setShowForm((current) => !current)}>
          {showForm ? "Cancel" : "+ Add Event"}
        </button>
      </div>

      <p className="muted">Visible to every athlete on {team.name}.</p>

      <ol className="team-week" aria-label="This week">
        {week.map((day) => {
          const dayEvents = events.filter((event) => event.date === day.date);
          const label = dayEvents.length > 0 ? dayEvents[0].type : null;
          return (
            <li
              key={day.date}
              className={`team-week-day${day.date === today ? " is-today" : ""}${label ? " has-event" : ""}`}
              aria-current={day.date === today ? "date" : undefined}
            >
              <span className="team-week-dow">{day.label}</span>
              <span className="team-week-num">{day.dayOfMonth}</span>
              <span className={`team-week-tag${label ? "" : " team-week-tag-empty"}`}>{label ?? "Open"}</span>
            </li>
          );
        })}
      </ol>

      {showForm && (
        <form className="team-event-form" onSubmit={handleSubmit}>
          <input type="date" value={date} onChange={(event) => setDate(event.target.value)} required />
          <select value={type} onChange={(event) => setType(event.target.value as TeamCalendarEventType)}>
            {EVENT_TYPES.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Event title, ex: Away match at Central"
          />
          <button type="submit" disabled={!title.trim() || saving}>
            {saving ? "Saving..." : "Add"}
          </button>
        </form>
      )}

      {error && <p className="muted">{error}</p>}

      {loading ? (
        <p className="muted">Loading team calendar...</p>
      ) : upcoming.length === 0 ? (
        <EmptyState
          compact
          icon={CalendarDays}
          title="No upcoming team events"
          description="Add practices, matches and travel days. Athletes see them on their own calendar, so nobody has to ask when the next one is."
          actions={
            !showForm && (
              <button type="button" onClick={() => setShowForm(true)}>
                Add your first event
              </button>
            )
          }
        />
      ) : (
        <ul className="team-event-list">
          {upcoming.map((event) => (
            <li key={event.id} className="team-event-row">
              <span className={`event-chip ${event.type}`}>{event.type}</span>
              <span className="muted">{event.date}</span>
              <strong>{event.title}</strong>
              <button
                type="button"
                className="ghost danger-button"
                aria-label={`Remove ${event.title}`}
                onClick={() => deleteEvent(event.id)}
              >
                <Trash2 size={14} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
