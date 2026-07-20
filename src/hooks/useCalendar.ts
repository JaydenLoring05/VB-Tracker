import { useMemo } from "react";

import { useTrackerContext } from "@/context/TrackerContext";
import { useTeam } from "@/hooks/useTeam";
import { useTeamCalendar } from "@/hooks/useTeamCalendar";
import { todayISO } from "@/lib/storage";

const TRAINING_LOAD_WINDOW_DAYS = 7;

export type CalendarPreviewEvent = {
  id: string;
  title: string;
  type: string;
  source: "personal" | "team";
};

export function useCalendar() {
  const { calendarEvents, addGame } = useTrackerContext();
  // Reused as-is: useTeam() already resolves "the caller's team" for both
  // roles, so an athlete gets their one team back here with no new fetch
  // logic. useTeamCalendar() is read-only for non-coaches under RLS.
  const { activeTeam } = useTeam();
  const { events: teamEvents } = useTeamCalendar(activeTeam);

  const calendarPreview = useMemo(() => {
    const days = [];
    const start = new Date();

    for (let i = 0; i < 14; i++) {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      const iso = todayISO(date);

      const personal: CalendarPreviewEvent[] = calendarEvents
        .filter((event) => event.date === iso)
        .map((event) => ({ id: event.id, title: event.title, type: event.type, source: "personal" }));

      const team: CalendarPreviewEvent[] = teamEvents
        .filter((event) => event.date === iso)
        .map((event) => ({ id: event.id, title: event.title, type: event.type, source: "team" }));

      days.push({
        iso,
        day: date.toLocaleDateString("en-US", { weekday: "short" }),
        number: date.getDate(),
        events: [...team, ...personal]
      });
    }

    return days;
  }, [calendarEvents, teamEvents]);

  const trainingLoad = useMemo(() => {
    const windowStart = new Date();
    windowStart.setDate(windowStart.getDate() - TRAINING_LOAD_WINDOW_DAYS);
    const windowStartIso = todayISO(windowStart);
    const todayIso = todayISO();

    return calendarEvents.reduce((sum, event) => {
      if (event.date < windowStartIso || event.date > todayIso) return sum;

      const weights = {
        workout: 3,
        practice: 4,
        game: 5,
        recovery: 1,
        rest: 0
      };

      return sum + weights[event.type];
    }, 0);
  }, [calendarEvents]);

  return {
    calendarEvents,
    addGame,
    calendarPreview,
    trainingLoad
  };
}
