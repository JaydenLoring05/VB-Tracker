import { describe, expect, it } from "vitest";

import { statsHeadline } from "@/lib/statsHeadline";
import { StatEntry } from "@/types";

function entry(date: string, values: Partial<StatEntry>): StatEntry {
  return {
    date,
    vertical: "",
    approach: "",
    weight: "",
    pullups: "",
    sleep: "",
    energy: "",
    stress: "",
    soreness: "",
    kneePain: "",
    shoulderPain: "",
    lowerBackPain: "",
    anklePain: "",
    motivation: "",
    ...values
  };
}

function byKey(history: StatEntry[]) {
  return Object.fromEntries(statsHeadline(history).map((metric) => [metric.key, metric]));
}

describe("statsHeadline", () => {
  it("returns vertical, approach and pull-ups in that order", () => {
    expect(statsHeadline([]).map((metric) => metric.key)).toEqual(["vertical", "approach", "pullups"]);
  });

  it("has no values when nothing is logged", () => {
    for (const metric of statsHeadline([])) {
      expect(metric.value).toBeNull();
      expect(metric.change).toBeNull();
      expect(metric.since).toBeNull();
    }
  });

  it("uses the newest entry and the change since the first one", () => {
    const metrics = byKey([
      entry("9/1/2026", { vertical: 28, approach: 120, pullups: 8 }),
      entry("9/8/2026", { vertical: 29, approach: 121, pullups: 9 }),
      entry("9/15/2026", { vertical: 30.5, approach: 123, pullups: 7 })
    ]);

    expect(metrics.vertical).toMatchObject({ value: 30.5, change: 2.5, since: "9/1/2026" });
    expect(metrics.approach).toMatchObject({ value: 123, change: 3, since: "9/1/2026" });
    expect(metrics.pullups).toMatchObject({ value: 7, change: -1, since: "9/1/2026" });
  });

  it("skips blank entries for each metric on its own", () => {
    const metrics = byKey([
      entry("9/1/2026", { approach: 118 }),
      entry("9/8/2026", { vertical: 27 }),
      entry("9/15/2026", { vertical: 28, sleep: 8 }),
      entry("9/22/2026", { sleep: 7 })
    ]);

    expect(metrics.vertical).toMatchObject({ value: 28, change: 1, since: "9/8/2026" });
    expect(metrics.approach).toMatchObject({ value: 118, change: null, since: null });
    expect(metrics.pullups.value).toBeNull();
  });

  it("has no change with a single logged value", () => {
    const metrics = byKey([entry("9/1/2026", { vertical: 28 })]);

    expect(metrics.vertical).toMatchObject({ value: 28, change: null, since: null });
  });

  it("rounds away floating point noise in the change", () => {
    const metrics = byKey([entry("9/1/2026", { vertical: 28.1 }), entry("9/8/2026", { vertical: 28.3 })]);

    expect(metrics.vertical.change).toBe(0.2);
  });

  it("ignores non-finite values", () => {
    const metrics = byKey([
      entry("9/1/2026", { vertical: 27 }),
      entry("9/8/2026", { vertical: Number.NaN })
    ]);

    expect(metrics.vertical).toMatchObject({ value: 27, change: null });
  });
});
