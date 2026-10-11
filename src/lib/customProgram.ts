import { getPrescription, getWorkoutDays } from "@/data/workoutPlan";
import { getExerciseMeasure } from "@/lib/exerciseMeasure";
import { SectionKind, WorkoutDay, WorkoutSection } from "@/types";

export type { SectionKind };

/**
 * Coach-built programs: one repeating week the coach fully controls (which
 * days train, what each day is called, the exercises and their targets).
 * Stored as jsonb in team_programs.days (schema_v43).
 */

export const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"] as const;

export type ProgramExercise = {
  name: string;
  sets: number;
  /** Rep target as written by the coach, e.g. "8" or "8-10". Null for timed exercises. */
  reps: string | null;
  /** Hold time per set for timed exercises (planks, stretches). Null for rep exercises. */
  seconds: number | null;
};

/**
 * Part of a day: a warm-up, the main lifts, accessory work, abs. A day is a
 * list of sections in the order athletes do them. A day stored before
 * sections existed reads as one unnamed section.
 */
export type ProgramSection = {
  /** Heading athletes see. Empty for a day's plain unnamed list. */
  name: string;
  kind?: SectionKind;
  /**
   * On a warm-up: true when it's a copy of the program's warm-up (written once,
   * used on every training day). False is a warm-up this day changed for
   * itself; an empty one means "no warm-up on this day".
   */
  shared?: boolean;
  /**
   * On a shared warm-up: the coach switched "On every training day" off. The
   * copy is kept so switching it back on brings the warm-up back, but nobody
   * trains from it: athletes, validation and the stored flat list skip it.
   */
  off?: boolean;
  exercises: ProgramExercise[];
};

export type ProgramDay = {
  day: string;
  title: string;
  notes: string;
  minutes: string;
  rest: boolean;
  sections: ProgramSection[];
};

/** A program saved part-way through editing ("Save Monday"). Athletes never see it. */
export type ProgramDraft = {
  name: string;
  days: ProgramDay[];
};

export type CustomProgram = {
  id: string;
  name: string;
  /** The finished week athletes follow. */
  days: ProgramDay[];
  /** Work in progress saved day by day, if the coach hasn't finished it yet. */
  draft?: ProgramDraft | null;
  updatedAt?: string;
};

/**
 * The draft is stored as one extra element in team_programs.days. Its `day`
 * isn't a weekday, so parseProgramDays (and so every athlete-side reader)
 * skips it, and assigned athletes keep the last finished week.
 */
const DRAFT_DAY = "draft";

export type ProgramAssignment = {
  programId: string;
  scope: "team" | "group" | "athlete";
  groupId: string | null;
  userId: string | null;
};

/** "3x8", "4x8-10", "3x45 sec". */
export function formatTarget(exercise: ProgramExercise): string {
  const sets = Math.max(1, exercise.sets);
  if (exercise.seconds != null) return `${sets}x${exercise.seconds} sec`;
  return `${sets}x${exercise.reps?.trim() || "?"}`;
}

/**
 * The coach's own exercises: every name used in the given programs that
 * isn't in the library, each with the targets it was last given. Pass the
 * program being edited first, then saved programs newest first, so the first
 * spelling and targets found win. Matching ignores case and outer spaces.
 */
export function ownExercises(programs: Pick<CustomProgram, "days">[], libraryNames: string[]): ProgramExercise[] {
  const known = new Set(libraryNames.map(exerciseKey));
  const found = new Map<string, ProgramExercise>();
  for (const program of programs) {
    for (const day of program.days) {
      for (const exercise of dayExercises(day)) {
        const key = exerciseKey(exercise.name);
        if (key === "" || known.has(key) || found.has(key)) continue;
        found.set(key, { ...exercise, name: exercise.name.trim() });
      }
    }
  }
  return [...found.values()].sort((a, b) => a.name.localeCompare(b.name));
}

/** How exercise names are compared: "  Step-Up " and "step-up" are the same exercise. */
export function exerciseKey(name: string): string {
  return name.trim().toLowerCase();
}

/** True while a row still has the targets a new row starts with, so filling them in overwrites nothing. */
export function hasStartingTargets(exercise: ProgramExercise): boolean {
  const start = newProgramExercise(exercise.name);
  return exercise.sets === start.sets && exercise.reps === start.reps && exercise.seconds === start.seconds;
}

