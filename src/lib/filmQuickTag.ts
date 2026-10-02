import { BlockOutcome, FilmResult, FilmTagType, PassRating } from "@/types";

/** The six skills a coach picks from in the three-tap flow. */
export type QuickSkill = "serve" | "pass" | "set" | "attack" | "block" | "dig";

export type ResultTone = "good" | "neutral" | "bad";

export type QuickResult = { value: FilmResult; label: string; tone: ResultTone };

export const QUICK_SKILLS: { value: QuickSkill; label: string }[] = [
  { value: "serve", label: "Serve" },
  { value: "pass", label: "Pass" },
  { value: "set", label: "Set" },
  { value: "attack", label: "Attack" },
  { value: "block", label: "Block" },
  { value: "dig", label: "Dig" }
];

/** Results for each skill, best first. Passes use the 0-3 passing scale. */
export const QUICK_RESULTS: Record<QuickSkill, QuickResult[]> = {
  serve: [
    { value: "ace", label: "Ace", tone: "good" },
    { value: "in", label: "In", tone: "neutral" },
    { value: "error", label: "Error", tone: "bad" }
  ],
  pass: [
    { value: "3", label: "3", tone: "good" },
    { value: "2", label: "2", tone: "neutral" },
    { value: "1", label: "1", tone: "neutral" },
    { value: "0", label: "0", tone: "bad" }
  ],
  set: [
    { value: "good", label: "Good", tone: "good" },
    { value: "ok", label: "Hittable", tone: "neutral" },
    { value: "error", label: "Error", tone: "bad" }
  ],
  attack: [
    { value: "kill", label: "Kill", tone: "good" },
    { value: "in_play", label: "In play", tone: "neutral" },
    { value: "error", label: "Error", tone: "bad" }
  ],
  block: [
    { value: "stuff", label: "Stuff", tone: "good" },
    { value: "touch", label: "Touch", tone: "neutral" },
    { value: "error", label: "Error", tone: "bad" }
  ],
  dig: [
    { value: "up", label: "Up", tone: "good" },
    { value: "error", label: "Error", tone: "bad" }
  ]
};

export type QuickTagRow = {
  tag: FilmTagType;
  result: FilmResult;
  pass_rating: PassRating | null;
  block_outcome: BlockOutcome | null;
};

/**
 * Turns a skill and result into the film_tags columns. The skill is stored
 * as the tag; pass ratings and block outcomes are also written to their V36
 * columns so existing screens and film stats read them the same way.
 * Returns null for a result that doesn't belong to the skill.
 */
export function buildQuickTag(skill: QuickSkill, result: FilmResult): QuickTagRow | null {
  if (!QUICK_RESULTS[skill].some((option) => option.value === result)) return null;

  let pass_rating: PassRating | null = null;
  let block_outcome: BlockOutcome | null = null;

  if (skill === "pass") pass_rating = Number(result) as PassRating;
  // A block "Error" could be tooled or a net touch, so it sets no outcome.
  if (skill === "block" && result !== "error") block_outcome = result as BlockOutcome;

  return { tag: skill, result, pass_rating, block_outcome };
}

const SKILL_TAGS = new Set<FilmTagType>(QUICK_SKILLS.map((skill) => skill.value));

/** Label for a saved tag's result, such as "Kill" or "In play", or null when it has none. */
export function resultLabel(tag: FilmTagType, result: FilmResult | null | undefined): string | null {
  if (!result || !SKILL_TAGS.has(tag)) return null;
  return QUICK_RESULTS[tag as QuickSkill].find((option) => option.value === result)?.label ?? null;
}

/** Seconds to start a clip before its tag, so the athlete sees the play build up. */
export const CLIP_LEAD_SECONDS = 5;

export function clipStart(seconds: number): number {
  return Math.max(0, seconds - CLIP_LEAD_SECONDS);
}

export type ClipGroup<T> = { filmId: string; title: string; createdAt: string; clips: T[] };

/**
 * Groups an athlete's tags by film for "My clips": newest film first,
 * clips in the order they happen in the video.
 */
export function groupClipsByFilm<
  T extends { film_id: string; seconds: number; team_film: { title: string; created_at: string } | null }
>(clips: T[]): ClipGroup<T>[] {
  const groups = new Map<string, ClipGroup<T>>();

  for (const clip of clips) {
    // A tag whose film can't be read (deleted mid-load) has nothing to play.
    if (!clip.team_film) continue;
    let group = groups.get(clip.film_id);
    if (!group) {
      group = { filmId: clip.film_id, title: clip.team_film.title, createdAt: clip.team_film.created_at, clips: [] };
      groups.set(clip.film_id, group);
    }
    group.clips.push(clip);
  }

  const result = [...groups.values()];
  for (const group of result) group.clips.sort((a, b) => a.seconds - b.seconds);
  return result.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
