import { getExercise } from "@/data/exercises";
import { getPrescription } from "@/data/workoutPlan";
import { StatEntry, WorkoutDay } from "@/types";

/**
 * Training profile (F-31): the athlete's level and any sore or injured
 * areas. The plan adapts to it -- easier or harder versions of lifts by
 * level, and joint-friendly swaps plus a little rehab work for each area.
 *
 * Intermediate with no injuries is the plan as written, so nothing changes
 * for anyone who never opens the picker.
 */

export type TrainingLevel = "beginner" | "intermediate" | "advanced";
export type InjuryArea = "knee" | "shoulder" | "lowerBack" | "ankle";

export type AgeGroup = "under14" | "14to17" | "18plus";

export const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"] as const;
export type Weekday = (typeof WEEKDAYS)[number];

/** What the athlete already does on a day outside NextRep (F-38). */
export type DayRole = "practice" | "liftClass";
export type WeeklySchedule = Partial<Record<Weekday, DayRole>>;

export const DAY_ROLES: { value: DayRole | "off"; label: string }[] = [
  { value: "off", label: "Nothing" },
  { value: "practice", label: "Practice" },
  { value: "liftClass", label: "Lift elsewhere" }
];

/** This week's adjustments (F-38). Worked out fresh each time; never saved. */
export type DayContext = DayRole | "game" | "preGame";
export type WeekAdjust = {
  deload: boolean;
  days: Partial<Record<Weekday, DayContext>>;
};

export type TrainingProfile = {
  level: TrainingLevel;
  injuries: InjuryArea[];
  /** Null until the athlete says; the plan treats unknown like 14 and up. */
  ageGroup?: AgeGroup | null;
  /** The athlete's regular week (F-38). */
  weekly?: WeeklySchedule;
  /** This week's adjustments, added by the hook (F-38). */
  adjust?: WeekAdjust | null;
};

export const DEFAULT_TRAINING_PROFILE: TrainingProfile = { level: "intermediate", injuries: [], ageGroup: null };

export const AGE_GROUPS: { value: AgeGroup; label: string }[] = [
  { value: "under14", label: "Under 14" },
  { value: "14to17", label: "14-17" },
  { value: "18plus", label: "18+" }
];

export const TRAINING_LEVELS: { value: TrainingLevel; label: string; hint: string }[] = [
  { value: "beginner", label: "Beginner", hint: "New to lifting or jump training" },
  { value: "intermediate", label: "Intermediate", hint: "Lifting a year or more" },
  { value: "advanced", label: "Advanced", hint: "Years of strength and jump work" }
];

export const INJURY_AREAS: { value: InjuryArea; label: string }[] = [
  { value: "knee", label: "Knee" },
  { value: "shoulder", label: "Shoulder" },
  { value: "lowerBack", label: "Lower back" },
  { value: "ankle", label: "Ankle" }
];

/** Each entry lists replacements in order of preference; the first one not already in the day wins. */
type SwapTable = Record<string, string[]>;

const LEVEL_SWAPS: Record<TrainingLevel, SwapTable> = {
  beginner: {
    "Front Squat": ["Goblet Squat"],
    "Trap Bar Deadlift or RDL": ["Kettlebell Deadlift"],
    "Bulgarian Split Squat": ["Split Squat", "Reverse Lunges"],
    "Nordic Hamstring Curl": ["Swiss Ball Curl", "Hamstring Curls"],
    "Pull-Ups": ["Band-Assisted Pull-Up", "Lat Pulldown"],
    "Chin-Ups": ["Band-Assisted Pull-Up", "Lat Pulldown"],
    Dips: ["Bench Dips", "Push-Ups"],
    "Push Press": ["Half-Kneeling Landmine Press"],
    "Pike Push-Ups": ["Incline Push-Up"],
    "Handstand Practice": ["Bear Crawl"],
    "Hanging Leg Raises": ["Hanging Knee Raises"],
    "L-Sit Practice": ["Hollow Hold"],
    "Ab Wheel Rollout": ["Stability Ball Rollout"],
    "Drop Jumps": ["Snap Downs"],
    "Depth Drops": ["Box Step-Offs"],
    "Approach Jumps": ["Standing Vertical Jumps"],
    "Lateral Bounds": ["Skater Jumps"],
    Bounds: ["Skater Jumps"]
  },
  intermediate: {},
  advanced: {
    "Heel-Elevated Goblet Squat": ["Front Squat"],
    "Goblet Squat": ["Front Squat"],
    "Step-Ups": ["Bulgarian Split Squat"],
    "Hip Thrust": ["Single-Leg Hip Thrust"],
    "Push-Ups": ["Dips"],
    Planks: ["Ab Wheel Rollout"],
    "Band-Assisted Pull-Up": ["Pull-Ups"],
    "Squat Jumps": ["Box Jumps"],
    "Hamstring Curls": ["Nordic Hamstring Curl"]
  }
};

