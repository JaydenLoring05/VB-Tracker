import { describe, expect, it } from "vitest";

import { computeXp, LEVELS, levelProgress, XP_PER_PR, XP_PER_REFERRAL, XP_PER_WORKOUT } from "@/lib/progression";

describe("computeXp (G-02)", () => {
  it("gives XP for each workout and each PR", () => {
    expect(computeXp({ workouts: 3, prs: 2 })).toBe(3 * XP_PER_WORKOUT + 2 * XP_PER_PR);
    expect(computeXp({ workouts: 0, prs: 0 })).toBe(0);
  });

  it("adds XP for each friend who signed up with your code (RF-01)", () => {
    expect(computeXp({ workouts: 1, prs: 0, referrals: 2 })).toBe(XP_PER_WORKOUT + 2 * XP_PER_REFERRAL);
  });

  it("never goes negative or fractional", () => {
    expect(computeXp({ workouts: -2, prs: 1.7 })).toBe(XP_PER_PR);
  });
});

describe("levelProgress", () => {
  it("starts every athlete as a Rookie", () => {
    expect(levelProgress(0)).toMatchObject({ level: { name: "Rookie" }, levelNumber: 1, next: { name: "Starter" }, xpToNext: 500, percent: 0 });
  });

  it("shows progress through the current level", () => {
    expect(levelProgress(1000)).toMatchObject({ level: { name: "Starter" }, xpToNext: 500, percent: 50 });
  });

  it("moves up exactly at each threshold", () => {
    for (const [i, level] of LEVELS.entries()) {
      expect(levelProgress(level.minXp).level.name).toBe(level.name);
      if (i > 0) expect(levelProgress(level.minXp - 1).level.name).toBe(LEVELS[i - 1].name);
    }
  });

  it("tops out at Pro", () => {
    expect(levelProgress(50_000)).toMatchObject({ level: { name: "Pro" }, next: null, xpToNext: 0, percent: 100 });
  });

  it("names the levels Jayden asked for, in order", () => {
    expect(LEVELS.map((level) => level.name)).toEqual(["Rookie", "Starter", "Varsity", "All-Conference", "Pro"]);
  });
});
