import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { computeAttentionItems } from "@/lib/attentionCenter";
import type { RosterAthlete, StatEntry } from "@/types";

// "Today" for every test. Entry dates are offsets from this.
const NOW = new Date("2026-07-20T12:00:00Z");

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
});

afterEach(() => {
  vi.useRealTimers();
});

function isoDaysAgo(daysAgo: number) {
  const date = new Date(NOW);
  date.setUTCDate(date.getUTCDate() - daysAgo);
  return date.toISOString().slice(0, 10);
}

/** Scores 100 on the readiness formula. */
function stat(daysAgo: number, overrides: Partial<StatEntry> = {}): StatEntry {
  return {
    date: isoDaysAgo(daysAgo),
    vertical: "",
    approach: "",
    weight: "",
    pullups: "",
    sleep: 9,
    energy: 10,
    stress: 0,
    soreness: 0,
    kneePain: 0,
    shoulderPain: 0,
    lowerBackPain: 0,
    anklePain: 0,
    motivation: 10,
    ...overrides
  };
}

function athlete(userId: string, displayName = userId): RosterAthlete {
  return {
    userId,
    displayName,
    joinedAt: "2026-01-01T00:00:00Z",
    recovery: 80,
    recoveryLabel: "Good",
    lastCheckIn: null,
    needsCheckIn: false,
    lastActiveAt: null
  };
}

/** Three consecutive daily check-ins ending today, oldest first. */
const threeDays = (overrides: Partial<StatEntry>) => [
  stat(2, overrides),
  stat(1, overrides),
  stat(0, overrides)
];

const active = (...ids: string[]) => Object.fromEntries(ids.map((id) => [id, 3]));

describe("computeAttentionItems: pain streaks", () => {
  it("flags pain of 4+ on three consecutive days as high priority", () => {
    const items = computeAttentionItems(
      [athlete("a", "Ava")],
      { a: threeDays({ kneePain: 4 }) },
      active("a"),
      {}
    );

    expect(items).toEqual([
      {
        id: "a-pain",
        userId: "a",
        displayName: "Ava",
        priority: "high",
        reason: "Reported knee pain 3 days running",
        action: "Check in",
        signalDate: isoDaysAgo(0)
      }
    ]);
  });

  it("ignores pain of 3 or below", () => {
    expect(computeAttentionItems([athlete("a")], { a: threeDays({ kneePain: 3 }) }, active("a"), {})).toEqual([]);
  });

  it("needs all of the last three check-ins to be at the threshold", () => {
    const history = [stat(2, { kneePain: 6 }), stat(1, { kneePain: 2 }), stat(0, { kneePain: 6 })];
    expect(computeAttentionItems([athlete("a")], { a: history }, active("a"), {})).toEqual([]);
  });

  it("needs three check-ins on distinct consecutive calendar days", () => {
    const gap = [stat(3, { kneePain: 6 }), stat(1, { kneePain: 6 }), stat(0, { kneePain: 6 })];
    const sameDay = [stat(1, { kneePain: 6 }), stat(0, { kneePain: 6 }), stat(0, { kneePain: 6 })];
    const two = [stat(1, { kneePain: 6 }), stat(0, { kneePain: 6 })];

    for (const history of [gap, sameDay, two]) {
      expect(computeAttentionItems([athlete("a")], { a: history }, active("a"), {})).toEqual([]);
    }
  });

  it("only looks at the most recent three check-ins", () => {
    const history = [stat(3, { kneePain: 0 }), stat(2, { kneePain: 5 }), stat(1, { kneePain: 5 }), stat(0, { kneePain: 5 })];
    const items = computeAttentionItems([athlete("a")], { a: history }, active("a"), {});
    expect(items.map((item) => item.id)).toEqual(["a-pain"]);
  });

  it("joins several body parts naturally", () => {
    const two = computeAttentionItems(
      [athlete("a")],
      { a: threeDays({ kneePain: 5, anklePain: 5 }) },
      active("a"),
      {}
    );
    expect(two[0].reason).toBe("Reported knee and ankle pain 3 days running");

    const three = computeAttentionItems(
      [athlete("a")],
      { a: threeDays({ kneePain: 5, shoulderPain: 5, anklePain: 5 }) },
      active("a"),
      {}
    );
    expect(three[0].reason).toBe("Reported knee, shoulder, and ankle pain 3 days running");
  });

  it("ignores entries with no date", () => {
    const history = [stat(2, { kneePain: 6 }), stat(1, { kneePain: 6 }), stat(0, { kneePain: 6, date: "" })];
    expect(computeAttentionItems([athlete("a")], { a: history }, active("a"), {})).toEqual([]);
  });
});

