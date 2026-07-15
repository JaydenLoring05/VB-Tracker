"use client";

import { CalendarDays } from "lucide-react";

import { useCalendar } from "@/hooks/useCalendar";

export function CalendarPanel() {
  const { calendarPreview, trainingLoad, addGame } = useCalendar();

  function handleAddGame() {
    const title = prompt("Game title?");
    if (!title) return;
    addGame(title);
  }

  return (
    <div id="calendar" className="panel">
      <h2>
        <CalendarDays size={22} /> Calendar + Training Load
      </h2>

      <p className="muted">Training Load: {trainingLoad}</p>
      <button onClick={handleAddGame}>Add Game Today</button>

      <div className="calendar-preview" style={{ marginTop: 16 }}>
        {calendarPreview.map((day) => (
          <div className="calendar-day" key={day.iso}>
            <strong>
              {day.day} {day.number}
            </strong>

            {day.events.slice(0, 2).map((event) => (
              <span key={event.id} className={`event-chip ${event.type}`}>
                {event.title}
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
