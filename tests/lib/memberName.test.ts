import { describe, expect, it } from "vitest";

import { displayMemberName, normalizeMemberName } from "@/lib/memberName";

describe("normalizeMemberName", () => {
  it("trims and collapses whitespace", () => {
    expect(normalizeMemberName("  Maya   Chen ")).toEqual({ ok: true, name: "Maya Chen" });
  });

  it("rejects empty names", () => {
    expect(normalizeMemberName("   ")).toEqual({ ok: false, error: "Enter a name." });
  });

  it("rejects names over 60 characters", () => {
    expect(normalizeMemberName("a".repeat(61)).ok).toBe(false);
    expect(normalizeMemberName("a".repeat(60)).ok).toBe(true);
  });

  it("rejects emails", () => {
    expect(normalizeMemberName("maya@school.edu")).toEqual({ ok: false, error: "Use a name, not an email." });
  });
});

describe("displayMemberName", () => {
  it("shows a real name as-is", () => {
    expect(displayMemberName("Maya Chen")).toBe("Maya Chen");
  });

  it("never shows a full email", () => {
    expect(displayMemberName("maya.chen@school.edu")).toBe("maya.chen");
  });

  it("falls back when empty", () => {
    expect(displayMemberName(null)).toBe("Athlete");
    expect(displayMemberName("  ", "Coach")).toBe("Coach");
    expect(displayMemberName("@school.edu")).toBe("Athlete");
  });
});