describe("computeAttentionItems: readiness drop", () => {
  // Stress 10 and soreness 10 each cost exactly 10 readiness points, so a
  // "bad" entry scores 80 and a normal one 100. Soreness 9 scores 81.
  const bad = { stress: 10, soreness: 10 };
  const lastWeek = (overrides: Partial<StatEntry>) => [stat(3, overrides), stat(2, overrides), stat(1, overrides)];
  const weekBefore = () => [stat(10), stat(9), stat(8)];

  it("flags a rolling 7-day drop of 20+ points versus the prior week", () => {
    const items = computeAttentionItems(
      [athlete("a", "Ava")],
      { a: [...weekBefore(), ...lastWeek(bad)] },
      active("a"),
      {}
    );

    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({
      id: "a-readiness-drop",
      priority: "high",
      reason: "Readiness dropped 20 points versus last week",
      action: "Review workload"
    });
  });

  it("does not flag a drop of 19", () => {
    const items = computeAttentionItems(
      [athlete("a")],
      { a: [...weekBefore(), ...lastWeek({ stress: 10, soreness: 9 })] },
      active("a"),
      {}
    );
    expect(items).toEqual([]);
  });

  it("does not flag improving or flat readiness", () => {
    const improving = [...[stat(10, bad), stat(9, bad), stat(8, bad)], ...lastWeek({})];
    expect(computeAttentionItems([athlete("a")], { a: improving }, active("a"), {})).toEqual([]);
    expect(computeAttentionItems([athlete("a")], { a: [...weekBefore(), ...lastWeek({})] }, active("a"), {})).toEqual([]);
  });

  it("needs at least two check-ins in each week", () => {
    const thinRecent = [...weekBefore(), stat(1, bad)];
    const thinPrior = [stat(9), ...lastWeek(bad)];

    expect(computeAttentionItems([athlete("a")], { a: thinRecent }, active("a"), {})).toEqual([]);
    expect(computeAttentionItems([athlete("a")], { a: thinPrior }, active("a"), {})).toEqual([]);
  });

  it("ignores check-ins older than 14 days", () => {
    const stale = [stat(20), stat(19), stat(18), ...lastWeek(bad)];
    expect(computeAttentionItems([athlete("a")], { a: stale }, active("a"), {})).toEqual([]);
  });
});

describe("computeAttentionItems: workouts and PRs", () => {
  it("flags no completed workouts in the last 7 days", () => {
    const [item] = computeAttentionItems([athlete("a", "Ava")], {}, { a: 0 }, {});
    expect(item).toMatchObject({
      id: "a-missed-workouts",
      priority: "medium",
      reason: "No completed workouts in the last 7 days",
      action: "Send reminder"
    });
  });

  it("treats an athlete missing from the session counts as zero workouts", () => {
    const [item] = computeAttentionItems([athlete("a")], {}, {}, {});
    expect(item.reason).toBe("No completed workouts in the last 7 days");
  });

  it("flags a single completed workout differently and stops at two", () => {
    expect(computeAttentionItems([athlete("a")], {}, { a: 1 }, {})[0].reason).toBe(
      "Only 1 completed workout in the last 7 days"
    );
    expect(computeAttentionItems([athlete("a")], {}, { a: 2 }, {})).toEqual([]);
  });

  it("celebrates a recent PR with a positive item using the first PR", () => {
    const [item] = computeAttentionItems(
      [athlete("a", "Ava")],
      {},
      active("a"),
      {
        a: [
          { exercise: "Vertical Jump", date: "2026-07-19T10:00:00Z" },
          { exercise: "Back Squat", date: "2026-07-15T10:00:00Z" }
        ]
      }
    );

    expect(item).toEqual({
      id: "a-new-pr",
      userId: "a",
      displayName: "Ava",
      priority: "positive",
      reason: "New PR: Vertical Jump",
      action: "Recognize achievement",
      signalDate: "2026-07-19T10:00:00Z"
    });
  });

  it("returns nothing for an empty roster", () => {
    expect(computeAttentionItems([], {}, {}, {})).toEqual([]);
  });
});

describe("computeAttentionItems: ranking", () => {
  it("sorts high, then medium, then positive, regardless of roster order", () => {
    const roster = [athlete("pr"), athlete("idle"), athlete("hurt")];
    const items = computeAttentionItems(
      roster,
      { hurt: threeDays({ shoulderPain: 6 }) },
      { pr: 4, idle: 0, hurt: 4 },
      { pr: [{ exercise: "Back Squat", date: "2026-07-19T00:00:00Z" }] }
    );

    expect(items.map((item) => [item.userId, item.priority])).toEqual([
      ["hurt", "high"],
      ["idle", "medium"],
      ["pr", "positive"]
    ]);
  });

  it("puts the most recent signal first within a tier", () => {
    const history = (daysAgo: number) => [
      stat(daysAgo + 2, { kneePain: 6 }),
      stat(daysAgo + 1, { kneePain: 6 }),
      stat(daysAgo, { kneePain: 6 })
    ];
    const items = computeAttentionItems(
      [athlete("older"), athlete("newer")],
      { older: history(3), newer: history(0) },
      active("older", "newer"),
      {}
    );

    expect(items.map((item) => item.userId)).toEqual(["newer", "older"]);
  });

  it("sorts items without a signal date after dated ones in the same tier", () => {
    const items = computeAttentionItems(
      [athlete("nodata"), athlete("dated")],
      { dated: [stat(0)] },
      { nodata: 0, dated: 0 },
      {}
    );
    expect(items.map((item) => item.userId)).toEqual(["dated", "nodata"]);
  });

  it("can return several items for one athlete", () => {
    const items = computeAttentionItems(
      [athlete("a")],
      { a: threeDays({ kneePain: 6 }) },
      { a: 0 },
      { a: [{ exercise: "Broad Jump", date: "2026-07-20T00:00:00Z" }] }
    );
    expect(items.map((item) => item.id)).toEqual(["a-pain", "a-missed-workouts", "a-new-pr"]);
  });
});
