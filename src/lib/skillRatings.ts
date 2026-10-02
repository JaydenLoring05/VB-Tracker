/**
 * Self-rated volleyball skills, drawn as a six-point radar on the Stats page.
 * Pure helpers only: the Supabase read/write lives in useSkillRatings.
 */

export const SKILL_MIN = 1;
export const SKILL_MAX = 5;

export const SKILL_AXES = [
  { key: "power", label: "Power", hint: "How hard you hit and serve" },
  { key: "jumping", label: "Jumping", hint: "Approach touch and block touch" },
  { key: "stamina", label: "Stamina", hint: "Same level in set five as set one" },
  { key: "gameSense", label: "Game Sense", hint: "Reading the play and shot choice" },
  { key: "technique", label: "Technique", hint: "Passing, setting and ball control" },
  { key: "speed", label: "Speed", hint: "First step, transition and arm speed" }
] as const;

export type SkillKey = (typeof SKILL_AXES)[number]["key"];

/** null = not rated yet. */
export type SkillRatings = Record<SkillKey, number | null>;

export const emptySkillRatings: SkillRatings = {
  power: null,
  jumping: null,
  stamina: null,
  gameSense: null,
  technique: null,
  speed: null
};

/** A whole number from SKILL_MIN to SKILL_MAX, or null when it isn't a usable rating. */
export function clampRating(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value !== "number" && typeof value !== "string") return null;

  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return null;

  return Math.min(SKILL_MAX, Math.max(SKILL_MIN, Math.round(parsed)));
}

/**
 * Turns whatever is stored in performance_profiles.skill_ratings into a full,
 * valid set. Unknown keys are dropped, bad values become "not rated".
 */
export function normalizeSkillRatings(raw: unknown): SkillRatings {
  const source = raw && typeof raw === "object" && !Array.isArray(raw) ? (raw as Record<string, unknown>) : {};
  const ratings = { ...emptySkillRatings };

  for (const { key } of SKILL_AXES) {
    ratings[key] = clampRating(source[key]);
  }

  return ratings;
}

export function hasAnyRating(ratings: SkillRatings) {
  return SKILL_AXES.some(({ key }) => ratings[key] != null);
}

/** Rows for the radar chart. An unrated skill sits at the centre (0). */
export function skillRadarData(ratings: SkillRatings) {
  return SKILL_AXES.map(({ key, label }) => ({
    key,
    skill: label,
    value: ratings[key] ?? 0
  }));
}

/** Total out of the maximum possible, counting only the skills rated so far. */
export function skillTotal(ratings: SkillRatings) {
  const rated = SKILL_AXES.filter(({ key }) => ratings[key] != null);

  return {
    total: rated.reduce((sum, { key }) => sum + (ratings[key] ?? 0), 0),
    rated: rated.length,
    max: SKILL_AXES.length * SKILL_MAX
  };
}

/** The highest and lowest rated skills, or null until at least two differ. */
export function skillExtremes(ratings: SkillRatings) {
  const rated = SKILL_AXES.filter(({ key }) => ratings[key] != null).map(({ key, label }) => ({
    label,
    value: ratings[key] as number
  }));

  if (rated.length < 2) return null;

  const strongest = rated.reduce((best, current) => (current.value > best.value ? current : best));
  const weakest = rated.reduce((worst, current) => (current.value < worst.value ? current : worst));

  if (strongest.value === weakest.value) return null;

  return { strongest: strongest.label, weakest: weakest.label };
}