/** A new exercise with sensible starting targets for its type. */
export function newProgramExercise(name: string): ProgramExercise {
  return getExerciseMeasure(name) === "time"
    ? { name, sets: 3, reps: null, seconds: 30 }
    : { name, sets: 3, reps: "8", seconds: null };
}

/** The sections athletes do, in order: everything but a switched-off warm-up. */
export function liveSections(day: Pick<ProgramDay, "sections">): ProgramSection[] {
  return day.sections.filter((section) => !section.off);
}

/** A day's exercises in the order athletes do them, every section in turn. */
export function dayExercises(day: Pick<ProgramDay, "sections">): ProgramExercise[] {
  return liveSections(day).flatMap((section) => section.exercises);
}

/** A day's sections, as one plain unnamed list holding these exercises. */
export function plainSections(exercises: ProgramExercise[]): ProgramSection[] {
  return [{ name: "", exercises }];
}

/** The warm-up section of a day, if it has one. It's always first. */
export function dayWarmup(day: Pick<ProgramDay, "sections">): ProgramSection | undefined {
  return day.sections.find((section) => section.kind === "warmup");
}

/** The heading athletes see for a section: its name, or "Warm-up" for an unnamed warm-up. */
export function sectionHeading(section: Pick<ProgramSection, "name" | "kind">): string {
  return section.name.trim() || (section.kind === "warmup" ? "Warm-up" : "");
}

/**
 * The program's warm-up, written once: the first day's copy of it, or null
 * if no day uses one. Its exercises are shared by every day with a copy.
 */
export function programWarmup(days: ProgramDay[]): ProgramSection | null {
  for (const day of days) {
    const warmup = dayWarmup(day);
    if (warmup?.shared) return warmup;
  }
  return null;
}

/**
 * Puts the program's warm-up first on each training day. With everyDay
 * false the copies stay but are switched off, so the coach's warm-up is kept
 * for later and athletes don't see it. A day that changed its warm-up for
 * itself keeps its own, including an empty one, which means "no warm-up on
 * this day". Rest days never carry the shared warm-up, and an empty warm-up
 * isn't added anywhere.
 */
export function applyWarmup(days: ProgramDay[], warmup: ProgramSection | null, everyDay: boolean): ProgramDay[] {
  const use = warmup != null && warmup.exercises.length > 0;
  return days.map((day) => {
    const own = dayWarmup(day);
    if (own && !own.shared) return day;
    const rest = day.sections.filter((section) => section !== own);
    if (!use || day.rest) return own ? { ...day, sections: rest } : day;
    const copy: ProgramSection = {
      name: warmup.name,
      kind: "warmup",
      shared: true,
      ...(everyDay ? {} : { off: true }),
      exercises: warmup.exercises
    };
    return { ...day, sections: [copy, ...rest] };
  });
}

export function blankProgram(name = "New program"): Omit<CustomProgram, "id"> {
  return {
    name,
    days: WEEKDAYS.map((day) => ({
      day,
      title: day === "Saturday" || day === "Sunday" ? "Rest" : "Training",
      notes: "",
      minutes: "45-60",
      rest: day === "Saturday" || day === "Sunday",
      sections: plainSections([])
    }))
  };
}

/**
 * Turns a recommended-plan prescription into an editable target. "3-4x8"
 * becomes 3 sets of "8"; "3x30-45 sec" becomes 3 sets of 45 seconds;
 * "10-20 min" becomes 1 set of 600 seconds. Falls back to 3x8 / 3x30s.
 */
export function exerciseFromPrescription(name: string, prescription: string): ProgramExercise {
  const timed = getExerciseMeasure(name) === "time";
  const setsMatch = prescription.match(/^(\d+)(?:-\d+)?\s*x/i);
  const sets = setsMatch ? Number(setsMatch[1]) : timed && /min/i.test(prescription) ? 1 : 3;

  if (timed) {
    const sec = prescription.match(/(\d+)(?:\s*-\s*(\d+))?\s*sec/i);
    const min = prescription.match(/(\d+)(?:\s*-\s*\d+)?\s*min/i);
    const seconds = sec ? Number(sec[2] ?? sec[1]) : min ? Number(min[1]) * 60 : 30;
    return { name, sets, reps: null, seconds };
  }

  const reps = prescription.match(/x\s*([\d]+(?:-\d+)?)/i);
  return { name, sets, reps: reps ? reps[1] : "8", seconds: null };
}

