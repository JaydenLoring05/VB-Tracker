/**
 * A coach's own exercises (F-22, schema_v59). They sit next to the built-in
 * list in `src/data/exercises.ts`: the library shows both, and Workout Mode
 * reads a team exercise's cues and reps-or-time measure when a program uses
 * it. Everything here is pure so it can be tested without Supabase.
 */
import { exercises as builtInExercises, getExercise } from "@/data/exercises";
import { ExerciseMeasure, getExerciseMeasure } from "@/lib/exerciseMeasure";
import { Exercise, ExerciseCategory, ExerciseLevel } from "@/types";

export const EXERCISE_CATEGORIES: ExerciseCategory[] = [
  "Jump Development",
  "Landing Mechanics",
  "Knee Strength",
  "Shoulder Health",
  "Hitting Power",
  "Rotational Core",
  "Speed & Agility",
  "Volleyball Conditioning",
  "Mobility",
  "Recovery"
];

/** The library filter chip that shows only the team's own exercises. */
export const TEAM_FILTER = "Your team";

export const NAME_MAX = 80;
export const PURPOSE_MAX = 280;
export const CUES_MAX = 8;
export const CUES_TOTAL_MAX = 1200;
export const VIDEO_URL_MAX = 500;

const TEAM_ICON = "📋";
const DEFAULT_CATEGORY: ExerciseCategory = "Volleyball Conditioning";

/** A row of `team_exercises` as Supabase returns it. */
export type TeamExerciseRow = {
  id: string;
  team_id: string;
  name: string;
  category: string | null;
  purpose: string | null;
  cues: string[] | null;
  video_url: string | null;
  measure: string | null;
};

export type TeamExercise = {
  id: string;
  name: string;
  category: ExerciseCategory;
  purpose: string;
  cues: string[];
  videoUrl: string | null;
  measure: ExerciseMeasure;
};

/** What the coach typed into the form. */
export type TeamExerciseInput = {
  name: string;
  category: string;
  purpose: string;
  cuesText: string;
  videoUrl: string;
  measure: string;
};

/** The columns written on insert or update. */
export type TeamExercisePayload = {
  name: string;
  category: ExerciseCategory;
  purpose: string | null;
  cues: string[];
  video_url: string | null;
  measure: ExerciseMeasure;
};

export type TeamExerciseErrors = Partial<Record<"name" | "purpose" | "cues" | "videoUrl", string>>;

export type TeamExerciseValidation =
  | { ok: true; payload: TeamExercisePayload }
  | { ok: false; errors: TeamExerciseErrors };

/**
 * One card in the Exercise Library: a built-in exercise, or a team one.
 * Team exercises have no level, mistakes or substitutions, and the video
 * link is optional.
 */
export type LibraryExercise = Omit<Exercise, "level" | "video"> & {
  level: ExerciseLevel | null;
  video: string | null;
  teamExercise?: TeamExercise;
};

export function emptyTeamExerciseInput(): TeamExerciseInput {
  return { name: "", category: DEFAULT_CATEGORY, purpose: "", cuesText: "", videoUrl: "", measure: "reps" };
}

export function teamExerciseToInput(exercise: TeamExercise): TeamExerciseInput {
  return {
    name: exercise.name,
    category: exercise.category,
    purpose: exercise.purpose,
    cuesText: exercise.cues.join("\n"),
    videoUrl: exercise.videoUrl ?? "",
    measure: exercise.measure
  };
}

const nameKey = (name: string) => name.trim().replace(/\s+/g, " ").toLowerCase();

const isCategory = (value: unknown): value is ExerciseCategory =>
  typeof value === "string" && (EXERCISE_CATEGORIES as string[]).includes(value);

/** One cue per line. Leading "-", "*", "•" or "1." bullets are dropped, as are blank lines. */
export function parseCues(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.replace(/^\s*(?:[-*•]|\d+[.)])\s*/, "").trim())
    .filter((line) => line.length > 0);
}

/**
 * An https link, or null for an empty box. A link typed without a scheme
 * ("youtube.com/watch?v=...") gets "https://". Anything else is invalid.
 */
export function normalizeVideoUrl(raw: string): { ok: true; url: string | null } | { ok: false } {
  const trimmed = raw.trim();
  if (!trimmed) return { ok: true, url: null };

  const withScheme = /^[a-z][a-z0-9+.-]*:/i.test(trimmed) ? trimmed : `https://${trimmed}`;
  let parsed: URL;
  try {
    parsed = new URL(withScheme);
  } catch {
    return { ok: false };
  }
  if (parsed.protocol !== "https:" || !parsed.hostname.includes(".")) return { ok: false };

  const url = parsed.toString();
  return url.length <= VIDEO_URL_MAX ? { ok: true, url } : { ok: false };
}

/**
 * Checks the form before anything is saved. A name can't repeat a built-in
 * exercise (it would hide behind the built-in card and its cues) or another
 * of the team's own exercises. `editingId` is the exercise being edited, so
 * keeping its own name is fine.
 */
