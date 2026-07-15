"use client";

import { createContext, useContext, useEffect, useState } from "react";

import { getStored, setStored, todayISO } from "@/lib/storage";
import { CalendarEvent, StatEntry } from "@/types";

export const emptyStats: StatEntry = {
  date: "",
  vertical: "",
  approach: "",
  weight: "",
  pullups: "",
  sleep: "",
  kneePain: "",
  shoulderPain: "",
  soreness: "",
  energy: ""
};

export type PRRecord = {
  id: string;
  date: string;
  exercise: string;
  value: string;
  unit: string;
  note: string;
};

export type WorkoutLogs = Record<string, string>;
export type WorkoutNotes = Record<string, string>;

function makeDefaultEvents(): CalendarEvent[] {
  const start = new Date();
  const events: CalendarEvent[] = [];

  for (let i = 0; i < 28; i++) {
    const date = new Date(start);
    date.setDate(start.getDate() + i);
    const iso = date.toISOString().slice(0, 10);
    const day = date.getDay();

    if ([1, 3, 5, 6].includes(day)) {
      events.push({
        id: crypto.randomUUID(),
        date: iso,
        type: "workout",
        title: "Workout"
      });
    }

    if ([2, 4].includes(day)) {
      events.push({
        id: crypto.randomUUID(),
        date: iso,
        type: "practice",
        title: "Volleyball Practice"
      });
    }

    if (day === 0) {
      events.push({
        id: crypto.randomUUID(),
        date: iso,
        type: "recovery",
        title: "Recovery"
      });
    }
  }

  return events;
}

type TrackerContextValue = {
  week: number;
  setWeek: (week: number) => void;

  checked: Record<string, boolean>;
  toggleExercise: (day: string, exercise: string) => void;

  stats: StatEntry;
  setStats: React.Dispatch<React.SetStateAction<StatEntry>>;
  history: StatEntry[];
  saveStats: () => void;
  clearStats: () => void;

  calendarEvents: CalendarEvent[];
  addGame: (title: string) => void;

  selectedFilter: string;
  setSelectedFilter: (filter: string) => void;
  exerciseSearch: string;
  setExerciseSearch: (search: string) => void;
  expandedExercises: Record<string, boolean>;
  toggleExerciseCard: (exerciseName: string) => void;
  setExpandedExercises: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;

  workoutLogs: WorkoutLogs;
  updateWorkoutLog: (key: string, value: string) => void;
  workoutNotes: WorkoutNotes;
  updateWorkoutNote: (key: string, value: string) => void;

  prs: PRRecord[];
  addPR: (pr: Omit<PRRecord, "id" | "date">) => void;
  deletePR: (id: string) => void;
};

const TrackerContext = createContext<TrackerContextValue | null>(null);

export function TrackerProvider({ children }: { children: React.ReactNode }) {
  const [week, setWeek] = useState(1);
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [stats, setStats] = useState<StatEntry>(emptyStats);
  const [history, setHistory] = useState<StatEntry[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [selectedFilter, setSelectedFilter] = useState("All");
  const [exerciseSearch, setExerciseSearch] = useState("");
  const [expandedExercises, setExpandedExercises] = useState<Record<string, boolean>>({});

  const [workoutLogs, setWorkoutLogs] = useState<WorkoutLogs>({});
  const [workoutNotes, setWorkoutNotes] = useState<WorkoutNotes>({});
  const [prs, setPrs] = useState<PRRecord[]>([]);

  useEffect(() => {
    setChecked(getStored("v15-checked", {}));
    setStats(getStored("v15-latest-stats", emptyStats));
    setHistory(getStored("v15-stats-history", []));

    const savedEvents = getStored<CalendarEvent[]>("v15-calendar", []);
    setCalendarEvents(savedEvents.length ? savedEvents : makeDefaultEvents());

    setWorkoutLogs(getStored("v166-workout-logs", {}));
    setWorkoutNotes(getStored("v166-workout-notes", {}));
    setPrs(getStored("v166-prs", []));
  }, []);

  useEffect(() => {
    setStored("v15-checked", checked);
  }, [checked]);

  useEffect(() => {
    setStored("v15-calendar", calendarEvents);
  }, [calendarEvents]);

  useEffect(() => {
    setStored("v166-workout-logs", workoutLogs);
  }, [workoutLogs]);

  useEffect(() => {
    setStored("v166-workout-notes", workoutNotes);
  }, [workoutNotes]);

  useEffect(() => {
    setStored("v166-prs", prs);
  }, [prs]);

  function toggleExercise(day: string, exercise: string) {
    const key = `${week}-${day}-${exercise}`;
    setChecked((current) => ({ ...current, [key]: !current[key] }));
  }

  function saveStats() {
    const entry = { ...stats, date: new Date().toLocaleDateString("en-US") };
    const newHistory = [...history, entry];

    setStats(entry);
    setHistory(newHistory);
    setStored("v15-latest-stats", entry);
    setStored("v15-stats-history", newHistory);
  }

  function clearStats() {
    setHistory([]);
    setStored("v15-stats-history", []);
  }

  function addGame(title: string) {
    setCalendarEvents((events) => [
      ...events,
      {
        id: crypto.randomUUID(),
        date: todayISO(),
        type: "game",
        title
      }
    ]);
  }

  function toggleExerciseCard(exerciseName: string) {
    setExpandedExercises((current) => ({
      ...current,
      [exerciseName]: !current[exerciseName]
    }));
  }

  function updateWorkoutLog(key: string, value: string) {
    setWorkoutLogs((current) => ({
      ...current,
      [key]: value
    }));
  }

  function updateWorkoutNote(key: string, value: string) {
    setWorkoutNotes((current) => ({
      ...current,
      [key]: value
    }));
  }

  function addPR(pr: Omit<PRRecord, "id" | "date">) {
    const newPR: PRRecord = {
      id: crypto.randomUUID(),
      date: new Date().toLocaleDateString("en-US"),
      ...pr
    };

    setPrs((current) => [newPR, ...current]);
  }

  function deletePR(id: string) {
    setPrs((current) => current.filter((pr) => pr.id !== id));
  }

  const value: TrackerContextValue = {
    week,
    setWeek,
    checked,
    toggleExercise,
    stats,
    setStats,
    history,
    saveStats,
    clearStats,
    calendarEvents,
    addGame,
    selectedFilter,
    setSelectedFilter,
    exerciseSearch,
    setExerciseSearch,
    expandedExercises,
    toggleExerciseCard,
    setExpandedExercises,
    workoutLogs,
    updateWorkoutLog,
    workoutNotes,
    updateWorkoutNote,
    prs,
    addPR,
    deletePR
  };

  return <TrackerContext.Provider value={value}>{children}</TrackerContext.Provider>;
}

export function useTrackerContext() {
  const context = useContext(TrackerContext);

  if (!context) {
    throw new Error("useTrackerContext must be used within a TrackerProvider");
  }

  return context;
}