/** A copy of the recommended plan for the given week, ready to edit. */
export function programFromRecommended(week: number, name = "My program"): Omit<CustomProgram, "id"> {
  return {
    name,
    days: getWorkoutDays(week).map((day) => ({
      day: day.day,
      title: day.title,
      notes: day.notes,
      minutes: day.minutes,
      rest: Boolean(day.rest),
      sections: plainSections(
        day.exercises.map((exercise) => exerciseFromPrescription(exercise, getPrescription(week, exercise)))
      )
    }))
  };
}

/** Program days in the shape the rest of the app already renders. */
export function programToWorkoutDays(program: Pick<CustomProgram, "days">): WorkoutDay[] {
  return WEEKDAYS.map((weekday) => {
    const day = program.days.find((d) => d.day === weekday);
    if (!day) {
      return { day: weekday, title: "Rest", minutes: "", notes: "", rest: true, exercises: [], targets: {} };
    }
    const sections: WorkoutSection[] = liveSections(day)
      .map((section) => ({
        heading: sectionHeading(section),
        ...(section.kind ? { kind: section.kind } : {}),
        exercises: section.exercises.filter((exercise) => exercise.name.trim() !== "").map((exercise) => exercise.name)
      }))
      // An empty section (a skipped warm-up, a heading with nothing under it) shows nothing.
      .filter((section) => section.exercises.length > 0);
    // Once anything on the day has a heading, an unnamed list needs one too, or it reads
    // as part of the section above it (the lifts under "Warm-up").
    const headed = sections.some((section) => section.heading !== "");
    const named = headed
      ? sections.map((section) => (section.heading === "" ? { ...section, heading: "Main" } : section))
      : sections;
    const exercises = dayExercises(day).filter((exercise) => exercise.name.trim() !== "");
    return {
      day: weekday,
      title: day.title || (day.rest ? "Rest" : "Training"),
      minutes: day.minutes,
      notes: day.notes,
      rest: day.rest,
      exercises: exercises.map((exercise) => exercise.name),
      targets: Object.fromEntries(exercises.map((exercise) => [exercise.name, formatTarget(exercise)])),
      // Only days with a heading to show carry sections, so plain days render exactly as before.
      ...(headed ? { sections: named } : {})
    };
  });
}

/**
 * The heading to show before each exercise of a day, by its position in
 * `day.exercises`: set on the first exercise of each headed section.
 */
export function headingsByIndex(day: Pick<WorkoutDay, "sections">): Map<number, WorkoutSection> {
  const headings = new Map<number, WorkoutSection>();
  let index = 0;
  for (const section of day.sections ?? []) {
    if (section.heading) headings.set(index, section);
    index += section.exercises.length;
  }
  return headings;
}

/** The section an exercise sits in on a day, by its position in `day.exercises`. */
export function sectionAt(day: Pick<WorkoutDay, "sections">, exerciseIndex: number): WorkoutSection | undefined {
  let index = 0;
  for (const section of day.sections ?? []) {
    if (exerciseIndex < index + section.exercises.length) return section;
    index += section.exercises.length;
  }
  return undefined;
}

/**
 * The program an athlete follows: their own assignment, then any of their
 * groups' (most recently changed wins if they're in several), then the
 * team-wide one. Null means the recommended plan.
 */
export function pickAssignedProgramId(
  assignments: (ProgramAssignment & { updatedAt?: string })[],
  userId: string,
  groupIds: string[]
): string | null {
  const athlete = assignments.find((a) => a.scope === "athlete" && a.userId === userId);
  if (athlete) return athlete.programId;

  const group = assignments
    .filter((a) => a.scope === "group" && a.groupId != null && groupIds.includes(a.groupId))
    .sort((a, b) => (b.updatedAt ?? "").localeCompare(a.updatedAt ?? ""))[0];
  if (group) return group.programId;

  return assignments.find((a) => a.scope === "team")?.programId ?? null;
}

/** Problems that block saving. Empty when the program is valid. */
export function validateProgram(program: Pick<CustomProgram, "name" | "days">): string[] {
  const problems: string[] = [];
  if (!program.name.trim()) problems.push("Give the program a name.");

  const trainingDays = program.days.filter((day) => !day.rest);
  if (trainingDays.length === 0) problems.push("Pick at least one training day.");

  for (const day of trainingDays) {
    // Every section counts, the warm-up too: one exercise can only appear once on a day.
    const exercises = dayExercises(day);
    if (exercises.length === 0) problems.push(`${day.day} has no exercises. Add some or make it a rest day.`);
    const names = exercises.map((exercise) => exercise.name.trim().toLowerCase());
    if (names.some((name) => name === "")) problems.push(`${day.day} has an exercise with no name.`);
    if (new Set(names).size !== names.length) problems.push(`${day.day} lists the same exercise twice.`);
    for (const exercise of exercises) {
      if (exercise.sets < 1) problems.push(`${exercise.name || "An exercise"} on ${day.day} needs at least 1 set.`);
      if (exercise.seconds == null && !exercise.reps?.trim()) {
        problems.push(`${exercise.name || "An exercise"} on ${day.day} needs a rep target.`);
      }
      if (exercise.seconds != null && exercise.seconds < 1) {
        problems.push(`${exercise.name || "An exercise"} on ${day.day} needs a time target.`);
      }
    }
  }
  return problems;
}