// Under 14 (F-35): growing bones and tendons get bodyweight, light-implement
// and landing work instead of heavy barbell lifts and high-impact depth jumps.
const YOUTH_SWAPS: SwapTable = {
  "Front Squat": ["Goblet Squat"],
  "Heel-Elevated Goblet Squat": ["Goblet Squat"],
  "Trap Bar Deadlift or RDL": ["Kettlebell Deadlift", "Glute Bridge"],
  RDL: ["Kettlebell Deadlift", "Glute Bridge"],
  "Romanian Deadlift": ["Kettlebell Deadlift", "Glute Bridge"],
  "Bulgarian Split Squat": ["Split Squat", "Reverse Lunges"],
  "Nordic Hamstring Curl": ["Swiss Ball Curl"],
  "Push Press": ["Med Ball Chest Pass"],
  Dips: ["Push-Ups"],
  "Hanging Leg Raises": ["Hanging Knee Raises"],
  "Ab Wheel Rollout": ["Stability Ball Rollout", "Dead Bugs"],
  "L-Sit Practice": ["Hollow Hold"],
  "Depth Drops": ["Snap Downs"],
  "Drop Jumps": ["Snap Downs"]
};

/** Jumping days for youth always include landing practice. */
const JUMP_WORK = new Set([
  "Box Jumps",
  "Broad Jumps",
  "Approach Jumps",
  "Pogo Hops",
  "Squat Jumps",
  "Standing Vertical Jumps",
  "Lateral Bounds",
  "Bounds",
  "Skater Jumps",
  "Line Hops",
  "Snap Downs"
]);

