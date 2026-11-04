import { getExercise } from "@/data/exercises";

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

// Library exercises done with a load (barbell, dumbbell, kettlebell, cable,
// machine, sled). Every other library exercise is bodyweight, a jump or band
// work, and Workout Mode shows no weight box for it (N-01).
const LOADED_EXERCISES = new Set([
  "Trap Bar Deadlift or RDL",
  "Bulgarian Split Squat",
  "Hip Thrust",
  "Heel-Elevated Goblet Squat",
  "Front Squat",
  "Step-Ups",
  "Reverse Lunges",
  "Hamstring Curls",
  "Calf Raises",
  "Soleus Raises",
  "Seated Calf Raise",
  "DB Bench Press",
  "Single-Arm Row",
  "Landmine Press or DB Shoulder Press",
  "Push Press",
  "Pallof Press",
  "Cable Woodchoppers",
  "Landmine Rotations",
  "Farmer Carries",
  "Suitcase Carry",
  "Reverse Sled Drag",
  "Face Pulls",
  "Y-T-W Raises",
  "Cuban Rotations",
  "Lat Pulldown",
  "RDL",
  "Romanian Deadlift",
  "Single-Leg RDL",
  "Kettlebell Deadlift",
  "Cable Row",
  "Chest-Supported Row",
  "Cable Pull-Through",
  "Goblet Squat",
  "Split Squat",
  "Lateral Lunges",
  "Box Squat",
  "Floor Press",
  "Half-Kneeling Landmine Press",
  "Rear Delt Fly"
]);

// Plyometrics and jumps: logged in reps, never with a weight.
const JUMP_PATTERNS = [
  /\bjumps?\b/i,
  /\bhops?\b/i,
  /\bbounds?\b/i,
  /\bpogo/i,
  /depth drops?/i,
  /snap downs?/i,
  /\bplyo/i,
  /step-offs?/i,
  /drop squat/i,
  /falling starts?/i,
  /\bsprints?\b/i,
  /shuttle/i
];

// Coach-written names that say the athlete moves their own body.
const BODYWEIGHT_PATTERNS = [
  /push-?ups?/i,
  /pull-?ups?/i,
  /chin-?ups?/i,
  /\bbody ?weight\b/i,
  /\bbw\b/i,
  /air squats?/i,
  /\bband(ed)?\b/i,
  /\bcrawl/i,
  /\bplank/i
];

// Coach-written names that name a load or a lift that is normally loaded.
const LOAD_WORDS = /\b(barbell|bb|db|dbs|dumbbells?|kb|kettlebells?|trap bar|hex bar|landmine|cable|machine|sled|weighted|plate|smith)\b/i;
const LOADED_LIFTS =
  /(squat|dead ?lift|\bdl\b|rdl|bench|press|clean|snatch|jerk|\brows?\b|pulldown|curl|lunge|thrust|carry|carries|shrug|\bfly\b|flye|extension|step-?up)/i;

/** Plyometric or jump work (approach jumps, box jumps, bounds, hops). */
export function isJumpExercise(name: string): boolean {
  return JUMP_PATTERNS.some((pattern) => pattern.test(name));
}

/**
 * Whether Workout Mode asks for a weight. Only loaded lifts do (N-01):
 * jumps, plyometrics and bodyweight work log reps (or seconds) alone.
 * A name that says what the load is ("DB step-ups", "Trap bar jumps") always
 * gets the box.
 */
export function takesWeight(name: string): boolean {
  if (LOAD_WORDS.test(name)) return true;
  if (LOADED_EXERCISES.has(name)) return true;
  if (isJumpExercise(name)) return false;
  if (BODYWEIGHT_PATTERNS.some((pattern) => pattern.test(name))) return false;
  if (getExercise(name)) return false;
  return LOADED_LIFTS.test(name);
}
