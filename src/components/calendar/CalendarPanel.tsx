"use client";

import { FormEvent, useState } from "react";

import { useCalendar } from "@/hooks/useCalendar";
import { todayISO } from "@/lib/storage";

export function CalendarPanel() {
  const { calendarPreview, trainingLoad, addGame } = useCalendar();
  const [isAddingGame, setIsAddingGame] = useState(false);
  const [gameTitle, setGameTitle] = useState("");

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const title = gameTitle.trim();
    if (!title) return;

    addGame(title);
    setGameTitle("");
    setIsAddingGame(false);
  }

  return (
    <div id="calendar" className="panel">
      <h2>Calendar + Training Load</h2>

      <p className="muted">Training Load (last 7 days): {trainingLoad}</p>

      {isAddingGame ? (
        <form className="add-game-form" onSubmit={handleSubmit}>
          <input
            autoFocus
            aria-label="Game title"
            value={gameTitle}
            onChange={(e) => setGameTitle(e.target.value)}
            placeholder="Game title"
          />
          <button type="submit">Add</button>
          <button
            type="button"
            className="secondary"
            onClick={() => {
              setIsAddingGame(false);
              setGameTitle("");
            }}
          >
            Cancel
          </button>
        </form>
      ) : (
        <button onClick={() => setIsAddingGame(true)}>Add Game Today</button>
      )}

      <div className="calendar-preview" style={{ marginTop: 16 }}>
        {calendarPreview.map((day) => (
          <div className={`calendar-day${day.iso === todayISO() ? " is-today" : ""}`} key={day.iso}>
            <strong>
              {day.day} {day.number}
            </strong>

            {day.events.slice(0, 3).map((event) => (
              <span key={event.id} className={`event-chip ${event.type}`}>
                {event.source === "team" && <span className="event-chip-team-tag">Team</span>}
                {event.title}
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
