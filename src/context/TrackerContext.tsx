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
export type ExerciseSubstitutions = Record<string, string>;

export type StatsRow = {
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

export function fromStatsRow(row: StatsRow): StatEntry {
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

function computeStreak(workoutDates: Set<string>): number {
  const cursor = new Date();
  let streak = 0;

  if (!workoutDates.has(todayISO(cursor))) {
    cursor.setDate(cursor.getDate() - 1);
  }

  while (workoutDates.has(todayISO(cursor))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

function makeDefaultEvents(): Omit<CalendarEvent, "id">[] {
  const start = new Date();
  const events: Omit<CalendarEvent, "id">[] = [];

  for (let i = 0; i < 28; i++) {
    const date = new Date(start);
    date.setDate(start.getDate() + i);
    const iso = todayISO(date);
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
  selectedLevel: string;
  setSelectedLevel: (level: string) => void;
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

  substitutions: ExerciseSubstitutions;
  setSubstitution: (originalExercise: string, chosenExercise: string) => void;
  clearSubstitution: (originalExercise: string) => void;

  workoutStreak: number;

  syncError: string | null;
  reportSyncError: (message: string) => void;
  clearSyncError: () => void;
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
  const [selectedLevel, setSelectedLevel] = useState("All");
  const [exerciseSearch, setExerciseSearch] = useState("");
  const [expandedExercises, setExpandedExercises] = useState<Record<string, boolean>>({});

  const [workoutLogs, setWorkoutLogs] = useState<WorkoutLogs>({});
  const [workoutNotes, setWorkoutNotes] = useState<WorkoutNotes>({});
  const [prs, setPrs] = useState<PRRecord[]>([]);
  const [substitutions, setSubstitutions] = useState<ExerciseSubstitutions>({});
  const [workoutStreak, setWorkoutStreak] = useState(0);
  const [syncError, setSyncError] = useState<string | null>(null);

  function reportSyncError(message: string) {
    setSyncError(message);
  }

  function clearSyncError() {
    setSyncError(null);
  }

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const [
        checksRes,
        logsRes,
        notesRes,
        latestRes,
        historyRes,
        calendarRes,
        prsRes,
        sessionsRes,
        substitutionsRes
      ] = await Promise.all([
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
          .order("created_at", { ascending: false }),
        supabase
          .from("workout_sessions")
          .select("ended_at")
          .eq("user_id", userId)
          .not("ended_at", "is", null)
          .order("ended_at", { ascending: false })
          .limit(60),
        supabase
          .from("exercise_substitutions")
          .select("original_exercise, chosen_exercise")
          .eq("user_id", userId)
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
        const inserted = await supabase
          .from("calendar_events")
          .upsert(defaults, { onConflict: "user_id,date,type,title", ignoreDuplicates: true })
          .select();
        if (cancelled) return;
        if (inserted.error) {
          reportSyncError("Couldn't set up your training calendar. Pull to refresh to try again.");
        } else if (inserted.data) {
          setCalendarEvents(inserted.data as CalendarEvent[]);
        }
      }

      setPrs((prsRes.data ?? []) as PRRecord[]);

      const substitutionsMap: ExerciseSubstitutions = {};
      (substitutionsRes.data ?? []).forEach((row) => {
        substitutionsMap[row.original_exercise] = row.chosen_exercise;
      });
      setSubstitutions(substitutionsMap);

      const workoutDates = new Set(
        (sessionsRes.data ?? [])
          .filter((row): row is { ended_at: string } => row.ended_at != null)
          .map((row) => todayISO(new Date(row.ended_at)))
      );
      setWorkoutStreak(computeStreak(workoutDates));
    }

    load();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    const previous = checked[key];

    setChecked((current) => ({ ...current, [key]: isChecked }));

    supabase
      .from("exercise_checks")
      .upsert(
        { user_id: userId, week: checkedWeek, day, exercise, checked: isChecked },
        { onConflict: "user_id,week,day,exercise" }
      )
      .then(({ error }) => {
        if (error) {
          console.error("Failed to save exercise check", error);
          setChecked((current) => ({ ...current, [key]: previous }));
          reportSyncError("Couldn't save that checkmark. Check your connection and try again.");
        }
      });
  }

  function updateWorkoutLog(day: string, exercise: string, value: string) {
    const key = `${week}-${day}-${exercise}-log`;
    const previous = workoutLogs[key];

    setWorkoutLogs((current) => ({ ...current, [key]: value }));

    supabase
      .from("workout_logs")
      .upsert(
        { user_id: userId, week, day, exercise, value },
        { onConflict: "user_id,week,day,exercise" }
      )
      .then(({ error }) => {
        if (error) {
          console.error("Failed to save workout log", error);
          setWorkoutLogs((current) => ({ ...current, [key]: previous }));
          reportSyncError("Couldn't save that entry. Check your connection and try again.");
        }
      });
  }

  function updateWorkoutNote(day: string, note: string) {
    const key = `${week}-${day}-notes`;
    const previous = workoutNotes[key];

    setWorkoutNotes((current) => ({ ...current, [key]: note }));

    supabase
      .from("workout_notes")
      .upsert(
        { user_id: userId, week, day, note },
        { onConflict: "user_id,week,day" }
      )
      .then(({ error }) => {
        if (error) {
          console.error("Failed to save workout note", error);
          setWorkoutNotes((current) => ({ ...current, [key]: previous }));
          reportSyncError("Couldn't save that note. Check your connection and try again.");
        }
      });
  }

  function saveStats() {
    const previousStats = stats;
    const previousHistory = history;
    const entry = { ...stats, date: new Date().toLocaleDateString("en-US") };

    setStats(entry);
    setHistory((current) => [...current, entry]);

    const row = toStatsRow(entry);
    let failed = false;

    function rollbackOnce(message: string) {
      if (failed) return;
      failed = true;
      setStats(previousStats);
      setHistory(previousHistory);
      reportSyncError(message);
    }

    supabase
      .from("latest_stats")
      .upsert({ user_id: userId, ...row }, { onConflict: "user_id" })
      .then(({ error }) => {
        if (error) {
          console.error("Failed to save latest stats", error);
          rollbackOnce("Couldn't save your stats. Check your connection and try again.");
        }
      });

    supabase
      .from("stats_history")
      .insert({ user_id: userId, ...row })
      .then(({ error }) => {
        if (error) {
          console.error("Failed to save stats history", error);
          rollbackOnce("Couldn't save your stats. Check your connection and try again.");
        }
      });
  }

  function clearStats() {
    const previousHistory = history;
    setHistory([]);

    supabase
      .from("stats_history")
      .delete()
      .eq("user_id", userId)
      .then(({ error }) => {
        if (error) {
          console.error("Failed to clear stats history", error);
          setHistory(previousHistory);
          reportSyncError("Couldn't clear your stats history. Try again.");
        }
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
          reportSyncError("Couldn't add that game to your calendar. Try again.");
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
          reportSyncError("Couldn't save that PR. Try again.");
          return;
        }
        setPrs((current) => [data as PRRecord, ...current]);
      });
  }

  function setSubstitution(originalExercise: string, chosenExercise: string) {
    const previous = substitutions[originalExercise];

    setSubstitutions((current) => ({ ...current, [originalExercise]: chosenExercise }));

    supabase
      .from("exercise_substitutions")
      .upsert(
        { user_id: userId, original_exercise: originalExercise, chosen_exercise: chosenExercise },
        { onConflict: "user_id,original_exercise" }
      )
      .then(({ error }) => {
        if (error) {
          console.error("Failed to save exercise substitution", error);
          setSubstitutions((current) => {
            const next = { ...current };
            if (previous === undefined) {
              delete next[originalExercise];
            } else {
              next[originalExercise] = previous;
            }
            return next;
          });
          reportSyncError("Couldn't save that swap. Check your connection and try again.");
        }
      });
  }

  function clearSubstitution(originalExercise: string) {
    const previous = substitutions[originalExercise];
    if (previous === undefined) return;

    setSubstitutions((current) => {
      const next = { ...current };
      delete next[originalExercise];
      return next;
    });

    supabase
      .from("exercise_substitutions")
      .delete()
      .eq("user_id", userId)
      .eq("original_exercise", originalExercise)
      .then(({ error }) => {
        if (error) {
          console.error("Failed to clear exercise substitution", error);
          setSubstitutions((current) => ({ ...current, [originalExercise]: previous }));
          reportSyncError("Couldn't reset that exercise. Try again.");
        }
      });
  }

  function deletePR(id: string) {
    const previous = prs;
    setPrs((current) => current.filter((pr) => pr.id !== id));

    supabase
      .from("prs")
      .delete()
      .eq("id", id)
      .eq("user_id", userId)
      .then(({ error }) => {
        if (error) {
          console.error("Failed to delete PR", error);
          setPrs(previous);
          reportSyncError("Couldn't delete that PR. Try again.");
        }
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
    selectedLevel,
    setSelectedLevel,
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
    deletePR,
    substitutions,
    setSubstitution,
    clearSubstitution,
    workoutStreak,
    syncError,
    reportSyncError,
    clearSyncError
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
