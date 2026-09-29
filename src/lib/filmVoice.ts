import { TagDetailFields } from "@/components/film/tagMeta";
import { AttackDirection, BlockOutcome, FilmTagType, PassRating, SetType, SetZone } from "@/types";

/**
 * Deterministic voice-command parser for film tagging. No AI: a transcript
 * from the Web Speech API is tokenized and matched against a small
 * volleyball vocabulary plus the team roster's first names.
 */

export type VoiceRosterEntry = { userId: string; displayName: string };

export type VoiceParseResult =
  | {
      ok: true;
      tag: FilmTagType;
      details: Partial<TagDetailFields>;
      /** null means no name was heard, so the caller uses the currently selected athlete. */
      athleteId: string | null;
      note: string | null;
    }
  | { ok: false; heard: string };

const NUMBER_WORDS: Record<string, number> = {
  zero: 0,
  oh: 0,
  o: 0,
  one: 1,
  won: 1,
  two: 2,
  to: 2,
  too: 2,
  three: 3,
  tree: 3,
  free: 3,
  four: 4,
  for: 4,
  fore: 4,
  five: 5,
  six: 6,
  sex: 6
};

// Common speech-recognition mishearings of each tag word.
const TAG_WORDS: Record<string, FilmTagType> = {
  pass: "pass",
  passed: "pass",
  passing: "pass",
  past: "pass",
  set: "set",
  sets: "set",
  kill: "kill",
  kills: "kill",
  killed: "kill",
  keel: "kill",
  ace: "ace",
  aces: "ace",
  ice: "ace",
  block: "block",
  blocked: "block",
  blocks: "block",
  dig: "dig",
  dug: "dig",
  digs: "dig",
  error: "error",
  errors: "error",
  note: "note",
  notes: "note"
};

const SERVE_WORDS = new Set(["serve", "serving", "service", "served", "surf"]);

const SET_TYPE_WORDS: Record<string, SetType> = {
  slide: "slide",
  pipe: "pipe",
  quick: "quick",
  dump: "dump",
  backrow: "back_row"
};

const BLOCK_WORDS: Record<string, BlockOutcome> = {
  stuff: "stuff",
  stuffed: "stuff",
  touch: "touch",
  touched: "touch",
  tool: "tooled",
  tooled: "tooled",
  missed: "missed",
  miss: "missed"
};

const ATTACK_WORDS: Record<string, AttackDirection> = {
  line: "line",
  cross: "cross",
  crosscourt: "cross",
  seam: "seam",
  seem: "seam",
  tip: "tip",
  tipped: "tip",
  roll: "roll",
  rolled: "roll"
};

const FILLER_WORDS = new Set(["the", "a", "an", "and", "by", "from", "shot", "court", "down", "zone", "rating", "tag"]);

/** Words the parser already understands are never treated as an athlete name. */
function isVocabulary(token: string): boolean {
  return (
    FILLER_WORDS.has(token) ||
    SERVE_WORDS.has(token) ||
    token in TAG_WORDS ||
    token in SET_TYPE_WORDS ||
    token in BLOCK_WORDS ||
    token in ATTACK_WORDS
  );
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/back[\s-]+row/g, "backrow")
    .replace(/cross[\s-]+court/g, "crosscourt")
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

function numberFrom(token: string): number | null {
  if (/^\d$/.test(token)) return Number(token);
  return token in NUMBER_WORDS ? NUMBER_WORDS[token] : null;
}

function levenshtein(a: string, b: string): number {
  const row = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let previous = row[0];
    row[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const temp = row[j];
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, previous + (a[i - 1] === b[j - 1] ? 0 : 1));
      previous = temp;
    }
  }
  return row[b.length];
}

function firstName(displayName: string): string {
  return tokenize(displayName)[0] ?? "";
}

/**
 * Finds the roster athlete a token most likely names. Exact first-name
 * match wins; otherwise the closest name within a small edit distance
 * (1 for names up to 5 letters, 2 for longer ones), or a shared 4-letter prefix.
 */
