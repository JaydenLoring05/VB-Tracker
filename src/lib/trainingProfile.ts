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

export type TrainingProfile = {
  level: TrainingLevel;
  injuries: InjuryArea[];
  /** Null until the athlete says; the plan treats unknown like 14 and up. */
  ageGroup?: AgeGroup | null;
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
    "Front Squat": ["Goblet Squat", "Kettlebell Deadlift"],
    "Heel-Elevated Goblet Squat": ["Goblet Squat", "Kettlebell Deadlift"],
    "Bulgarian Split Squat": ["Reverse Lunges", "Split Squat"]
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
  return profile.level === "intermediate" && profile.injuries.length === 0 && profile.ageGroup !== "under14";
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
  return { level, injuries, ageGroup };
}

/** Columns on public.profiles (schema_v56). */
export type TrainingProfileRow = {
  training_level: string | null;
  sore_areas: string[] | null;
  age_group: string | null;
};

/** A profile from the account, or null when the athlete never set one there. */
export function profileFromRow(row: TrainingProfileRow | null | undefined): TrainingProfile | null {
  if (!row || !row.training_level) return null;
  return parseTrainingProfile({ level: row.training_level, injuries: row.sore_areas ?? [], ageGroup: row.age_group });
}

export function profileToRow(profile: TrainingProfile): TrainingProfileRow {
  const clean = parseTrainingProfile(profile);
  return { training_level: clean.level, sore_areas: clean.injuries, age_group: clean.ageGroup ?? null };
}

/**
 * Scales a set-and-rep prescription by level. Beginners take the low end of
 * a set range (or one fewer set, never below 2); advanced athletes take the
 * high end. Reps, seconds and anything after the "x" stay as written.
 */
export function scaleTargetForLevel(target: string, level: TrainingLevel): string {
  if (level === "intermediate") return target;
  const match = target.match(/^(\d+)(?:-(\d+))?x(.*)$/);
  if (!match) return target;
  const low = Number(match[1]);
  const high = match[2] ? Number(match[2]) : null;
  const rest = match[3];

  if (level === "beginner") {
    const sets = high !== null ? low : Math.max(2, low - 1);
    return `${sets}x${rest}`;
  }
  return `${high ?? low}x${rest}`;
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
  const applyLevel = !options.coachProgram && profile.level !== "intermediate";

  return days.map((day) => {
    if (day.rest || day.exercises.length === 0) return day;

    const notes: Record<string, string> = { ...(day.adaptNotes ?? {}) };
    const sourceOf: Record<string, string> = {};
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

    profile.injuries.forEach((area) => {
      runSwaps(INJURY_SWAPS[area], (from) => `${AREA_LABEL[area]}-friendly swap for ${from}`);
    });

    if (isTrainingDay(day)) {
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
      targets[exercise] = applyLevel ? scaleTargetForLevel(target, profile.level) : target;
    });

    const adaptNotes: Record<string, string> = {};
    exercises.forEach((exercise) => {
      if (notes[exercise]) adaptNotes[exercise] = notes[exercise];
    });

    return {
      ...day,
      exercises,
      targets,
      ...(Object.keys(adaptNotes).length > 0 ? { adaptNotes } : {})
    };
  });
}

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