/**
 * True when the program has a full week athletes can follow. A program saved
 * day by day but never finished has an all-rest week, so it isn't, and it
 * can't be assigned until the coach presses "Save program".
 */
export function isFinished(program: Pick<CustomProgram, "name" | "days">): boolean {
  return validateProgram(program).length === 0;
}

/** The draft saved with a program ("Save Monday"), or null if there isn't one. */
export function parseProgramDraft(raw: unknown): ProgramDraft | null {
  if (!Array.isArray(raw)) return null;
  const stored = raw.find(
    (item): item is Record<string, unknown> => typeof item === "object" && item !== null && item.day === DRAFT_DAY
  );
  if (!stored) return null;
  return { name: String(stored.name ?? ""), days: parseProgramDays(stored.days) };
}

/** The week stored for a program saved day by day but never finished: all rest, so nobody trains from it. */
export function unfinishedWeek(): ProgramDay[] {
  return WEEKDAYS.map((day) => ({ day, title: "Rest", notes: "", minutes: "", rest: true, sections: plainSections([]) }));
}

/**
 * A day as stored: its sections, plus the flat `exercises` list days had
 * before sections, so anything still reading that shape keeps working.
 */
function storedDay(day: ProgramDay) {
  return { ...day, exercises: dayExercises(day) };
}

/** What goes in team_programs.days: the finished week, plus the draft when there is one. */
export function storedProgramDays(days: ProgramDay[], draft: ProgramDraft | null): unknown[] {
  const week = days.map(storedDay);
  return draft ? [...week, { day: DRAFT_DAY, name: draft.name, days: draft.days.map(storedDay) }] : week;
}

const SECTION_KINDS: readonly SectionKind[] = ["warmup"];

function parseExercises(raw: unknown): ProgramExercise[] {
  return (Array.isArray(raw) ? raw : [])
    .filter((exercise): exercise is Record<string, unknown> => typeof exercise === "object" && exercise !== null)
    .map((exercise) => ({
      name: String(exercise.name ?? ""),
      sets: Number(exercise.sets) || 1,
      reps: exercise.reps == null ? null : String(exercise.reps),
      seconds: exercise.seconds == null ? null : Number(exercise.seconds) || null
    }));
}

function parseSections(day: Record<string, unknown>): ProgramSection[] {
  // Saved before sections existed (or with none): the flat list is one unnamed section.
  if (!Array.isArray(day.sections) || day.sections.length === 0) return plainSections(parseExercises(day.exercises));
  return day.sections
    .filter((section): section is Record<string, unknown> => typeof section === "object" && section !== null)
    .map((section) => {
      const kind = SECTION_KINDS.find((known) => known === section.kind);
      return {
        name: String(section.name ?? ""),
        ...(kind ? { kind } : {}),
        ...(section.shared === true ? { shared: true } : {}),
        ...(section.off === true ? { off: true } : {}),
        exercises: parseExercises(section.exercises)
      };
    });
}

/** Clean up loosely-typed jsonb from the database into a ProgramDay[]. */
export function parseProgramDays(raw: unknown): ProgramDay[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((day): day is Record<string, unknown> => typeof day === "object" && day !== null)
    .map((day) => ({
      day: String(day.day ?? ""),
      title: String(day.title ?? ""),
      notes: String(day.notes ?? ""),
      minutes: String(day.minutes ?? ""),
      rest: Boolean(day.rest),
      sections: parseSections(day)
    }))
    .filter((day) => (WEEKDAYS as readonly string[]).includes(day.day));
}

/** The target to show for an exercise: the coach's, if they set one, else the plan's. */
export function getExerciseTarget(day: WorkoutDay | undefined, week: number, exercise: string): string {
  return day?.targets?.[exercise] ?? getPrescription(week, exercise);
}
