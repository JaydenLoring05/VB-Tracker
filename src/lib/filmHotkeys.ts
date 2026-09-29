import {
  ATTACK_DIRECTION_LABELS,
  BLOCK_OUTCOMES,
  detailKindFor,
  SET_TYPE_LABELS,
  TAG_LABELS,
  TagDetailFields
} from "@/components/film/tagMeta";
import { AttackDirection, FilmTagType, PassRating, SetType, SetZone } from "@/types";

/**
 * Keyboard tagging for the film room, as a pure state machine. The
 * component feeds it key presses and gets back the next draft plus a list
 * of side effects to perform (save, seek, undo, ...). No DOM, no React.
 */

/** A tag the coach has started but not saved. The timestamp is captured when the tag key is pressed. */
export type TagDraft = {
  tag: FilmTagType;
  seconds: number;
  details: Partial<TagDetailFields>;
};

export type HotkeyInput = {
  key: string;
  code?: string;
  shiftKey?: boolean;
  ctrlKey?: boolean;
  metaKey?: boolean;
  altKey?: boolean;
};

export type HotkeyAction =
  | { type: "save"; draft: TagDraft }
  | { type: "cancel" }
  | { type: "focus_note" }
  | { type: "play_toggle" }
  | { type: "seek"; delta: number }
  | { type: "undo" }
  | { type: "athlete_cycle"; delta: 1 | -1 }
  | { type: "athlete_pick"; index: number }
  | { type: "toggle_help" };

export type HotkeyResult = {
  draft: TagDraft | null;
  actions: HotkeyAction[];
  /** True when the key meant something here, so the caller should preventDefault. */
  handled: boolean;
};

export const TAG_HOTKEYS: Record<string, FilmTagType> = {
  p: "pass",
  s: "set",
  k: "kill",
  a: "ace",
  b: "block",
  d: "dig",
  e: "error",
  v: "serve_error",
  n: "note"
};

export const SET_TYPE_HOTKEYS: Record<string, SetType> = {
  q: "quick",
  f: "4",
  i: "pipe",
  l: "slide"
};

export const ATTACK_HOTKEYS: Record<string, AttackDirection> = {
  l: "line",
  c: "cross",
  m: "seam",
  t: "tip",
  r: "roll"
};

/** Tags with no detail step save the moment their key is pressed. */
const INSTANT_TAGS = new Set<FilmTagType>(["dig", "serve_error"]);

function result(draft: TagDraft | null, actions: HotkeyAction[] = [], handled = true): HotkeyResult {
  return { draft, actions, handled };
}

function digitFrom(input: HotkeyInput): number | null {
  // event.code survives Alt / layout remapping (Alt+1 can produce "¡" on macOS).
  const codeMatch = input.code?.match(/^(?:Digit|Numpad)(\d)$/);
  if (codeMatch) return Number(codeMatch[1]);
  return /^\d$/.test(input.key) ? Number(input.key) : null;
}

function startTag(tag: FilmTagType, currentTime: number, actions: HotkeyAction[]): HotkeyResult {
  const draft: TagDraft = { tag, seconds: Math.max(0, Math.floor(currentTime)), details: {} };

  if (INSTANT_TAGS.has(tag)) return result(null, [...actions, { type: "save", draft }]);
  if (tag === "note") return result(draft, [...actions, { type: "focus_note" }]);
  return result(draft, actions);
}

/** Handles a detail key for the pending draft. Returns null when the key isn't a detail key for it. */
function applyDetailKey(draft: TagDraft, key: string, digit: number | null): HotkeyResult | null {
  const kind = detailKindFor(draft.tag);

  if (kind === "pass" && digit !== null && digit <= 3) {
    const saved: TagDraft = { ...draft, details: { ...draft.details, pass_rating: digit as PassRating } };
    return result(null, [{ type: "save", draft: saved }]);
  }

  if (kind === "set") {
    if (!draft.details.set_zone && digit !== null && digit >= 1 && digit <= 6) {
      return result({ ...draft, details: { ...draft.details, set_zone: String(digit) as SetZone } });
    }
    const setType = SET_TYPE_HOTKEYS[key];
    if (setType) {
      const saved: TagDraft = { ...draft, details: { ...draft.details, set_type: setType } };
      return result(null, [{ type: "save", draft: saved }]);
    }
  }

  if (kind === "block" && digit !== null && digit >= 1 && digit <= 4) {
    const saved: TagDraft = { ...draft, details: { ...draft.details, block_outcome: BLOCK_OUTCOMES[digit - 1] } };
    return result(null, [{ type: "save", draft: saved }]);
  }

  if (kind === "attack") {
    const direction = ATTACK_HOTKEYS[key];
    if (direction) {
      const saved: TagDraft = { ...draft, details: { ...draft.details, attack_direction: direction } };
      return result(null, [{ type: "save", draft: saved }]);
    }
  }

  return null;
}