const INJURY_SWAPS: Record<InjuryArea, SwapTable> = {
  // Jumper's knee: cut the high-impact jumping and deep loaded knee bends,
  // keep the hips working and lean on slow, controlled knee work.
  knee: {
    "Pogo Hops": ["Single-Leg Calf Raise", "Calf Raises"],
    "Box Jumps": ["Hip Thrust", "Glute Bridge"],
    "Broad Jumps": ["Kettlebell Deadlift", "Glute Bridge"],
    "Approach Jumps": ["Single-Leg Hip Thrust", "Hip Thrust"],
    "Squat Jumps": ["Glute Bridge", "Hip Thrust"],
    "Standing Vertical Jumps": ["Glute Bridge", "Hip Thrust"],
    "Depth Drops": ["Wall Sit"],
    "Drop Jumps": ["Wall Sit"],
    "Lateral Bounds": ["Lateral Band Walks", "Monster Walks"],
    Bounds: ["Monster Walks", "Lateral Band Walks"],
    "Skater Jumps": ["Monster Walks", "Lateral Band Walks"],
    "Line Hops": ["Single-Leg Calf Raise"],
    // Deep loaded knee bends: squat to a box at parallel instead, or hold a wall sit.
    "Front Squat": ["Box Squat", "Goblet Squat", "Kettlebell Deadlift"],
    "Heel-Elevated Goblet Squat": ["Box Squat", "Goblet Squat", "Kettlebell Deadlift"],
    "Goblet Squat": ["Box Squat", "Wall Sit"],
    "Deep Squat Holds": ["Wall Sit"],
    "Bulgarian Split Squat": ["Step-Ups", "Reverse Lunges", "Split Squat"]
  },
  // Keep pressing and pulling, but below the head and with the arm supported.
  shoulder: {
    "Pull-Ups": ["Lat Pulldown", "Chest-Supported Row"],
    "Chin-Ups": ["Lat Pulldown", "Chest-Supported Row"],
    "Band-Assisted Pull-Up": ["Lat Pulldown", "Chest-Supported Row"],
    "DB Bench Press": ["Floor Press", "Push-Ups"],
    Dips: ["Push-Ups", "Floor Press"],
    "Bench Dips": ["Push-Ups", "Floor Press"],
    "Landmine Press or DB Shoulder Press": ["Half-Kneeling Landmine Press"],
    "Push Press": ["Half-Kneeling Landmine Press"],
    "Pike Push-Ups": ["Scap Push-Ups"],
    "Handstand Practice": ["Bear Crawl"],
    "Hanging Leg Raises": ["Dead Bugs", "Hollow Hold"],
    "Hanging Knee Raises": ["Dead Bugs", "Hollow Hold"],
    "L-Sit Practice": ["Hollow Hold", "Dead Bugs"],
    "Single-Arm Row": ["Chest-Supported Row"]
  },
  // Take heavy load off the spine and swap fast twisting for anti-rotation.
  lowerBack: {
    "Trap Bar Deadlift or RDL": ["Hip Thrust", "Glute Bridge"],
    RDL: ["Glute Bridge", "Hip Thrust"],
    "Romanian Deadlift": ["Glute Bridge", "Hip Thrust"],
    "Single-Leg RDL": ["Single-Leg Hip Thrust", "Glute Bridge"],
    "Front Squat": ["Goblet Squat"],
    "Back Extensions": ["Bird Dog"],
    "Ab Wheel Rollout": ["Dead Bugs"],
    "Stability Ball Rollout": ["Dead Bugs"],
    "Med Ball Rotational Throws": ["Pallof Press", "Band Rotations"],
    "Landmine Rotations": ["Pallof Press", "Band Rotations"],
    "Cable Woodchoppers": ["Pallof Press", "Band Rotations"],
    "Push Press": ["Half-Kneeling Landmine Press"],
    "Hanging Leg Raises": ["Dead Bugs"]
  },
  // Cut the impact and sharp cuts; keep the legs strong without the bounce.
  ankle: {
    "Pogo Hops": ["Seated Calf Raise"],
    "Line Hops": ["Seated Calf Raise"],
    "Jump Rope": ["Easy Bike"],
    "Box Jumps": ["Hip Thrust", "Glute Bridge"],
    "Broad Jumps": ["Kettlebell Deadlift", "Glute Bridge"],
    "Approach Jumps": ["Single-Leg Hip Thrust", "Hip Thrust"],
    "Squat Jumps": ["Glute Bridge", "Hip Thrust"],
    "Standing Vertical Jumps": ["Glute Bridge", "Hip Thrust"],
    "Lateral Bounds": ["Monster Walks", "Lateral Band Walks"],
    Bounds: ["Monster Walks", "Lateral Band Walks"],
    "Skater Jumps": ["Monster Walks", "Lateral Band Walks"],
    "Depth Drops": ["Wall Sit"],
    "Drop Jumps": ["Wall Sit"],
    "Sprint Starts": ["Easy Bike"],
    "Court Sprints": ["Easy Bike"],
    "Shuttle Runs": ["Easy Bike"]
  }
};

/**
 * Fallback for exercises the swap tables don't know (coach-written names like
 * "Max approach jumps" or "Overhead press"): keep the exercise, but cut the
 * sets. Knee: jumping and plyometrics. Shoulder: overhead pressing and
 * full-power swings. Ankle shares the knee's impact list.
 */
const INJURY_REDUCE: Partial<Record<InjuryArea, RegExp>> = {
  knee: /jump|approach|bound|\bhops?\b|plyo|depth|drop squat/i,
  ankle: /jump|bound|\bhops?\b|plyo|depth|sprint/i,
  shoulder: /overhead|snatch|jerk|arm swing|hitting|\bserv(e|es|ing)\b|spik(e|es|ing)|military press|shoulder press|push press|overhead throws?/i
};

/** Never cut: these are the landing and low-impact work the reductions point people toward. */
const NEVER_REDUCE = new Set(["Landing Mechanics Drill", "Box Step-Offs", "Snap Downs"]);

