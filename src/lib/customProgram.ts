import { getPrescription, getWorkoutDays } from "@/data/workoutPlan";
import { getExerciseMeasure } from "@/lib/exerciseMeasure";
import { WorkoutDay } from "@/types";

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

export type ProgramDay = {
  day: string;
  title: string;
  notes: string;
  minutes: string;
  rest: boolean;
  exercises: ProgramExercise[];
};

export type CustomProgram = {
  id: string;
  name: string;
  days: ProgramDay[];
  updatedAt?: string;
};

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

/** A new exercise with sensible starting targets for its type. */
export function newProgramExercise(name: string): ProgramExercise {
  return getExerciseMeasure(name) === "time"
    ? { name, sets: 3, reps: null, seconds: 30 }
    : { name, sets: 3, reps: "8", seconds: null };
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
      exercises: []
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
      exercises: day.exercises.map((exercise) => exerciseFromPrescription(exercise, getPrescription(week, exercise)))
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
    const exercises = day.exercises.filter((exercise) => exercise.name.trim() !== "");
    return {
      day: weekday,
      title: day.title || (day.rest ? "Rest" : "Training"),
      minutes: day.minutes,
      notes: day.notes,
      rest: day.rest,
      exercises: exercises.map((exercise) => exercise.name),
      targets: Object.fromEntries(exercises.map((exercise) => [exercise.name, formatTarget(exercise)]))
    };
  });
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
    if (day.exercises.length === 0) problems.push(`${day.day} has no exercises. Add some or make it a rest day.`);
    const names = day.exercises.map((exercise) => exercise.name.trim().toLowerCase());
    if (names.some((name) => name === "")) problems.push(`${day.day} has an exercise with no name.`);
    if (new Set(names).size !== names.length) problems.push(`${day.day} lists the same exercise twice.`);
    for (const exercise of day.exercises) {
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
      exercises: (Array.isArray(day.exercises) ? day.exercises : [])
        .filter((exercise): exercise is Record<string, unknown> => typeof exercise === "object" && exercise !== null)
        .map((exercise) => ({
          name: String(exercise.name ?? ""),
          sets: Number(exercise.sets) || 1,
          reps: exercise.reps == null ? null : String(exercise.reps),
          seconds: exercise.seconds == null ? null : Number(exercise.seconds) || null
        }))
    }))
    .filter((day) => (WEEKDAYS as readonly string[]).includes(day.day));
}

/** The target to show for an exercise: the coach's, if they set one, else the plan's. */
export function getExerciseTarget(day: WorkoutDay | undefined, week: number, exercise: string): string {
  return day?.targets?.[exercise] ?? getPrescription(week, exercise);
}
