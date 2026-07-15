"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

import { createClient } from "@/lib/supabase/client";
import { todayISO } from "@/lib/storage";
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

type StatsRow = {
  date: string | null;
  vertical: number | null;
  approach: number | null;
  weight: number | null;
  pullups: number | null;
  sleep: number | null;
  knee_pain: number | null;
  shoulder_pain: number | null;
  soreness: number | null;
  energy: number | null;
};

function numOrNull(value: number | "") {
  return value === "" ? null : value;
}

function toStatsRow(entry: StatEntry): StatsRow {
  return {
    date: entry.date || null,
    vertical: numOrNull(entry.vertical),
    approach: numOrNull(entry.approach),
    weight: numOrNull(entry.weight),
    pullups: numOrNull(entry.pullups),
    sleep: numOrNull(entry.sleep),
    knee_pain: numOrNull(entry.kneePain),
    shoulder_pain: numOrNull(entry.shoulderPain),
    soreness: numOrNull(entry.soreness),
    energy: numOrNull(entry.energy)
  };
}

function fromStatsRow(row: StatsRow): StatEntry {
  return {
    date: row.date ?? "",
    vertical: row.vertical ?? "",
    approach: row.approach ?? "",
    weight: row.weight ?? "",
    pullups: row.pullups ?? "",
    sleep: row.sleep ?? "",
    kneePain: row.knee_pain ?? "",
    shoulderPain: row.shoulder_pain ?? "",
    soreness: row.soreness ?? "",
    energy: row.energy ?? ""
  };
}

function makeDefaultEvents(): Omit<CalendarEvent, "id">[] {
  const start = new Date();
  const events: Omit<CalendarEvent, "id">[] = [];

  for (let i = 0; i < 28; i++) {
    const date = new Date(start);
    date.setDate(start.getDate() + i);
    const iso = date.toISOString().slice(0, 10);
    const day = date.getDay();

    if ([1, 3, 5, 6].includes(day)) {
      events.push({ date: iso, type: "workout", title: "Workout" });
    }

    if ([2, 4].includes(day)) {
      events.push({ date: iso, type: "practice", title: "Volleyball Practice" });
    }

    if (day === 0) {
      events.push({ date: iso, type: "recovery", title: "Recovery" });
    }
  }

  return events;
}

type TrackerContextValue = {
  userId: string;

  week: number;
  setWeek: (week: number) => void;

  checked: Record<string, boolean>;
  toggleExercise: (day: string, exercise: string) => void;
  setExerciseChecked: (week: number, day: string, exercise: string, checked: boolean) => void;

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
  updateWorkoutLog: (day: string, exercise: string, value: string) => void;
  workoutNotes: WorkoutNotes;
  updateWorkoutNote: (day: string, note: string) => void;

  prs: PRRecord[];
  addPR: (pr: Omit<PRRecord, "id" | "date">) => void;
  deletePR: (id: string) => void;
};

const TrackerContext = createContext<TrackerContextValue | null>(null);

