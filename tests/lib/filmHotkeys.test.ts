import { describe, expect, it } from "vitest";

import { handleHotkey, HotkeyInput, isTypingTarget, pendingHint, TagDraft } from "@/lib/filmHotkeys";

const key = (k: string, extra: Partial<HotkeyInput> = {}): HotkeyInput => ({ key: k, ...extra });

/** Presses a sequence of keys starting from no draft, returning the final state and every action. */
function press(keys: HotkeyInput[], time = 42.7) {
  let draft: TagDraft | null = null;
  const actions = [];
  for (const input of keys) {
    const next = handleHotkey(draft, input, time);
    draft = next.draft;
    actions.push(...next.actions);
  }
  return { draft, actions };
}

describe("handleHotkey: tag keys", () => {
  it("captures the timestamp when the tag key is pressed, not when saved", () => {
    const first = handleHotkey(null, key("p"), 10.9);
    const second = handleHotkey(first.draft, key("3"), 99);
    expect(second.actions).toEqual([
      { type: "save", draft: { tag: "pass", seconds: 10, details: { pass_rating: 3 } } }
    ]);
  });

  it("saves dig and serve error immediately", () => {
    expect(press([key("d")]).actions).toEqual([{ type: "save", draft: { tag: "dig", seconds: 42, details: {} } }]);
    expect(press([key("V")]).actions[0]).toMatchObject({ type: "save", draft: { tag: "serve_error" } });
  });

  it("opens a note draft and asks for the note field", () => {
    const { draft, actions } = press([key("n")]);
    expect(draft?.tag).toBe("note");
    expect(actions).toEqual([{ type: "focus_note" }]);
  });

  it("saves the pending draft when a new tag key is pressed", () => {
    const { draft, actions } = press([key("k"), key("p")]);
    expect(actions).toEqual([{ type: "save", draft: { tag: "kill", seconds: 42, details: {} } }]);
    expect(draft?.tag).toBe("pass");
  });
});

describe("handleHotkey: detail keys", () => {
  it("pass: 0-3 rates and auto-saves", () => {
    expect(press([key("p"), key("0")]).actions[0]).toMatchObject({ draft: { details: { pass_rating: 0 } } });
    expect(press([key("p"), key("4")]).draft?.details).toEqual({});
  });

  it("set: zone then optional type", () => {
    const zoneOnly = press([key("s"), key("4")]);
    expect(zoneOnly.draft?.details).toEqual({ set_zone: "4" });
    expect(zoneOnly.actions).toEqual([]);

    const withType = press([key("s"), key("4"), key("l")]);
    expect(withType.actions).toEqual([
      { type: "save", draft: { tag: "set", seconds: 42, details: { set_zone: "4", set_type: "slide" } } }
    ]);
  });

  it("set: Q/F/I map to quick/four/pipe", () => {
    expect(press([key("s"), key("1"), key("q")]).actions[0]).toMatchObject({ draft: { details: { set_type: "quick" } } });
    expect(press([key("s"), key("2"), key("f")]).actions[0]).toMatchObject({ draft: { details: { set_type: "4" } } });
    expect(press([key("s"), key("6"), key("i")]).actions[0]).toMatchObject({ draft: { details: { set_type: "pipe" } } });
  });

  it("block: 1-4 map to stuff/touch/tooled/missed", () => {
    const outcomes = ["stuff", "touch", "tooled", "missed"];
    outcomes.forEach((outcome, i) => {
      expect(press([key("b"), key(String(i + 1))]).actions[0]).toMatchObject({
        draft: { tag: "block", details: { block_outcome: outcome } }
      });
    });
  });

  it("kill/error/ace: L/C/M/T/R map to attack direction", () => {
    const pairs: [string, string][] = [
      ["l", "line"],
      ["c", "cross"],
      ["m", "seam"],
      ["t", "tip"],
      ["r", "roll"]
    ];
    for (const tag of ["k", "e", "a"]) {
      for (const [k, direction] of pairs) {
        expect(press([key(tag), key(k)]).actions[0]).toMatchObject({ draft: { details: { attack_direction: direction } } });
      }
    }
  });

  it("Enter saves early and Esc cancels", () => {
    expect(press([key("s"), key("3"), key("Enter")]).actions).toEqual([
      { type: "save", draft: { tag: "set", seconds: 42, details: { set_zone: "3" } } }
    ]);
    const cancelled = press([key("k"), key("Escape")]);
    expect(cancelled.draft).toBeNull();
    expect(cancelled.actions).toEqual([{ type: "cancel" }]);
  });

  it("Enter and Esc do nothing without a draft", () => {
    expect(handleHotkey(null, key("Enter"), 0).handled).toBe(false);
    expect(handleHotkey(null, key("Escape"), 0).handled).toBe(false);
  });
});

