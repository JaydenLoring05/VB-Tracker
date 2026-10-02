import { useMemo } from "react";

import { useTrackerContext } from "@/context/TrackerContext";
import { useTeam } from "@/hooks/useTeam";
import { useTeamCalendar } from "@/hooks/useTeamCalendar";
import { todayISO } from "@/lib/storage";
import { computeTrainingLoad } from "@/lib/trainingLoad";

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

  // Personal events plus the team calendar; see src/lib/trainingLoad.ts for
  // the weights and how a session on both calendars is counted once.
  const trainingLoad = useMemo(
    () => computeTrainingLoad({ personal: calendarEvents, team: teamEvents, today: todayISO() }),
    [calendarEvents, teamEvents]
  );

  return {
    calendarEvents,
    addGame,
    calendarPreview,
    trainingLoad
  };
}