export function TrackerProvider({
  userId,
  children
}: {
  userId: string;
  children: React.ReactNode;
}) {
  const supabase = useMemo(() => createClient(), []);

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
    let cancelled = false;

    async function load() {
      const [checksRes, logsRes, notesRes, latestRes, historyRes, calendarRes, prsRes] =
        await Promise.all([
          supabase.from("exercise_checks").select("week, day, exercise, checked").eq("user_id", userId),
          supabase.from("workout_logs").select("week, day, exercise, value").eq("user_id", userId),
          supabase.from("workout_notes").select("week, day, note").eq("user_id", userId),
          supabase.from("latest_stats").select("*").eq("user_id", userId).maybeSingle(),
          supabase
            .from("stats_history")
            .select("*")
            .eq("user_id", userId)
            .order("created_at", { ascending: true }),
          supabase
            .from("calendar_events")
            .select("id, date, type, title, notes")
            .eq("user_id", userId),
          supabase
            .from("prs")
            .select("id, date, exercise, value, unit, note")
            .eq("user_id", userId)
            .order("created_at", { ascending: false })
        ]);

      if (cancelled) return;

      const checksMap: Record<string, boolean> = {};
      (checksRes.data ?? []).forEach((row) => {
        checksMap[`${row.week}-${row.day}-${row.exercise}`] = row.checked;
      });
      setChecked(checksMap);

      const logsMap: WorkoutLogs = {};
      (logsRes.data ?? []).forEach((row) => {
        logsMap[`${row.week}-${row.day}-${row.exercise}-log`] = row.value;
      });
      setWorkoutLogs(logsMap);

      const notesMap: WorkoutNotes = {};
      (notesRes.data ?? []).forEach((row) => {
        notesMap[`${row.week}-${row.day}-notes`] = row.note;
      });
      setWorkoutNotes(notesMap);

      setStats(latestRes.data ? fromStatsRow(latestRes.data) : emptyStats);
      setHistory((historyRes.data ?? []).map(fromStatsRow));

      if ((calendarRes.data ?? []).length > 0) {
        setCalendarEvents(calendarRes.data as CalendarEvent[]);
      } else {
        const defaults = makeDefaultEvents().map((event) => ({ ...event, user_id: userId }));
        const inserted = await supabase.from("calendar_events").insert(defaults).select();
        if (!cancelled && inserted.data) {
          setCalendarEvents(inserted.data as CalendarEvent[]);
        }
      }

      setPrs((prsRes.data ?? []) as PRRecord[]);
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [supabase, userId]);

  function toggleExercise(day: string, exercise: string) {
    const key = `${week}-${day}-${exercise}`;
    setExerciseChecked(week, day, exercise, !checked[key]);
  }

  function setExerciseChecked(
    checkedWeek: number,
    day: string,
    exercise: string,
    isChecked: boolean
  ) {
    const key = `${checkedWeek}-${day}-${exercise}`;

    setChecked((current) => ({ ...current, [key]: isChecked }));

    supabase
      .from("exercise_checks")
      .upsert(
        { user_id: userId, week: checkedWeek, day, exercise, checked: isChecked },
        { onConflict: "user_id,week,day,exercise" }
      )
      .then(({ error }) => {
        if (error) console.error("Failed to save exercise check", error);
      });
  }

  function updateWorkoutLog(day: string, exercise: string, value: string) {
    const key = `${week}-${day}-${exercise}-log`;
    setWorkoutLogs((current) => ({ ...current, [key]: value }));

    supabase
      .from("workout_logs")
      .upsert(
        { user_id: userId, week, day, exercise, value },
        { onConflict: "user_id,week,day,exercise" }
      )
      .then(({ error }) => {
        if (error) console.error("Failed to save workout log", error);
      });
  }

  function updateWorkoutNote(day: string, note: string) {
    const key = `${week}-${day}-notes`;
    setWorkoutNotes((current) => ({ ...current, [key]: note }));

    supabase
      .from("workout_notes")
      .upsert(
        { user_id: userId, week, day, note },
        { onConflict: "user_id,week,day" }
      )
      .then(({ error }) => {
        if (error) console.error("Failed to save workout note", error);
      });
  }

  function saveStats() {
    const entry = { ...stats, date: new Date().toLocaleDateString("en-US") };

    setStats(entry);
    setHistory((current) => [...current, entry]);

    const row = toStatsRow(entry);

    supabase
      .from("latest_stats")
      .upsert({ user_id: userId, ...row }, { onConflict: "user_id" })
      .then(({ error }) => {
        if (error) console.error("Failed to save latest stats", error);
      });

    supabase
      .from("stats_history")
      .insert({ user_id: userId, ...row })
      .then(({ error }) => {
        if (error) console.error("Failed to save stats history", error);
      });
  }

  function clearStats() {
    setHistory([]);

    supabase
      .from("stats_history")
      .delete()
      .eq("user_id", userId)
      .then(({ error }) => {
        if (error) console.error("Failed to clear stats history", error);
      });
  }

  function addGame(title: string) {
    const date = todayISO();

    supabase
      .from("calendar_events")
      .insert({ user_id: userId, date, type: "game", title })
      .select()
      .single()
      .then(({ data, error }) => {
        if (error) {
          console.error("Failed to add game", error);
          return;
        }
        setCalendarEvents((events) => [...events, data as CalendarEvent]);
      });
  }

  function toggleExerciseCard(exerciseName: string) {
    setExpandedExercises((current) => ({
      ...current,
      [exerciseName]: !current[exerciseName]
    }));
  }

  function addPR(pr: Omit<PRRecord, "id" | "date">) {
    const date = new Date().toLocaleDateString("en-US");

    supabase
      .from("prs")
      .insert({ user_id: userId, date, ...pr })
      .select()
      .single()
      .then(({ data, error }) => {
        if (error) {
          console.error("Failed to add PR", error);
          return;
        }
        setPrs((current) => [data as PRRecord, ...current]);
      });
  }

  function deletePR(id: string) {
    setPrs((current) => current.filter((pr) => pr.id !== id));

    supabase
      .from("prs")
      .delete()
      .eq("id", id)
      .eq("user_id", userId)
      .then(({ error }) => {
        if (error) console.error("Failed to delete PR", error);
      });
  }

  const value: TrackerContextValue = {
    userId,
    week,
    setWeek,
    checked,
    toggleExercise,
    setExerciseChecked,
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