export function handleHotkey(draft: TagDraft | null, input: HotkeyInput, currentTime: number): HotkeyResult {
  const key = input.key.length === 1 ? input.key.toLowerCase() : input.key;
  const digit = digitFrom(input);
  const modifier = input.ctrlKey || input.metaKey;

  // Undo works whether or not a draft is open; an open draft is simply dropped first.
  if (modifier && key === "z" && !input.shiftKey) {
    return result(null, draft ? [{ type: "cancel" }, { type: "undo" }] : [{ type: "undo" }]);
  }
  // Leave every other Ctrl/Cmd shortcut (copy, reload, ...) to the browser.
  if (modifier) return result(draft, [], false);

  if (input.altKey) {
    if (digit !== null && digit >= 1) return result(draft, [{ type: "athlete_pick", index: digit - 1 }]);
    return result(draft, [], false);
  }

  if (key === "Escape") {
    return draft ? result(null, [{ type: "cancel" }]) : result(null, [], false);
  }
  if (key === "Enter") {
    return draft ? result(null, [{ type: "save", draft }]) : result(null, [], false);
  }

  if (key === " " || input.code === "Space") return result(draft, [{ type: "play_toggle" }]);
  if (key === "ArrowLeft") return result(draft, [{ type: "seek", delta: input.shiftKey ? -1 : -5 }]);
  if (key === "ArrowRight") return result(draft, [{ type: "seek", delta: input.shiftKey ? 1 : 5 }]);
  if (key === "[") return result(draft, [{ type: "athlete_cycle", delta: -1 }]);
  if (key === "]") return result(draft, [{ type: "athlete_cycle", delta: 1 }]);
  if (key === "?") return result(draft, [{ type: "toggle_help" }]);

  if (draft) {
    const detail = applyDetailKey(draft, key, digit);
    if (detail) return detail;
  }

  const tag = TAG_HOTKEYS[key];
  if (tag) {
    // A new tag key while one is pending saves the pending tag with what it
    // has so far, which keeps fast tagging to a single keystroke per play.
    const carry: HotkeyAction[] = draft ? [{ type: "save", draft }] : [];
    return startTag(tag, currentTime, carry);
  }

  return result(draft, [], false);
}

/** The small on-screen hint for the pending key sequence, e.g. "Pass → rating? (0-3)". */
export function pendingHint(draft: TagDraft | null): string | null {
  if (!draft) return null;
  const label = TAG_LABELS[draft.tag];

  switch (detailKindFor(draft.tag)) {
    case "pass":
      return `${label} → rating? (0-3)`;
    case "set":
      if (!draft.details.set_zone) return `${label} → zone? (1-6)`;
      return draft.details.set_type
        ? `${label} · Zone ${draft.details.set_zone} · ${SET_TYPE_LABELS[draft.details.set_type]} → Enter`
        : `${label} · Zone ${draft.details.set_zone} → type? (Q/F/I/L) or Enter`;
    case "block":
      return `${label} → outcome? (1 stuff, 2 touch, 3 tooled, 4 missed)`;
    case "attack":
      return draft.details.attack_direction
        ? `${label} · ${ATTACK_DIRECTION_LABELS[draft.details.attack_direction]} → Enter`
        : `${label} → direction? (L/C/M/T/R)`;
    default:
      return draft.tag === "note" ? `${label} → type it, Enter to save` : `${label} → Enter to save`;
  }
}

/** Hotkeys must not fire while the coach is typing in a field. */
export function isTypingTarget(target: { tagName?: string; isContentEditable?: boolean } | null): boolean {
  if (!target) return false;
  if (target.isContentEditable) return true;
  const tag = target.tagName?.toUpperCase();
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
}

/** Grouped shortcut list for the "?" overlay. */
export const SHORTCUT_GROUPS: { title: string; items: [string, string][] }[] = [
  {
    title: "Tags",
    items: [
      ["P", "Pass"],
      ["S", "Set"],
      ["K", "Kill"],
      ["A", "Ace"],
      ["B", "Block"],
      ["D", "Dig (saves now)"],
      ["E", "Error"],
      ["V", "Serve error (saves now)"],
      ["N", "Note"]
    ]
  },
  {
    title: "Details",
    items: [
      ["0-3", "Pass rating (saves)"],
      ["1-6", "Set zone"],
      ["Q / F / I / L", "Set type: quick / four / pipe / slide (saves)"],
      ["1-4", "Block: stuff / touch / tooled / missed (saves)"],
      ["L / C / M / T / R", "Attack: line / cross / seam / tip / roll (saves)"],
      ["Enter", "Save now"],
      ["Esc", "Cancel"]
    ]
  },
  {
    title: "Athlete",
    items: [
      ["[ / ]", "Previous / next athlete"],
      ["Alt+1-9", "Pick athlete by roster order"]
    ]
  },
  {
    title: "Video",
    items: [
      ["Space", "Play / pause"],
      ["← / →", "Seek 5s"],
      ["Shift+← / →", "Seek 1s"],
      ["Ctrl+Z", "Undo last tag"],
      ["` (hold)", "Push-to-talk voice tag"],
      ["?", "Show / hide shortcuts"]
    ]
  }
];
