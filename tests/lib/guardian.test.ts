import { describe, expect, it } from "vitest";

import { guardianStatus, validateGuardianAnswer } from "@/lib/guardian";

const NOW = new Date("2026-10-02T12:00:00Z");

describe("validateGuardianAnswer", () => {
  it("asks for an answer first", () => {
    expect(validateGuardianAnswer({ isAdult: null, name: "", email: "", acknowledged: false }, NOW)).toEqual({
      ok: false,
      error: "Choose whether you're 18 or older."
    });
  });

  it("needs nothing else from an adult and clears any guardian fields", () => {
    expect(validateGuardianAnswer({ isAdult: true, name: "x", email: "y", acknowledged: true }, NOW)).toEqual({
      ok: true,
      fields: { is_adult: true, guardian_name: null, guardian_email: null, guardian_acknowledged_at: null }
    });
  });

  it("requires a guardian name, a valid email and the confirmation for under 18", () => {
    const base = { isAdult: false, name: "Pat Thompson", email: "pat@example.com", acknowledged: true } as const;
    expect(validateGuardianAnswer({ ...base, name: " " }, NOW)).toMatchObject({ ok: false, error: expect.stringMatching(/name/) });
    expect(validateGuardianAnswer({ ...base, email: "pat@" }, NOW)).toMatchObject({ ok: false, error: expect.stringMatching(/email/) });
    expect(validateGuardianAnswer({ ...base, acknowledged: false }, NOW)).toMatchObject({ ok: false, error: expect.stringMatching(/confirm/) });
  });

  it("returns the fields to save for a complete under-18 answer", () => {
    expect(
      validateGuardianAnswer({ isAdult: false, name: "  Pat  Thompson ", email: " PAT@Example.com ", acknowledged: true }, NOW)
    ).toEqual({
      ok: true,
      fields: {
        is_adult: false,
        guardian_name: "Pat Thompson",
        guardian_email: "pat@example.com",
        guardian_acknowledged_at: "2026-10-02T12:00:00.000Z"
      }
    });
  });
});

describe("guardianStatus", () => {
  it("flags athletes who haven't answered", () => {
    expect(guardianStatus({ is_adult: null })).toBe("missing");
    expect(guardianStatus({})).toBe("missing");
  });

  it("flags under-18 athletes with incomplete guardian info", () => {
    expect(guardianStatus({ is_adult: false, guardian_name: "Pat", guardian_email: null, guardian_acknowledged_at: null })).toBe("missing");
  });

  it("is fine for adults and complete under-18 answers", () => {
    expect(guardianStatus({ is_adult: true })).toBe("adult");
    expect(
      guardianStatus({ is_adult: false, guardian_name: "Pat", guardian_email: "pat@example.com", guardian_acknowledged_at: "2026-10-02T12:00:00Z" })
    ).toBe("complete");
  });
});
