import { describe, expect, it } from "vitest";

import {
  DAILY_SLIDERS,
  PAIN_SLIDERS,
  applyCheckIn,
  checkedInToday,
  initialCheckIn,
  stepSleep
} from "@/lib/dailyCheckIn";
import { calculateRecovery } from "@/lib/recovery";
import type { StatEntry } from "@/types";

const emptyStats: StatEntry = {
  date: "", vertical: "", approach: "", weight: "", pullups: "", sleep: "", energy: "", stress: "",
  soreness: "", kneePain: "", shoulderPain: "", lowerBackPain: "", anklePain: "", motivation: ""
};

const previous = {
  ...emptyStats,
  date: "2026-10-01",
  vertical: 24,
  approach: 120,
  weight: 150,
  pullups: 8,
  sleep: 7.5,
  energy: 6,
  stress: 4,
  motivation: 8,
  soreness: 5,
  kneePain: 6,
  shoulderPain: 2,
  lowerBackPain: 0,
  anklePain: 1
};

describe("check-in fields", () => {
  it("cover exactly the daily fields, split into everyday and pain", () => {
    expect(DAILY_SLIDERS.map((f) => f.key)).toEqual(["energy", "stress", "motivation", "soreness"]);
    expect(PAIN_SLIDERS.map((f) => f.key)).toEqual(["kneePain", "shoulderPain", "lowerBackPain", "anklePain"]);
    for (const field of [...DAILY_SLIDERS, ...PAIN_SLIDERS]) {
      expect([field.min, field.max]).toEqual([0, 10]);
    }
  });
});

describe("initialCheckIn", () => {
  it("starts from yesterday's everyday answers so a same-as-usual day is one tap", () => {
    const start = initialCheckIn(previous);
    expect(start).toMatchObject({ sleep: 7.5, energy: 6, stress: 4, motivation: 8, soreness: 5 });
  });

  it("always starts pain at 0, never yesterday's pain", () => {
    expect(initialCheckIn(previous)).toMatchObject({ kneePain: 0, shoulderPain: 0, lowerBackPain: 0, anklePain: 0 });
  });

  it("uses sensible middles for a first check-in", () => {
    expect(initialCheckIn(emptyStats)).toEqual({
      sleep: 8, energy: 7, stress: 3, motivation: 7, soreness: 3,
      kneePain: 0, shoulderPain: 0, lowerBackPain: 0, anklePain: 0
    });
  });
});

describe("applyCheckIn", () => {
  it("writes the answers and keeps the test-day numbers as they were", () => {
    const answers = { ...initialCheckIn(previous), energy: 9, kneePain: 3 };
    const entry = applyCheckIn(previous, answers, { painOpen: true });
    expect(entry).toMatchObject({ vertical: 24, approach: 120, weight: 150, pullups: 8, energy: 9, kneePain: 3 });
  });

  it("saves pain as 0 when 'Anything hurting?' was never opened", () => {
    const answers = { ...initialCheckIn(previous), kneePain: 7 };
    expect(applyCheckIn(previous, answers, { painOpen: false })).toMatchObject({
      kneePain: 0, shoulderPain: 0, lowerBackPain: 0, anklePain: 0
    });
  });

  it("produces an entry the existing readiness score reads unchanged", () => {
    const entry = applyCheckIn(previous, { ...initialCheckIn(previous) }, { painOpen: false });
    const manual = { ...previous, kneePain: 0, shoulderPain: 0, lowerBackPain: 0, anklePain: 0 };
    expect(calculateRecovery(entry)).toBe(calculateRecovery(manual));
  });
});

describe("stepSleep", () => {
  it("moves in half hours and stays between 0 and 14", () => {
    expect(stepSleep(7.5, 1)).toBe(8);
    expect(stepSleep(7.5, -1)).toBe(7);
    expect(stepSleep(0, -1)).toBe(0);
    expect(stepSleep(14, 1)).toBe(14);
    expect(stepSleep(7.3, 1)).toBe(7.5);
    expect(stepSleep(7.3, -1)).toBe(7);
  });
});

describe("checkedInToday", () => {
  const now = new Date(2026, 9, 2, 12);
  it("is true when the last entry is today, in either stored date format", () => {
    expect(checkedInToday([{ date: "2026-10-02" }], now)).toBe(true);
    expect(checkedInToday([{ date: "10/2/2026" }], now)).toBe(true);
  });
  it("is false for yesterday or no history", () => {
    expect(checkedInToday([{ date: "2026-10-01" }], now)).toBe(false);
    expect(checkedInToday([], now)).toBe(false);
  });
});
