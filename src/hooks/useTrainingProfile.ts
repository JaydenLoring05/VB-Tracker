"use client";

import { useCallback, useSyncExternalStore } from "react";

import {
  DEFAULT_TRAINING_PROFILE,
  parseTrainingProfile,
  TrainingProfile
} from "@/lib/trainingProfile";

// Kept on this device for the first version (F-31). A later row can move it
// to the athlete's profile in Supabase so coaches can see it.
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

export function useTrainingProfile() {
  const profile = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const setProfile = useCallback((next: TrainingProfile) => {
    const raw = JSON.stringify(parseTrainingProfile(next));
    try {
      window.localStorage.setItem(STORAGE_KEY, raw);
    } catch {
      memoryRaw = raw;
    }
    listeners.forEach((listener) => listener());
  }, []);

  return { profile, setProfile };
}