describe("handleHotkey: athlete and video keys", () => {
  it("[ and ] cycle athletes, Alt+number picks by roster order", () => {
    expect(press([key("[")]).actions).toEqual([{ type: "athlete_cycle", delta: -1 }]);
    expect(press([key("]")]).actions).toEqual([{ type: "athlete_cycle", delta: 1 }]);
    expect(press([key("¡", { altKey: true, code: "Digit1" })]).actions).toEqual([{ type: "athlete_pick", index: 0 }]);
    expect(press([key("9", { altKey: true })]).actions).toEqual([{ type: "athlete_pick", index: 8 }]);
  });

  it("Alt+number keeps the pending draft open", () => {
    const { draft } = press([key("p"), key("2", { altKey: true, code: "Digit2" })]);
    expect(draft?.tag).toBe("pass");
  });

  it("Space toggles play; arrows seek 5s, Shift+arrows 1s", () => {
    expect(press([key(" ", { code: "Space" })]).actions).toEqual([{ type: "play_toggle" }]);
    expect(press([key("ArrowLeft")]).actions).toEqual([{ type: "seek", delta: -5 }]);
    expect(press([key("ArrowRight")]).actions).toEqual([{ type: "seek", delta: 5 }]);
    expect(press([key("ArrowLeft", { shiftKey: true })]).actions).toEqual([{ type: "seek", delta: -1 }]);
    expect(press([key("ArrowRight", { shiftKey: true })]).actions).toEqual([{ type: "seek", delta: 1 }]);
  });

  it("Ctrl+Z / Cmd+Z undo, dropping any open draft first", () => {
    expect(press([key("z", { ctrlKey: true })]).actions).toEqual([{ type: "undo" }]);
    expect(press([key("k"), key("z", { metaKey: true })]).actions).toEqual([{ type: "cancel" }, { type: "undo" }]);
  });

  it("leaves other Ctrl shortcuts to the browser", () => {
    expect(handleHotkey(null, key("c", { ctrlKey: true }), 0).handled).toBe(false);
    expect(handleHotkey(null, key("p", { ctrlKey: true }), 0).draft).toBeNull();
  });

  it("? toggles the shortcut overlay", () => {
    expect(press([key("?", { shiftKey: true })]).actions).toEqual([{ type: "toggle_help" }]);
  });

  it("ignores unrelated keys", () => {
    expect(handleHotkey(null, key("x"), 0)).toEqual({ draft: null, actions: [], handled: false });
  });
});

describe("pendingHint", () => {
  it("describes what the next key should be", () => {
    expect(pendingHint(null)).toBeNull();
    expect(pendingHint({ tag: "pass", seconds: 0, details: {} })).toBe("Pass → rating? (0-3)");
    expect(pendingHint({ tag: "set", seconds: 0, details: {} })).toBe("Set → zone? (1-6)");
    expect(pendingHint({ tag: "set", seconds: 0, details: { set_zone: "4" } })).toContain("Zone 4 → type?");
    expect(pendingHint({ tag: "kill", seconds: 0, details: {} })).toContain("direction?");
    expect(pendingHint({ tag: "block", seconds: 0, details: {} })).toContain("outcome?");
  });
});

describe("isTypingTarget", () => {
  it("is true for inputs, textareas, selects and contenteditable", () => {
    expect(isTypingTarget({ tagName: "INPUT" })).toBe(true);
    expect(isTypingTarget({ tagName: "textarea" })).toBe(true);
    expect(isTypingTarget({ tagName: "SELECT" })).toBe(true);
    expect(isTypingTarget({ tagName: "DIV", isContentEditable: true })).toBe(true);
    expect(isTypingTarget({ tagName: "BUTTON" })).toBe(false);
    expect(isTypingTarget(null)).toBe(false);
  });
});
