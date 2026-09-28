import { AttackDirection, BlockOutcome, FilmTagDetails, FilmTagType, SetType, SetZone } from "@/types";

export const TAG_TYPES: FilmTagType[] = ["pass", "set", "kill", "ace", "block", "dig", "error", "serve_error", "note"];

export const TAG_LABELS: Record<FilmTagType, string> = {
  pass: "Pass",
  kill: "Kill",
  error: "Error",
  block: "Block",
  dig: "Dig",
  ace: "Ace",
  serve_error: "Serve Error",
  set: "Set",
  note: "Note"
};

export const PASS_RATINGS = [0, 1, 2, 3] as const;
export const SET_ZONES: SetZone[] = ["1", "2", "3", "4", "5", "6"];
export const SET_TYPES: SetType[] = ["4", "5", "slide", "pipe", "back_row", "quick", "dump"];
export const BLOCK_OUTCOMES: BlockOutcome[] = ["stuff", "touch", "tooled", "missed"];
export const ATTACK_DIRECTIONS: AttackDirection[] = ["line", "cross", "seam", "tip", "roll"];

export const SET_TYPE_LABELS: Record<SetType, string> = {
  "4": "Four",
  "5": "Five",
  slide: "Slide",
  pipe: "Pipe",
  back_row: "Back Row",
  quick: "Quick",
  dump: "Dump"
};

export const BLOCK_OUTCOME_LABELS: Record<BlockOutcome, string> = {
  stuff: "Stuff",
  touch: "Touch",
  tooled: "Tooled",
  missed: "Missed"
};

export const ATTACK_DIRECTION_LABELS: Record<AttackDirection, string> = {
  line: "Line",
  cross: "Cross",
  seam: "Seam",
  tip: "Tip",
  roll: "Roll"
};

/** Which contextual detail fields a tag type collects. */
export type DetailKind = "pass" | "set" | "block" | "attack" | "none";

export function detailKindFor(tag: FilmTagType): DetailKind {
  switch (tag) {
    case "pass":
      return "pass";
    case "set":
      return "set";
    case "block":
      return "block";
    case "kill":
    case "error":
    case "ace":
      return "attack";
    default:
      return "none";
  }
}

export type TagDetailFields = Omit<FilmTagDetails, "athlete_id">;

export const EMPTY_DETAILS: TagDetailFields = {
  pass_rating: null,
  set_zone: null,
  set_type: null,
  block_outcome: null,
  attack_direction: null
};

/** Drops any detail that doesn't belong to the tag type, so a stale set zone never rides along on a kill. */
export function detailsForTag(tag: FilmTagType, details: Partial<TagDetailFields>): TagDetailFields {
  const kind = detailKindFor(tag);
  return {
    pass_rating: kind === "pass" ? details.pass_rating ?? null : null,
    set_zone: kind === "set" ? details.set_zone ?? null : null,
    set_type: kind === "set" ? details.set_type ?? null : null,
    block_outcome: kind === "block" ? details.block_outcome ?? null : null,
    attack_direction: kind === "attack" ? details.attack_direction ?? null : null
  };
}

/**
 * One-line summary such as "Pass · 3 · Jayden" or "Set · Zone 4 · Slide".
 * The athlete name goes last and is omitted when unknown.
 */
export function describeTag(
  tag: { tag: FilmTagType } & Partial<TagDetailFields>,
  athleteName?: string | null
): string {
  const parts: string[] = [TAG_LABELS[tag.tag]];
  const kind = detailKindFor(tag.tag);

  if (kind === "pass" && tag.pass_rating != null) parts.push(String(tag.pass_rating));
  if (kind === "set") {
    if (tag.set_zone) parts.push(`Zone ${tag.set_zone}`);
    if (tag.set_type) parts.push(SET_TYPE_LABELS[tag.set_type]);
  }
  if (kind === "block" && tag.block_outcome) parts.push(BLOCK_OUTCOME_LABELS[tag.block_outcome]);
  if (kind === "attack" && tag.attack_direction) parts.push(ATTACK_DIRECTION_LABELS[tag.attack_direction]);
  if (athleteName) parts.push(athleteName);

  return parts.join(" · ");
}
