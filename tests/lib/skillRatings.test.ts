import { describe, expect, it } from "vitest";

import {
  SKILL_AXES,
  clampRating,
  emptySkillRatings,
  hasAnyRating,
  normalizeSkillRatings,
  skillExtremes,
  skillRadarData,
  skillTotal
} from "@/lib/skillRatings";

describe("clampRating", () => {
  it("keeps whole numbers in range", () => {
    expect(clampRating(1)).toBe(1);
    expect(clampRating(5)).toBe(5);
  });

  it("clamps out-of-range values and rounds decimals", () => {
    expect(clampRating(0)).toBe(1);
    expect(clampRating(9)).toBe(5);
    expect(clampRating(3.6)).toBe(4);
  });

  it("accepts numeric strings", () => {
    expect(clampRating("4")).toBe(4);
  });

  it("returns null for anything that isn't a rating", () => {
    for (const value of [null, undefined, "", "abc", NaN, Infinity, {}, [], true]) {
      expect(clampRating(value)).toBeNull();
    }
  });
});

describe("normalizeSkillRatings", () => {
  it("returns every skill as unrated for missing or malformed input", () => {
    for (const raw of [null, undefined, "nope", 7, [], {}]) {
      expect(normalizeSkillRatings(raw)).toEqual(emptySkillRatings);
    }
  });

  it("keeps valid ratings, drops unknown keys and fixes bad values", () => {
    const ratings = normalizeSkillRatings({ power: 4, jumping: "5", stamina: 12, speed: "fast", serving: 3 });

    expect(ratings).toEqual({
      power: 4,
      jumping: 5,
      stamina: 5,
      gameSense: null,
      technique: null,
      speed: null
    });
    expect(Object.keys(ratings)).toHaveLength(SKILL_AXES.length);
  });
});

describe("skillRadarData", () => {
  it("has one row per skill in axis order, with unrated skills at 0", () => {
    const data = skillRadarData({ ...emptySkillRatings, power: 4 });

    expect(data.map((row) => row.skill)).toEqual(SKILL_AXES.map((axis) => axis.label));
    expect(data[0].value).toBe(4);
    expect(data.slice(1).every((row) => row.value === 0)).toBe(true);
  });
});

describe("skillTotal and hasAnyRating", () => {
  it("is empty until something is rated", () => {
    expect(hasAnyRating(emptySkillRatings)).toBe(false);
    expect(skillTotal(emptySkillRatings)).toEqual({ total: 0, rated: 0, max: 30 });
  });

  it("sums only the rated skills", () => {
    const ratings = { ...emptySkillRatings, power: 4, jumping: 5 };

    expect(hasAnyRating(ratings)).toBe(true);
    expect(skillTotal(ratings)).toEqual({ total: 9, rated: 2, max: 30 });
  });
});

describe("skillExtremes", () => {
  it("needs at least two rated skills", () => {
    expect(skillExtremes(emptySkillRatings)).toBeNull();
    expect(skillExtremes({ ...emptySkillRatings, power: 4 })).toBeNull();
  });

  it("is null when every rated skill is equal", () => {
    expect(skillExtremes({ ...emptySkillRatings, power: 3, speed: 3 })).toBeNull();
  });

  it("names the strongest and weakest skill", () => {
    const ratings = { power: 4, jumping: 5, stamina: 2, gameSense: 4, technique: 3, speed: 4 };

    expect(skillExtremes(ratings)).toEqual({ strongest: "Jumping", weakest: "Stamina" });
  });
});