export function matchAthlete(token: string, roster: VoiceRosterEntry[]): VoiceRosterEntry | null {
  if (token.length < 2) return null;
  let best: { entry: VoiceRosterEntry; score: number } | null = null;

  for (const entry of roster) {
    const name = firstName(entry.displayName);
    if (!name) continue;
    if (name === token) return entry;

    const distance = levenshtein(token, name);
    const allowed = Math.min(name.length, token.length) <= 5 ? 1 : 2;
    const prefix = name.length >= 4 && token.length >= 4 && name.slice(0, 4) === token.slice(0, 4);
    if (distance <= allowed || prefix) {
      const score = prefix ? Math.min(distance, allowed) : distance;
      if (!best || score < best.score) best = { entry, score };
    }
  }

  return best?.entry ?? null;
}

export function parseVoiceCommand(transcript: string, roster: VoiceRosterEntry[]): VoiceParseResult {
  const heard = transcript.trim();
  const tokens = tokenize(heard);
  if (tokens.length === 0) return { ok: false, heard };

  // Locate the tag word. "serve/service error" beats a bare "error".
  let tag: FilmTagType | null = null;
  let tagIndex = -1;
  for (let i = 0; i < tokens.length; i++) {
    if (SERVE_WORDS.has(tokens[i]) && (tokens[i + 1] === "error" || tokens[i + 1] === "errors")) {
      tag = "serve_error";
      tagIndex = i + 1;
      break;
    }
    const match = TAG_WORDS[tokens[i]];
    if (match && tag === null) {
      tag = match;
      tagIndex = i;
    }
  }

  // "stuff" on its own is unambiguous enough to mean a stuff block.
  if (tag === null && tokens.some((token) => BLOCK_WORDS[token] === "stuff")) {
    tag = "block";
    tagIndex = tokens.findIndex((token) => BLOCK_WORDS[token] === "stuff");
  }

  if (tag === null) return { ok: false, heard };

  if (tag === "note") {
    // Everything after "note" is the note, kept in the speaker's words.
    const words = heard.split(/\s+/);
    const noteStart = words.findIndex((word) => TAG_WORDS[word.toLowerCase().replace(/[^a-z]/g, "")] === "note");
    const beforeNote = tokens.slice(0, tagIndex);
    const athlete = beforeNote.map((token) => matchAthlete(token, roster)).find(Boolean) ?? null;
    const note = words.slice(noteStart + 1).join(" ").trim();
    return { ok: true, tag, details: {}, athleteId: athlete?.userId ?? null, note: note || null };
  }

  const details: Partial<TagDetailFields> = {};
  // When "stuff" itself stood in for the tag word, it is also the outcome.
  if (tag === "block" && BLOCK_WORDS[tokens[tagIndex]] === "stuff") details.block_outcome = "stuff";
  const rest = tokens.filter((_, i) => i !== tagIndex);
  let athleteId: string | null = null;

  for (let i = 0; i < rest.length; i++) {
    const token = rest[i];
    const number = numberFrom(token);

    if (tag === "pass" && number !== null && number <= 3 && details.pass_rating == null) {
      details.pass_rating = number as PassRating;
      continue;
    }

    if (tag === "set") {
      if (number !== null && number >= 1 && number <= 6 && !details.set_zone) {
        details.set_zone = String(number) as SetZone;
        continue;
      }
      if (SET_TYPE_WORDS[token] && !details.set_type) {
        details.set_type = SET_TYPE_WORDS[token];
        continue;
      }
    }

    if (tag === "block" && BLOCK_WORDS[token] && !details.block_outcome) {
      details.block_outcome = BLOCK_WORDS[token];
      continue;
    }

    if ((tag === "kill" || tag === "error" || tag === "ace") && ATTACK_WORDS[token] && !details.attack_direction) {
      details.attack_direction = ATTACK_WORDS[token];
      continue;
    }

    if (athleteId === null && number === null && !isVocabulary(token)) {
      const athlete = matchAthlete(token, roster);
      if (athlete) athleteId = athlete.userId;
    }
  }

  return { ok: true, tag, details, athleteId, note: null };
}
