"use client";

import { CalendarDays, Trash2 } from "lucide-react";
import { FormEvent, useState } from "react";

import { useTeamCalendar } from "@/hooks/useTeamCalendar";
import { todayISO } from "@/lib/storage";
import { Team, TeamCalendarEventType } from "@/types";

const EVENT_TYPES: { value: TeamCalendarEventType; label: string }[] = [
  { value: "practice", label: "Practice" },
  { value: "match", label: "Match" },
  { value: "tournament", label: "Tournament" },
  { value: "travel", label: "Travel" },
  { value: "testing", label: "Testing Day" },
  { value: "playoffs", label: "Playoffs" }
];

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

  return (
    <div className="panel">
      <div className="roster-heading">
        <h2>
          <CalendarDays size={22} /> Team Calendar
        </h2>
        <button type="button" className="ghost" onClick={() => setShowForm((current) => !current)}>
          {showForm ? "Cancel" : "+ Add Event"}
        </button>
      </div>

      <p className="muted">Visible to every athlete on {team.name}.</p>

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
        <p className="muted">No upcoming team events yet.</p>
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