export function validateTeamExerciseInput(
  input: TeamExerciseInput,
  teamExercises: TeamExercise[],
  editingId: string | null = null,
  builtIn: Pick<Exercise, "name">[] = builtInExercises
): TeamExerciseValidation {
  const errors: TeamExerciseErrors = {};

  const name = input.name.trim().replace(/\s+/g, " ");
  if (!name) {
    errors.name = "Give the exercise a name.";
  } else if (name.length > NAME_MAX) {
    errors.name = `Keep the name to ${NAME_MAX} characters.`;
  } else if (builtIn.some((exercise) => nameKey(exercise.name) === nameKey(name))) {
    errors.name = "That exercise is already in the library.";
  } else if (teamExercises.some((exercise) => exercise.id !== editingId && nameKey(exercise.name) === nameKey(name))) {
    errors.name = "Your team already has an exercise with this name.";
  }

  const purpose = input.purpose.trim();
  if (purpose.length > PURPOSE_MAX) errors.purpose = `Keep this to ${PURPOSE_MAX} characters.`;

  const cues = parseCues(input.cuesText);
  if (cues.length > CUES_MAX) {
    errors.cues = `Up to ${CUES_MAX} cues, one per line.`;
  } else if (cues.join("").length > CUES_TOTAL_MAX) {
    errors.cues = "Shorten the cues a little.";
  }

  const video = normalizeVideoUrl(input.videoUrl);
  if (!video.ok) errors.videoUrl = "Paste a full link that starts with https://, or leave it empty.";

  if (Object.keys(errors).length > 0 || !video.ok) return { ok: false, errors };

  return {
    ok: true,
    payload: {
      name,
      category: isCategory(input.category) ? input.category : DEFAULT_CATEGORY,
      purpose: purpose || null,
      cues,
      video_url: video.url,
      measure: input.measure === "time" ? "time" : "reps"
    }
  };
}

export function rowToTeamExercise(row: TeamExerciseRow): TeamExercise {
  return {
    id: row.id,
    name: row.name.trim(),
    category: isCategory(row.category) ? row.category : DEFAULT_CATEGORY,
    purpose: row.purpose?.trim() ?? "",
    cues: Array.isArray(row.cues) ? row.cues.filter((cue) => typeof cue === "string" && cue.trim()) : [],
    videoUrl: row.video_url || null,
    measure: row.measure === "time" ? "time" : "reps"
  };
}

export function toLibraryExercise(exercise: TeamExercise): LibraryExercise {
  return {
    name: exercise.name,
    category: exercise.category,
    level: null,
    icon: TEAM_ICON,
    purpose: exercise.purpose,
    cues: exercise.cues,
    mistakes: [],
    substitutions: [],
    video: exercise.videoUrl,
    teamExercise: exercise
  };
}

/** The team's exercises first (A to Z), then the built-in list in its usual order. */
export function buildLibrary(
  teamExercises: TeamExercise[],
  builtIn: Exercise[] = builtInExercises
): LibraryExercise[] {
  const team = [...teamExercises]
    .sort((a, b) => a.name.localeCompare(b.name))
    .map(toLibraryExercise);
  return [...team, ...builtIn];
}

/**
 * The library's search and filter chips. "Your team" shows only the team's
 * exercises. Team exercises have no level, so a level chip other than "All"
 * leaves them out.
 */
export function filterLibrary(
  library: LibraryExercise[],
  { category, level, search }: { category: string; level: string; search: string }
): LibraryExercise[] {
  const query = search.toLowerCase().trim();

  return library.filter((exercise) => {
    const matchesCategory =
      category === "All" ||
      (category === TEAM_FILTER ? Boolean(exercise.teamExercise) : exercise.category === category);
    const matchesLevel = level === "All" || exercise.level === level;

    const searchableText = [
      exercise.name,
      exercise.category,
      exercise.purpose,
      ...(exercise.cues ?? []),
      ...(exercise.mistakes ?? []),
      ...(exercise.substitutions ?? [])
    ]
      .join(" ")
      .toLowerCase();

    return matchesCategory && matchesLevel && (!query || searchableText.includes(query));
  });
}

/** The team exercise a program row refers to, matched by name (case and spacing ignored). */
export function findTeamExercise(name: string, teamExercises: TeamExercise[]): TeamExercise | undefined {
  const key = nameKey(name);
  return teamExercises.find((exercise) => nameKey(exercise.name) === key);
}

/** Coaching cues for Workout Mode: the built-in exercise's, else the team exercise's. */
export function cuesFor(name: string, teamExercises: TeamExercise[]): string[] {
  const builtIn = getExercise(name);
  if (builtIn) return builtIn.cues ?? [];
  return findTeamExercise(name, teamExercises)?.cues ?? [];
}

/**
 * Reps or time. A team exercise uses what the coach picked; everything else
 * keeps the name-based rule in `getExerciseMeasure`.
 */
export function measureFor(name: string, teamExercises: TeamExercise[]): ExerciseMeasure {
  if (!getExercise(name)) {
    const team = findTeamExercise(name, teamExercises);
    if (team) return team.measure;
  }
  return getExerciseMeasure(name);
}

/**
 * Which of the user's teams the library shows, matching useTeam(): the team
 * saved as active in this browser, else the newest team, else the first
 * membership. `newestFirst` is only needed when there's more than one team
 * and nothing saved matches.
 */
export function pickActiveTeamId(
  memberTeamIds: string[],
  stored: string | null,
  newestFirst: string[] = []
): string | null {
  if (memberTeamIds.length === 0) return null;
  if (stored && memberTeamIds.includes(stored)) return stored;
  return newestFirst.find((id) => memberTeamIds.includes(id)) ?? memberTeamIds[0];
}
