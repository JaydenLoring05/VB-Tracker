import { useMemo } from "react";

import { useTrackerContext } from "@/context/TrackerContext";
import { todayISO } from "@/lib/storage";

const TRAINING_LOAD_WINDOW_DAYS = 7;

export function useCalendar() {
  const { calendarEvents, addGame } = useTrackerContext();

  const calendarPreview = useMemo(() => {
    const days = [];
    const start = new Date();

    for (let i = 0; i < 14; i++) {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      const iso = todayISO(date);

      days.push({
        iso,
        day: date.toLocaleDateString("en-US", { weekday: "short" }),
        number: date.getDate(),
        events: calendarEvents.filter((event) => event.date === iso)
      });
    }

    return days;
  }, [calendarEvents]);

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
