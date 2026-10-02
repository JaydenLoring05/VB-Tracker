import type { StatEntry } from "@/types";

// The 30-second daily check-in. It fills the same StatEntry the old 13-field
// form did, so storage and the readiness score are unchanged; it only
// changes how the athlete enters the daily fields.

export type CheckInKey =
  | "sleep"
  | "energy"
  | "stress"
  | "motivation"
  | "soreness"
  | "kneePain"
  | "shoulderPain"
  | "lowerBackPain"
  | "anklePain";

export type CheckInAnswers = Record<CheckInKey, number>;

export type SliderField = {
  key: Exclude<CheckInKey, "sleep">;
  label: string;
  /** What 0 and 10 mean, shown under the slider. */
  low: string;
  high: string;
  min: 0;
  max: 10;
};

const slider = (key: SliderField["key"], label: string, low: string, high: string): SliderField => ({
  key,
  label,
  low,
  high,
  min: 0,
  max: 10
});

export const DAILY_SLIDERS: SliderField[] = [
  slider("energy", "Energy", "Drained", "Fully charged"),
  slider("stress", "Stress", "Calm", "Very stressed"),
  slider("motivation", "Motivation", "None", "Can't wait"),
  slider("soreness", "General soreness", "None", "Very sore")
];

export const PAIN_SLIDERS: SliderField[] = [
  slider("kneePain", "Knee", "No pain", "Worst pain"),
  slider("shoulderPain", "Shoulder", "No pain", "Worst pain"),
  slider("lowerBackPain", "Lower back", "No pain", "Worst pain"),
  slider("anklePain", "Ankle", "No pain", "Worst pain")
];

const PAIN_KEYS = PAIN_SLIDERS.map((field) => field.key);

export const SLEEP_MIN = 0;
export const SLEEP_MAX = 14;
export const SLEEP_STEP = 0.5;

// Middle-of-the-road starting points for an athlete's first check-in.
const FIRST_TIME: CheckInAnswers = {
  sleep: 8,
  energy: 7,
  stress: 3,
  motivation: 7,
  soreness: 3,
  kneePain: 0,
  shoulderPain: 0,
  lowerBackPain: 0,
  anklePain: 0
};

function numberOr(value: number | "", fallback: number): number {
  return value === "" || Number.isNaN(Number(value)) ? fallback : Number(value);
}

/**
 * Where the sliders start: the athlete's last everyday answers (most days are
 * like yesterday, so they only move what changed), but pain always starts at
 * 0 so yesterday's pain is never re-reported by accident.
 */
export function initialCheckIn(previous: StatEntry): CheckInAnswers {
  return {
    sleep: numberOr(previous.sleep, FIRST_TIME.sleep),
    energy: numberOr(previous.energy, FIRST_TIME.energy),
    stress: numberOr(previous.stress, FIRST_TIME.stress),
    motivation: numberOr(previous.motivation, FIRST_TIME.motivation),
    soreness: numberOr(previous.soreness, FIRST_TIME.soreness),
    kneePain: 0,
    shoulderPain: 0,
    lowerBackPain: 0,
    anklePain: 0
  };
}

/** The entry to save: today's answers on top of the current stats (test-day numbers untouched). */
export function applyCheckIn(
  current: StatEntry,
  answers: CheckInAnswers,
  { painOpen }: { painOpen: boolean }
): StatEntry {
  const entry: StatEntry = { ...current, ...answers };
  if (!painOpen) PAIN_KEYS.forEach((key) => (entry[key] = 0));
  return entry;
}

/** One half-hour step up or down, snapped to the half hour and kept in range. */
export function stepSleep(hours: number, direction: 1 | -1): number {
  const snapped = direction > 0 ? Math.floor(hours / SLEEP_STEP) * SLEEP_STEP : Math.ceil(hours / SLEEP_STEP) * SLEEP_STEP;
  return Math.min(SLEEP_MAX, Math.max(SLEEP_MIN, snapped + direction * SLEEP_STEP));
}

/** Whether the athlete's latest history entry is from today (in either stored date format). */
export function checkedInToday(history: { date: string }[], now: Date = new Date()): boolean {
  const last = history[history.length - 1]?.date;
  if (!last) return false;
  const local = new Date(now);
  local.setMinutes(local.getMinutes() - local.getTimezoneOffset());
  const iso = local.toISOString().slice(0, 10);
  return last === iso || last === now.toLocaleDateString("en-US");
}