/** Rehab work added to every training day for each flagged area. */
const INJURY_ADDONS: Record<InjuryArea, string[]> = {
  knee: ["Spanish Squat", "Tibialis Raises"],
  shoulder: ["External Rotations", "Band Pull-Aparts"],
  lowerBack: ["Bird Dog", "Side Planks"],
  ankle: ["Single-Leg Calf Raise", "Ankle Rocks"]
};

const AREA_LABEL: Record<InjuryArea, string> = {
  knee: "Knee",
  shoulder: "Shoulder",
  lowerBack: "Lower-back",
  ankle: "Ankle"
};

const LEVEL_LABEL: Record<TrainingLevel, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced"
};

export function isDefaultProfile(profile: TrainingProfile): boolean {
  return (
    profile.level === "intermediate" &&
    profile.injuries.length === 0 &&
    profile.ageGroup !== "under14" &&
    Object.keys(profile.weekly ?? {}).length === 0 &&
    !profile.adjust?.deload &&
    Object.keys(profile.adjust?.days ?? {}).length === 0
  );
}

export function parseWeeklySchedule(raw: unknown): WeeklySchedule {
  if (!raw || typeof raw !== "object") return {};
  const weekly: WeeklySchedule = {};
  WEEKDAYS.forEach((day) => {
    const role = (raw as Record<string, unknown>)[day];
    if (role === "practice" || role === "liftClass") weekly[day] = role;
  });
  return weekly;
}

/** Reads a stored profile, falling back to the default for anything missing or malformed. */
export function parseTrainingProfile(raw: unknown): TrainingProfile {
  if (!raw || typeof raw !== "object") return DEFAULT_TRAINING_PROFILE;
  const value = raw as Partial<TrainingProfile>;
  const level = TRAINING_LEVELS.some((option) => option.value === value.level)
    ? (value.level as TrainingLevel)
    : DEFAULT_TRAINING_PROFILE.level;
  const injuries = Array.isArray(value.injuries)
    ? INJURY_AREAS.map((option) => option.value).filter((area) => value.injuries!.includes(area))
    : [];
  const ageGroup = AGE_GROUPS.some((option) => option.value === value.ageGroup) ? (value.ageGroup as AgeGroup) : null;
  return { level, injuries, ageGroup, weekly: parseWeeklySchedule(value.weekly) };
}

/** Columns on public.profiles (schema_v56). */
export type TrainingProfileRow = {
  training_level: string | null;
  sore_areas: string[] | null;
  age_group: string | null;
  /** schema_v58; missing before that SQL runs. */
  weekly_schedule?: Record<string, string> | null;
};

/** A profile from the account, or null when the athlete never set one there. */
export function profileFromRow(row: TrainingProfileRow | null | undefined): TrainingProfile | null {
  if (!row || !row.training_level) return null;
  return parseTrainingProfile({
    level: row.training_level,
    injuries: row.sore_areas ?? [],
    ageGroup: row.age_group,
    weekly: row.weekly_schedule ?? {}
  });
}

export function profileToRow(profile: TrainingProfile): TrainingProfileRow {
  const clean = parseTrainingProfile(profile);
  return {
    training_level: clean.level,
    sore_areas: clean.injuries,
    age_group: clean.ageGroup ?? null,
    weekly_schedule: clean.weekly ?? {}
  };
}

/** Percent-of-max change by level, in percentage points, and the bounds it stays inside. */
const PERCENT_SHIFT: Record<TrainingLevel, number> = { beginner: -10, intermediate: 0, advanced: 5 };
const PERCENT_MIN = 40;
const PERCENT_MAX = 90;

/** Moves any "75%" in a target by the level's shift ("5x5 @ 75%" -> "5x5 @ 65%" for beginners). */
export function scalePercentForLevel(target: string, level: TrainingLevel): string {
  const shift = PERCENT_SHIFT[level];
  if (shift === 0) return target;
  return target.replace(/(\d+)\s*%/g, (whole, digits: string) => {
    const value = Number(digits);
    // Already outside the bounds (a coach's 95% single): only ever move it toward safer.
    const next = shift < 0 ? Math.max(Math.min(PERCENT_MIN, value), value + shift) : Math.min(Math.max(PERCENT_MAX, value), value + shift);
    return whole.replace(digits, String(next));
  });
}

