/**
 * Whether an exercise is logged in reps or in seconds. Holds, planks,
 * stretches and other duration work are "time"; everything else is "reps".
 */
export type ExerciseMeasure = "reps" | "time";

// Library exercises that are done for time.
const TIMED_EXERCISES = new Set([
  "Planks",
  "Side Planks",
  "Hollow Hold",
  "L-Sit Practice",
  "Handstand Practice",
  "Deep Squat Holds",
  "Spanish Squat",
  "Couch Stretch",
  "Light Stretching",
  "Full-Body Mobility Flow",
  "Foam Roll",
  "Walk 20-30 minutes",
  "Easy Bike",
  "Farmer Carries",
  "Jump Rope"
]);

// Fallback for names that aren't in the library (coach-written exercises).
const TIMED_PATTERNS = [
  /plank/i,
  /\bholds?\b/i,
  /stretch/i,
  /mobility flow/i,
  /foam roll/i,
  /^walk\b/i,
  /\bbike\b/i,
  /wall sit/i,
  /l-sit/i,
  /isometric/i,
  /\bdead hang\b/i,
  /carr(y|ies)\b/i,
  /jump rope/i
];

export function getExerciseMeasure(name: string): ExerciseMeasure {
  if (TIMED_EXERCISES.has(name)) return "time";
  return TIMED_PATTERNS.some((pattern) => pattern.test(name)) ? "time" : "reps";
}

/**
 * Seconds to start the hold timer from, read from a prescription like
 * "3x30-45 sec" (45) or "10-20 min" (600). Uses the top of a seconds range
 * and the bottom of a minutes range so the timer is never longer than the
 * plan asks for. Returns null when the prescription has no time in it.
 */
export function parseTargetSeconds(prescription: string): number | null {
  const sec = prescription.match(/(\d+)(?:\s*-\s*(\d+))?\s*(?:sec|s)\b/i);
  if (sec) return Number(sec[2] ?? sec[1]);

  const min = prescription.match(/(\d+)(?:\s*-\s*(\d+))?\s*min/i);
  if (min) return Number(min[1]) * 60;

  return null;
}

export function formatSeconds(totalSeconds: number): string {
  const seconds = Math.max(0, Math.round(totalSeconds));
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return rest === 0 ? `${minutes} min` : `${minutes}:${rest.toString().padStart(2, "0")}`;
}

type LoggedValue = { weight: number | null; reps: number | null; seconds?: number | null };

const finite = (value: number | null | undefined): value is number =>
  typeof value === "number" && Number.isFinite(value);

/** "135 x 8", "8 reps", "45s", "25 x 45s" (weighted hold), or "-". */
export function formatSetValue({ weight, reps, seconds }: LoggedValue): string {
  if (finite(seconds)) return finite(weight) ? `${weight} x ${formatSeconds(seconds)}` : formatSeconds(seconds);
  if (finite(weight) && finite(reps)) return `${weight} x ${reps}`;
  if (finite(reps)) return `${reps} reps`;
  if (finite(weight)) return String(weight);
  return "-";
}
