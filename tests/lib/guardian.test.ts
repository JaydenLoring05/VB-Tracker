import { describe, expect, it } from "vitest";

import {
  ageGroupForAge,
  fieldsFromSignupMetadata,
  guardianStatus,
  needsParentConsent,
  parseAge,
  signupAgeMetadata,
  validateGuardianAnswer
} from "@/lib/guardian";

const NOW = new Date("2026-11-03T12:00:00Z");

describe("parseAge", () => {
  it("accepts whole ages from 5 to 99", () => {
    expect(parseAge("12")).toBe(12);
    expect(parseAge(" 18 ")).toBe(18);
    expect(parseAge("5")).toBe(5);
    expect(parseAge("99")).toBe(99);
  });

  it("rejects blanks, decimals and out-of-range ages", () => {
    for (const input of ["", "4", "100", "12.5", "-3", "abc"]) expect(parseAge(input), input).toBeNull();
  });
});

describe("ageGroupForAge", () => {
  it("matches the plan's age groups", () => {
    expect(ageGroupForAge(10)).toBe("under14");
    expect(ageGroupForAge(13)).toBe("under14");
    expect(ageGroupForAge(14)).toBe("14to17");
    expect(ageGroupForAge(17)).toBe("14to17");
    expect(ageGroupForAge(18)).toBe("18plus");
  });
});

describe("needsParentConsent (N-03)", () => {
  it("is only for valid ages under 13", () => {
    expect(needsParentConsent("12")).toBe(true);
    expect(needsParentConsent("9")).toBe(true);
    expect(needsParentConsent("13")).toBe(false);
    expect(needsParentConsent("16")).toBe(false);
    expect(needsParentConsent("")).toBe(false);
  });
});

describe("validateGuardianAnswer", () => {
  it("asks for an age first", () => {
    expect(validateGuardianAnswer({ age: "", parentEmail: "", agreed: false }, NOW)).toEqual({
      ok: false,
      error: "Enter your age."
    });
  });

  it("needs no parent from 13 up", () => {
    expect(validateGuardianAnswer({ age: "13", parentEmail: "", agreed: false }, NOW)).toEqual({
      ok: true,
      fields: {
        is_adult: false,
        under_13: false,
        age_group: "under14",
        guardian_name: null,
        guardian_email: null,
        guardian_acknowledged_at: null
      }
    });
    expect(validateGuardianAnswer({ age: "20", parentEmail: "x@y.z", agreed: true }, NOW)).toMatchObject({
      ok: true,
      fields: { is_adult: true, under_13: false, age_group: "18plus", guardian_email: null }
    });
  });

  it("requires a parent's email and consent under 13", () => {
    const base = { age: "11", parentEmail: "pat@example.com", agreed: true };
    expect(validateGuardianAnswer({ ...base, parentEmail: "pat@" }, NOW)).toMatchObject({
      ok: false,
      error: expect.stringMatching(/email/)
    });
    expect(validateGuardianAnswer({ ...base, agreed: false }, NOW)).toMatchObject({
      ok: false,
      error: expect.stringMatching(/tick the box/)
    });
  });

  it("returns the fields to save for an under-13 athlete with consent", () => {
    expect(validateGuardianAnswer({ age: "11", parentEmail: " PAT@Example.com ", agreed: true }, NOW)).toEqual({
      ok: true,
      fields: {
        is_adult: false,
        under_13: true,
        age_group: "under14",
        guardian_name: null,
        guardian_email: "pat@example.com",
        guardian_acknowledged_at: "2026-11-03T12:00:00.000Z"
      }
    });
  });
});

describe("guardianStatus", () => {
  it("flags athletes who haven't told us their age", () => {
    expect(guardianStatus({ is_adult: null })).toBe("missing");
    expect(guardianStatus({})).toBe("missing");
  });

  it("flags under-13 athletes without consent", () => {
    expect(guardianStatus({ is_adult: false, under_13: true, guardian_email: null })).toBe("missing");
  });

  it("is fine for adults, 13 to 17, and under 13 with consent", () => {
    expect(guardianStatus({ is_adult: true })).toBe("adult");
    expect(guardianStatus({ is_adult: false, under_13: false })).toBe("complete");
    expect(
      guardianStatus({ is_adult: false, under_13: true, guardian_email: "pat@example.com", guardian_acknowledged_at: "2026-11-03T12:00:00Z" })
    ).toBe("complete");
  });

  it("still counts guardian info given under the old under-18 step (#49)", () => {
    expect(
      guardianStatus({ is_adult: false, under_13: null, guardian_email: "pat@example.com", guardian_acknowledged_at: "2026-10-02T12:00:00Z" })
    ).toBe("complete");
  });
});

describe("sign-up metadata", () => {
  it("round-trips through the account metadata", () => {
    const result = validateGuardianAnswer({ age: "11", parentEmail: "pat@example.com", agreed: true }, NOW);
    if (!result.ok) throw new Error("expected ok");
    expect(fieldsFromSignupMetadata(signupAgeMetadata(result.fields))).toEqual(result.fields);
  });

  it("ignores missing or tampered metadata", () => {
    expect(fieldsFromSignupMetadata(undefined)).toBeNull();
    expect(fieldsFromSignupMetadata({ pending_invite: "ABC123" })).toBeNull();
    expect(fieldsFromSignupMetadata({ signup_age_group: "kid" })).toBeNull();
    // Under 13 without the parent's consent never counts as answered.
    expect(fieldsFromSignupMetadata({ signup_age_group: "under14", signup_under_13: true })).toBeNull();
  });
});