/**
 * Scales a set-and-rep prescription by level. Beginners take the low end of
 * a set range (or one fewer set, never below 2) and 10 points less of any
 * percent of max; advanced athletes take the high end and 5 points more
 * (never past 90%). Reps and seconds stay as written.
 */
export function scaleTargetForLevel(target: string, level: TrainingLevel): string {
  if (level === "intermediate") return target;
  const match = target.match(/^(\d+)(?:-(\d+))?x(.*)$/);
  if (!match) return scalePercentForLevel(target, level);
  const low = Number(match[1]);
  const high = match[2] ? Number(match[2]) : null;
  const rest = scalePercentForLevel(match[3], level);

  if (level === "beginner") {
    const sets = high !== null ? low : Math.max(2, low - 1);
    return `${sets}x${rest}`;
  }
  return `${high ?? low}x${rest}`;
}

/**
 * About half the sets (rounded up, never below 2, or the low end of a range),
 * for movements an injury keeps but cuts back. "5x3" -> "3x3", "4x3" -> "2x3".
 */
export function reduceTargetForInjury(target: string): string {
  const match = target.match(/^(\d+)(?:-(\d+))?x(.*)$/);
  if (!match) return target;
  const sets = Math.max(2, Math.ceil(Number(match[1]) / 2));
  return `${Math.min(sets, Number(match[1]))}x${match[3]}`;
}

// Movement families for the day rules below (F-38), from the exercise library.
const JUMPING_CATEGORIES = new Set(["Jump Development", "Landing Mechanics", "Speed & Agility"]);
const LIGHT_CATEGORIES = new Set(["Knee Strength", "Rotational Core", "Mobility", "Recovery"]);
// Shoulder prehab only; pull-ups and rows count as lifting.
const SHOULDER_PREHAB = new Set([
  "Face Pulls",
  "Band Pull-Aparts",
  "External Rotations",
  "Scap Push-Ups",
  "Y-T-W Raises",
  "Cuban Rotations",
  "Light Shoulder Band Work",
  "Wall Slides",
  "Rear Delt Fly"
]);
const GAME_DAY = ["Full-Body Mobility Flow", "Light Stretching", "Foam Roll"];

const DAY_CONTEXT_NOTE: Record<DayContext, string> = {
  practice: "Practice day: the jumping happens at practice, so this is strength and rehab only.",
  liftClass: "You lift elsewhere today: this is rehab, core and mobility only.",
  preGame: "Day before a game: no jumping or heavy legs. Stay fresh.",
  game: "Game day: just loosen up. Win the game."
};

function categoryOf(exercise: string): string | undefined {
  return getExercise(exercise)?.category;
}

function applyDayContext(exercises: string[], context: DayContext | undefined): string[] {
  if (!context) return exercises;
  if (context === "game") return [...GAME_DAY];
  let kept: string[];
  if (context === "practice") {
    // Practice already has the jumps; keep landing practice and everything else.
    kept = exercises.filter((exercise) => !JUMP_WORK.has(exercise) && exercise !== "Sprint Starts");
  } else if (context === "liftClass") {
    kept = exercises.filter(
      (exercise) => LIGHT_CATEGORIES.has(categoryOf(exercise) ?? "") || SHOULDER_PREHAB.has(exercise)
    );
  } else {
    // preGame: nothing that loads the legs or the jump.
    kept = exercises.filter((exercise) => {
      const category = categoryOf(exercise) ?? "";
      return !JUMPING_CATEGORIES.has(category) && !JUMP_WORK.has(exercise);
    });
  }
  return kept.length > 0 ? kept : ["Full-Body Mobility Flow"];
}

/** One fewer set (never below 2), or the low end of a range: a lighter week. */
export function deloadTarget(target: string): string {
  return scaleTargetForLevel(target, "beginner");
}

function isTrainingDay(day: WorkoutDay): boolean {
  if (day.rest || day.exercises.length === 0) return false;
  return !/mobility|recovery|rest/i.test(day.title);
}

function pickReplacement(candidates: string[], taken: Set<string>): string | null {
  return candidates.find((candidate) => !taken.has(candidate)) ?? null;
}

/**
 * Adapts a week of days to the athlete's profile. Level swaps run first,
 * then injury swaps, so a harder variation can never bring back a movement
 * an injury rules out. Coach-built programs keep their exercises and
 * targets for level (the coach chose them) but still get injury swaps and
 * rehab work.
 */
