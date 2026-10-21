"use client";

import { useCallback, useEffect, useMemo, useSyncExternalStore } from "react";

import { useTrackerContext } from "@/context/TrackerContext";
import { getWorkoutDays } from "@/data/workoutPlan";
import { createClient } from "@/lib/supabase/client";
import { todayISO } from "@/lib/storage";
import {
  checkInSoreAreas,
  DEFAULT_TRAINING_PROFILE,
  isDefaultProfile,
  parseTrainingProfile,
  profileFromRow,
  profileToRow,
  TrainingProfile,
  TrainingProfileRow,
  withCheckInAreas
} from "@/lib/trainingProfile";
import { buildWeekAdjust, weekCompletion } from "@/lib/weeklyAdjust";

// The account (profiles, schema_v56) is the source of truth (F-34). This
// browser keeps a copy so the plan shows instantly and still works before
// the SQL is run or when offline.
const STORAGE_KEY = "nextrep.trainingProfile";

const listeners = new Set<() => void>();
let cachedRaw: string | null | undefined;
let cachedProfile: TrainingProfile = DEFAULT_TRAINING_PROFILE;
// Used when localStorage is blocked (private mode): lasts until the page reloads.
let memoryRaw: string | null = null;

function readRaw(): string | null {
  try {
    return window.localStorage.getItem(STORAGE_KEY) ?? memoryRaw;
  } catch {
    return memoryRaw;
  }
}

function getSnapshot(): TrainingProfile {
  const raw = readRaw();
  if (raw === cachedRaw) return cachedProfile;
  cachedRaw = raw;
  try {
    cachedProfile = raw ? parseTrainingProfile(JSON.parse(raw)) : DEFAULT_TRAINING_PROFILE;
  } catch {
    cachedProfile = DEFAULT_TRAINING_PROFILE;
  }
  return cachedProfile;
}

function getServerSnapshot(): TrainingProfile {
  return DEFAULT_TRAINING_PROFILE;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

function writeLocal(profile: TrainingProfile) {
  const raw = JSON.stringify(parseTrainingProfile(profile));
  try {
    window.localStorage.setItem(STORAGE_KEY, raw);
  } catch {
    memoryRaw = raw;
  }
  listeners.forEach((listener) => listener());
}

async function saveToAccount(userId: string, profile: TrainingProfile) {
  const { error } = await createClient()
    .from("profiles")
    .upsert({ user_id: userId, ...profileToRow(profile) }, { onConflict: "user_id" });
  // Before schema_v56 the columns don't exist; this browser's copy still works.
  if (error) console.warn("Training profile not saved to the account yet", error.message);
}

// One account read per signed-in user, however many components use the hook.
let syncedFor: string | null = null;

async function syncFromAccount(userId: string) {
  const { data, error } = await createClient()
    .from("profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) return; // columns missing (SQL not run yet) or offline
  const fromAccount = profileFromRow(data as TrainingProfileRow | null);
  if (fromAccount) {
    writeLocal(fromAccount);
    return;
  }
  // Nothing on the account yet: carry over what this browser already has.
  const local = getSnapshot();
  if (!isDefaultProfile(local)) await saveToAccount(userId, local);
}

export function useTrainingProfile() {
  const profile = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const { stats, userId, history, calendarEvents, checked, week } = useTrackerContext();

  useEffect(() => {
    if (!userId || syncedFor === userId) return;
    syncedFor = userId;
    syncFromAccount(userId).catch(() => {
      syncedFor = null;
    });
  }, [userId]);

  const setProfile = useCallback(
    (next: TrainingProfile) => {
      writeLocal(next);
      if (userId) saveToAccount(userId, next);
    },
    [userId]
  );

  // Today's check-in can turn on an area for the day (F-33) without changing
  // what the athlete saved.
  const today = todayISO();
  const checkInAreas = useMemo(() => checkInSoreAreas(stats, today), [stats, today]);

  // This week's adjustments (F-38): recovery, repeated pain, last week's
  // completion, the athlete's own week and games.
  const weekAdjust = useMemo(() => {
    const lastWeek = week - 1;
    const planned = lastWeek >= 1 ? getWorkoutDays(lastWeek).reduce((sum, day) => sum + day.exercises.length, 0) : 0;
    return buildWeekAdjust({
      history: history ?? [],
      today,
      schedule: profile.weekly ?? {},
      gameDates: (calendarEvents ?? []).filter((event) => event.type === "game").map((event) => event.date),
      completionLastWeek: lastWeek >= 1 ? weekCompletion(checked ?? {}, lastWeek, planned) : null
    });
  }, [history, today, profile.weekly, calendarEvents, checked, week]);

  const effectiveProfile = useMemo(() => {
    const withWeek = withCheckInAreas(profile, weekAdjust.extraAreas);
    const withToday = withCheckInAreas(withWeek, checkInAreas);
    return { ...withToday, adjust: { deload: weekAdjust.deload, days: weekAdjust.days } };
  }, [profile, weekAdjust, checkInAreas]);

  return { profile, effectiveProfile, checkInAreas, weekAdjust, setProfile };
}
