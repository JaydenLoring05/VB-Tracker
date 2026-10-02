import type { CalendarEvent, TeamCalendarEventType } from "@/types";

// Training load over the trailing week: a simple sum of per-event weights on
// a 0-5 "session" scale, where a match is 5. The personal weights are the
// ones useCalendar has always used; team weights are set to sit on the same
// scale.

export const TRAINING_LOAD_WINDOW_DAYS = 7;

export const PERSONAL_EVENT_LOAD: Record<CalendarEvent["type"], number> = {
  workout: 3,
  practice: 4,
  game: 5,
  recovery: 1,
  rest: 0
};

export const TEAM_EVENT_LOAD: Record<TeamCalendarEventType, number> = {
  // Same as a personal practice: it is the same session.
  practice: 4,
  // Same as a personal game.
  match: 5,
  // Usually two to four matches in one day: well above a single match, but
  // not a straight multiple because rotations and sets get shorter.
  tournament: 8,
  // A match with more at stake: more intensity, less rotation.
  playoffs: 6,
  // No training, but long sitting, disrupted sleep and early starts still
  // add fatigue. About the same as an active-recovery day.
  travel: 1,
  // Max-effort jumps, sprints and lifts: low volume, high intensity, about
  // one workout.
  testing: 3
};

export function teamEventLoad(type: TeamCalendarEventType): number {
  return TEAM_EVENT_LOAD[type] ?? 0;
}

// Team event types that are the same session as a personal entry of a given
// type. If an athlete also logs it on their own calendar, count it once.
const SAME_SESSION: Partial<Record<CalendarEvent["type"], TeamCalendarEventType[]>> = {
  practice: ["practice"],
  game: ["match", "tournament", "playoffs"]
};

function shiftISO(iso: string, days: number): string {
  const date = new Date(`${iso}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function computeTrainingLoad({
  personal,
  team,
  today,
  windowDays = TRAINING_LOAD_WINDOW_DAYS
}: {
  personal: Pick<CalendarEvent, "date" | "type">[];
  team: { date: string; type: TeamCalendarEventType }[];
  /** Local date, YYYY-MM-DD. */
  today: string;
  windowDays?: number;
}): number {
  const start = shiftISO(today, -windowDays);
  const inWindow = (date: string) => date >= start && date <= today;

  const teamInWindow = team.filter((event) => inWindow(event.date));
  const teamTypesByDate = new Map<string, Set<TeamCalendarEventType>>();
  teamInWindow.forEach((event) => {
    const types = teamTypesByDate.get(event.date) ?? new Set<TeamCalendarEventType>();
    types.add(event.type);
    teamTypesByDate.set(event.date, types);
  });

  const teamLoad = teamInWindow.reduce((sum, event) => sum + teamEventLoad(event.type), 0);

  const personalLoad = personal.reduce((sum, event) => {
    if (!inWindow(event.date)) return sum;
    const duplicates = SAME_SESSION[event.type] ?? [];
    const teamTypes = teamTypesByDate.get(event.date);
    if (teamTypes && duplicates.some((type) => teamTypes.has(type))) return sum;
    return sum + (PERSONAL_EVENT_LOAD[event.type] ?? 0);
  }, 0);

  return teamLoad + personalLoad;
}