export function adaptWorkoutDays(
  days: WorkoutDay[],
  week: number,
  profile: TrainingProfile,
  options: { coachProgram?: boolean } = {}
): WorkoutDay[] {
  if (isDefaultProfile(profile)) return days;
  const youth = profile.ageGroup === "under14";
  const applyLevel = !options.coachProgram && profile.level !== "intermediate";
  // Youth sets follow the beginner rule (low end of the range) whatever the level.
  const setLevel: TrainingLevel | null = options.coachProgram ? null : youth ? "beginner" : applyLevel ? profile.level : null;

  return days.map((day) => {
    if (day.rest || day.exercises.length === 0) return day;

    const notes: Record<string, string> = { ...(day.adaptNotes ?? {}) };
    const sourceOf: Record<string, string> = {};
    const reduced = new Set<string>();
    let exercises = [...day.exercises];

    const runSwaps = (table: SwapTable, describe: (from: string) => string) => {
      const taken = new Set(exercises);
      const next: string[] = [];
      exercises.forEach((exercise) => {
        const candidates = table[exercise];
        if (!candidates) {
          next.push(exercise);
          return;
        }
        const replacement = pickReplacement(candidates, taken);
        const original = sourceOf[exercise] ?? exercise;
        taken.delete(exercise);
        if (!replacement) return; // every safer option is already in the day
        taken.add(replacement);
        sourceOf[replacement] = original;
        notes[replacement] = describe(original);
        delete notes[exercise];
        next.push(replacement);
      });
      exercises = next;
    };

    if (applyLevel) {
      runSwaps(LEVEL_SWAPS[profile.level], (from) => `${LEVEL_LABEL[profile.level]} version of ${from}`);
    }

    if (youth) {
      runSwaps(YOUTH_SWAPS, (from) => `Under-14 version of ${from}`);
    }

    profile.injuries.forEach((area) => {
      runSwaps(INJURY_SWAPS[area], (from) => `${AREA_LABEL[area]}-friendly swap for ${from}`);
    });

    // Anything risky the tables didn't know: keep it, but cut the volume.
    profile.injuries.forEach((area) => {
      const pattern = INJURY_REDUCE[area];
      if (!pattern) return;
      exercises.forEach((exercise) => {
        if (NEVER_REDUCE.has(exercise) || sourceOf[exercise] || reduced.has(exercise) || !pattern.test(exercise)) return;
        reduced.add(exercise);
        notes[exercise] = `Fewer sets for your ${AREA_LABEL[area].toLowerCase()}. Stop if it hurts.`;
      });
    });

    const context = profile.adjust?.days[day.day as Weekday];
    const beforeContext = exercises.join("|");
    exercises = applyDayContext(exercises, context);
    // Only explain a practice or lift-elsewhere day when it actually changed something.
    const showContext =
      !!context && (context === "game" || context === "preGame" || exercises.join("|") !== beforeContext);

    if (youth && context !== "game" && isTrainingDay(day) && exercises.some((exercise) => JUMP_WORK.has(exercise))) {
      if (!exercises.includes("Landing Mechanics Drill")) {
        exercises.push("Landing Mechanics Drill");
        notes["Landing Mechanics Drill"] = "Added: landing practice for under-14 athletes";
      }
    }

    // Knee: whatever jumping is left (cut back) comes with landing practice.
    const kneeJumping =
      profile.injuries.includes("knee") &&
      exercises.some((exercise) => JUMP_WORK.has(exercise) || reduced.has(exercise));
    if (kneeJumping && context !== "game" && !exercises.includes("Landing Mechanics Drill")) {
      exercises.push("Landing Mechanics Drill");
      notes["Landing Mechanics Drill"] = "Added: landing practice to go with less jumping for your knee";
    }

    if (isTrainingDay(day) && context !== "game") {
      profile.injuries.forEach((area) => {
        INJURY_ADDONS[area].forEach((addon) => {
          if (exercises.includes(addon)) return;
          exercises.push(addon);
          notes[addon] = `Added for your ${AREA_LABEL[area].toLowerCase()}`;
        });
      });
    }

    const targets: Record<string, string> = {};
    exercises.forEach((exercise) => {
      const source = sourceOf[exercise];
      const existing = day.targets?.[exercise] ?? (source ? day.targets?.[source] : undefined);
      const target = existing ?? getPrescription(week, exercise);
      const scaled = setLevel ? scaleTargetForLevel(target, setLevel) : target;
      const cut = reduced.has(exercise) ? reduceTargetForInjury(scaled) : scaled;
      targets[exercise] = profile.adjust?.deload && !options.coachProgram ? deloadTarget(cut) : cut;
    });

    const adaptNotes: Record<string, string> = {};
    exercises.forEach((exercise) => {
      if (notes[exercise]) adaptNotes[exercise] = notes[exercise];
    });

    const dayNote = [showContext && context ? DAY_CONTEXT_NOTE[context] : null, profile.adjust?.deload ? "Lighter week: one set fewer to recover." : null]
      .filter(Boolean)
      .join(" ");

    return {
      ...day,
      exercises,
      targets,
      ...(Object.keys(adaptNotes).length > 0 ? { adaptNotes } : {}),
      ...(dayNote ? { adjustNote: dayNote } : {})
    };
  });
}

