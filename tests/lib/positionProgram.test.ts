import { describe, expect, it } from "vitest";

import { POSITION_PROGRAMS } from "@/data/positionPrograms";
import { applyStartingProgram, parseStartingProgramKey, startingProgramKeyForPosition } from "@/lib/positionProgram";
import type { TeamOverrideData } from "@/lib/programResolution";

describe("startingProgramKeyForPosition", () => {
  it("maps every onboarding position", () => {
    expect(startingProgramKeyForPosition("Outside Hitter")).toBe("outside_opposite");
    expect(startingProgramKeyForPosition("Opposite")).toBe("outside_opposite");
    expect(startingProgramKeyForPosition("Middle Blocker")).toBe("middle");
    expect(startingProgramKeyForPosition("Setter")).toBe("setter");
    expect(startingProgramKeyForPosition("Libero/DS")).toBe("libero");
  });

  it("returns null for no or unknown positions", () => {
    expect(startingProgramKeyForPosition(null)).toBeNull();
    expect(startingProgramKeyForPosition("Coach")).toBeNull();
  });
});

describe("parseStartingProgramKey", () => {
  it("accepts known keys only", () => {
    expect(parseStartingProgramKey("middle")).toBe("middle");
    expect(parseStartingProgramKey("beach")).toBeNull();
    expect(parseStartingProgramKey(null)).toBeNull();
  });
});

describe("applyStartingProgram", () => {
  const empty: TeamOverrideData = { planTier: "pilot", exerciseDefaults: {}, dayOverrides: {}, customProgram: null };

  it("leaves everything alone with no starting program", () => {
    expect(applyStartingProgram(null, null)).toBeNull();
    expect(applyStartingProgram(empty, null)).toBe(empty);
  });

  it("gives a teamless athlete their starting program", () => {
    const result = applyStartingProgram(null, "setter");
    expect(result?.customProgram?.name).toBe(POSITION_PROGRAMS.setter.program.name);
    expect(result?.customProgram?.days).toEqual(POSITION_PROGRAMS.setter.program.days);
  });

  it("gives an athlete on an uncustomized team their starting program", () => {
    expect(applyStartingProgram(empty, "libero")?.customProgram?.name).toBe("Libero / DS starter");
  });

  it("keeps a coach-assigned program over the starting program", () => {
    const coach = { ...empty, customProgram: { id: "p1", name: "Coach plan", days: [] } };
    expect(applyStartingProgram(coach, "middle")).toBe(coach);
  });

  it("keeps the coach's edits to the recommended plan over the starting program", () => {
    const withDefaults = { ...empty, exerciseDefaults: { "Box Jumps": "Squat Jumps" } };
    const withDays = { ...empty, dayOverrides: { "foundation-Monday": ["Planks"] } };
    expect(applyStartingProgram(withDefaults, "middle")).toBe(withDefaults);
    expect(applyStartingProgram(withDays, "middle")).toBe(withDays);
  });
});
