import { describe, expect, it } from "vitest";

import {
  LIMITS,
  PILOT_FIELDS,
  validateField,
  validatePilotApplication
} from "@/lib/pilotApplication";

const valid = {
  coachName: "Coach Carter",
  email: "Coach@Example.com",
  teamName: "Varsity Girls",
  level: "high_school",
  rosterSize: 14,
  trackingMethod: "spreadsheets",
  notes: "We start in August."
};

describe("validatePilotApplication", () => {
  it("accepts a valid application and normalizes it", () => {
    const result = validatePilotApplication({
      ...valid,
      coachName: "  Coach   Carter ",
      rosterSize: "14"
    });
    expect(result).toEqual({
      ok: true,
      value: {
        coachName: "Coach Carter",
        email: "coach@example.com",
        teamName: "Varsity Girls",
        level: "high_school",
        rosterSize: 14,
        trackingMethod: "spreadsheets",
        notes: "We start in August."
      }
    });
  });

  it("treats notes as optional", () => {
    const { notes: _notes, ...withoutNotes } = valid;
    const result = validatePilotApplication(withoutNotes);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.notes).toBe("");
  });

  it("reports an error for every missing field on empty or non-object input", () => {
    for (const input of [{}, null, undefined, "nope", 42]) {
      const result = validatePilotApplication(input);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(Object.keys(result.errors).sort()).toEqual(
          PILOT_FIELDS.filter((field) => field !== "notes").sort()
        );
      }
    }
  });

  it("rejects an invalid email", () => {
    for (const email of ["", "   ", "plain", "a@b", "a@b.c", "a b@c.com", "a@@c.com", "a@c .com"]) {
      const result = validatePilotApplication({ ...valid, email });
      expect(result.ok, `email ${JSON.stringify(email)}`).toBe(false);
      if (!result.ok) expect(result.errors.email).toBeTruthy();
    }
  });

  it("rejects an email over 254 characters", () => {
    const email = `${"a".repeat(250)}@example.com`;
    expect(validateField("email", email)).toBeTruthy();
  });

  it("rejects an email containing control characters", () => {
    expect(validateField("email", "a\u0000@example.com")).toBeTruthy();
    expect(validateField("email", "a@exam\nple.com")).toBeTruthy();
  });

  it("enforces name and team length limits after whitespace collapsing", () => {
    expect(validateField("coachName", "A")).toBeTruthy();
    expect(validateField("coachName", "  A  ")).toBeTruthy();
    expect(validateField("coachName", "Al")).toBeUndefined();
    expect(validateField("coachName", "x".repeat(LIMITS.name.max))).toBeUndefined();
    expect(validateField("coachName", "x".repeat(LIMITS.name.max + 1))).toBeTruthy();
    expect(validateField("teamName", "x".repeat(LIMITS.team.max + 1))).toBeTruthy();
    expect(validateField("teamName", "x".repeat(LIMITS.team.max))).toBeUndefined();
  });

  it("turns control characters (including NUL) in names into spaces", () => {
    const result = validatePilotApplication({ ...valid, coachName: "Jo\u0000hn\tSmith" });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.coachName).toBe("Jo hn Smith");
  });

  it("validates roster size as a whole number from 1 to 200", () => {
    for (const bad of [0, 201, -3, 12.5, "abc", "", null, "1e1x", NaN, Infinity]) {
      expect(validateField("rosterSize", bad), `roster ${String(bad)}`).toBeTruthy();
    }
    for (const good of [1, 200, "30", " 30 "]) {
      expect(validateField("rosterSize", good), `roster ${String(good)}`).toBeUndefined();
    }
  });

  it("only accepts known levels and tracking methods", () => {
    expect(validateField("level", "pro")).toBeTruthy();
    expect(validateField("level", undefined)).toBeTruthy();
    expect(validateField("level", "club")).toBeUndefined();
    expect(validateField("trackingMethod", "carrier_pigeon")).toBeTruthy();
    expect(validateField("trackingMethod", "nothing")).toBeUndefined();
  });

  it("caps notes at 1000 characters but allows line breaks", () => {
    expect(validateField("notes", "x".repeat(LIMITS.notes.max))).toBeUndefined();
    expect(validateField("notes", "x".repeat(LIMITS.notes.max + 1))).toBeTruthy();

    const result = validatePilotApplication({ ...valid, notes: "line one\nline two\u0000" });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.notes).toBe("line one\nline two");
  });

  it("ignores extra fields such as the honeypot", () => {
    const result = validatePilotApplication({ ...valid, website: "spam", admin: true });
    expect(result.ok).toBe(true);
    if (result.ok) expect(Object.keys(result.value).sort()).toEqual([...PILOT_FIELDS].sort());
  });
});
