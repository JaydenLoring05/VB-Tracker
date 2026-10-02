import { describe, expect, it } from "vitest";

import {
  addDismissal,
  attentionDismissStorageKey,
  attentionMessage,
  dismissalKey,
  isDismissed,
  parseDismissals,
  removeDismissal,
  visibleItems
} from "@/lib/attentionActions";
import type { AttentionItem } from "@/lib/attentionCenter";

const NOW = new Date("2026-10-02T18:00:00Z");
const hoursAgo = (h: number) => new Date(NOW.getTime() - h * 3600 * 1000).toISOString();

function item(overrides: Partial<AttentionItem> = {}): AttentionItem {
  return {
    id: "u1-missed-workouts",
    userId: "u1",
    displayName: "Maya Lopez",
    priority: "medium",
    reason: "No completed workouts in the last 7 days",
    action: "Send reminder",
    signalDate: "2026-10-01",
    ...overrides
  };
}

describe("dismissals", () => {
  it("keys on the item and the date of its signal", () => {
    expect(dismissalKey(item())).toBe("u1-missed-workouts@2026-10-01");
    expect(attentionDismissStorageKey("t1")).toBe("nextrep-attention-cleared-t1");
  });

  it("hides a cleared item", () => {
    const cleared = addDismissal({}, item(), NOW);
    expect(isDismissed(item(), cleared, NOW)).toBe(true);
    expect(visibleItems([item(), item({ id: "u2-new-pr", userId: "u2" })], cleared, NOW).map((i) => i.id)).toEqual([
      "u2-new-pr"
    ]);
  });

  it("shows the item again when a newer signal arrives", () => {
    const cleared = addDismissal({}, item(), NOW);
    expect(isDismissed(item({ signalDate: "2026-10-02" }), cleared, NOW)).toBe(false);
  });

  it("brings a still-open item back after 3 days", () => {
    const cleared = { [dismissalKey(item())]: hoursAgo(71) };
    expect(isDismissed(item(), cleared, NOW)).toBe(true);
    expect(isDismissed(item(), { [dismissalKey(item())]: hoursAgo(73) }, NOW)).toBe(false);
  });

  it("undo removes the dismissal", () => {
    const cleared = addDismissal({}, item(), NOW);
    expect(removeDismissal(cleared, item())).toEqual({});
  });

  it("prunes entries older than two weeks when saving", () => {
    const old = { "old@2026-09-01": hoursAgo(15 * 24), "recent@2026-10-01": hoursAgo(24) };
    expect(Object.keys(addDismissal(old, item(), NOW)).sort()).toEqual([
      "recent@2026-10-01",
      "u1-missed-workouts@2026-10-01"
    ]);
  });

  it("parses stored data defensively", () => {
    expect(parseDismissals(null)).toEqual({});
    expect(parseDismissals("not json")).toEqual({});
    expect(parseDismissals("[1,2]")).toEqual({});
    expect(parseDismissals(JSON.stringify({ a: hoursAgo(1), b: 5, c: "nope" }))).toEqual({ a: hoursAgo(1) });
  });
});

describe("attentionMessage", () => {
  it("writes a reminder for missed workouts, using the first name", () => {
    const message = attentionMessage(item());
    expect(message).toMatch(/^Hey Maya,/);
    expect(message).toContain("missed some workouts");
  });

  it("writes a congratulations for a new PR, naming the exercise", () => {
    const message = attentionMessage(
      item({ id: "u1-new-pr", priority: "positive", reason: "New PR: Back Squat", action: "Recognize achievement" })
    );
    expect(message).toBe("Maya, congrats on your new PR in Back Squat! That's real work paying off. Keep it up.");
  });

  it("has no message for items handled by opening the athlete", () => {
    expect(attentionMessage(item({ id: "u1-pain", action: "Check in" }))).toBeNull();
    expect(attentionMessage(item({ id: "u1-needs-check-in", action: "Check in" }))).toBeNull();
  });

  it("falls back when the name is blank", () => {
    expect(attentionMessage(item({ displayName: "  " }))).toMatch(/^Hey there,/);
  });
});