/** What one exercise becomes for this profile: the pure, single-exercise view of adaptWorkoutDays. */
export type AdaptedExercise = { exercise: string; target: string; note: string | null };

export function adaptExercise(
  exercise: string,
  target: string,
  profile: TrainingProfile,
  options: { coachProgram?: boolean } = {}
): AdaptedExercise {
  const plain: TrainingProfile = { ...profile, adjust: null };
  const source: WorkoutDay = { day: "Monday", title: "Training", minutes: "", notes: "", exercises: [exercise], targets: { [exercise]: target } };
  const [result] = adaptWorkoutDays([source], 1, plain, options);
  if (result === source || result.exercises.length === 0) return { exercise, target, note: null };
  const adapted = result.exercises[0];
  return {
    exercise: adapted,
    target: result.targets?.[adapted] ?? target,
    note: result.adaptNotes?.[adapted] ?? null
  };
}

/** Shown wherever the plan changes for a sore area. */
export const INJURY_DISCLAIMER =
  "This is not medical advice. These swaps are general, conservative options. If pain persists, gets worse during a set, or comes with swelling, stop and follow your athletic trainer, physio or doctor.";

/** Pain at or above this on today's check-in turns that area on for the day (F-33). */
export const CHECK_IN_PAIN_THRESHOLD = 4;

const PAIN_FIELD: Record<InjuryArea, "kneePain" | "shoulderPain" | "lowerBackPain" | "anklePain"> = {
  knee: "kneePain",
  shoulder: "shoulderPain",
  lowerBack: "lowerBackPain",
  ankle: "anklePain"
};

/** Areas today's check-in reported as sore. A check-in from another day counts for nothing. */
export function checkInSoreAreas(
  stats: Pick<StatEntry, "date" | "kneePain" | "shoulderPain" | "lowerBackPain" | "anklePain"> | null | undefined,
  today: string
): InjuryArea[] {
  if (!stats || stats.date !== today) return [];
  return INJURY_AREAS.map((option) => option.value).filter(
    (area) => Number(stats[PAIN_FIELD[area]]) >= CHECK_IN_PAIN_THRESHOLD
  );
}

/** The profile the plan uses today: the athlete's saved areas plus anything today's check-in flagged. */
export function withCheckInAreas(profile: TrainingProfile, areas: InjuryArea[]): TrainingProfile {
  const extra = areas.filter((area) => !profile.injuries.includes(area));
  if (extra.length === 0) return profile;
  const injuries = INJURY_AREAS.map((option) => option.value).filter(
    (area) => profile.injuries.includes(area) || extra.includes(area)
  );
  return { ...profile, injuries };
}

/** Display label for an area ("Lower back"). */
export function injuryLabel(area: InjuryArea): string {
  return INJURY_AREAS.find((option) => option.value === area)?.label ?? area;
}

/** How many exercises the profile changed or added across the week. */
export function countAdaptations(days: WorkoutDay[]): number {
  return days.reduce((sum, day) => sum + Object.keys(day.adaptNotes ?? {}).length, 0);
}
