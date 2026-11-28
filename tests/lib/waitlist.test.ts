import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { POSITIONS, validateWaitlistField, validateWaitlistSignup, WAITLIST_AGE_GROUPS } from "@/lib/waitlist";

describe("validateWaitlistSignup", () => {
  it("accepts name and email alone and cleans them", () => {
    expect(validateWaitlistSignup({ name: "  Ava \n Thompson ", email: " AVA@Example.COM " })).toEqual({
      ok: true,
      value: { name: "Ava Thompson", email: "ava@example.com", position: null, ageGroup: null }
    });
  });

  it("requires a name and a real email", () => {
    const result = validateWaitlistSignup({ name: "A", email: "ava@" });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(Object.keys(result.errors).sort()).toEqual(["email", "name"]);
  });

  it("treats junk input as missing fields instead of crashing", () => {
    expect(validateWaitlistSignup(null).ok).toBe(false);
    expect(validateWaitlistSignup([]).ok).toBe(false);
  });

  it("only allows listed positions and age groups", () => {
    expect(validateWaitlistField("position", "setter")).toBeUndefined();
    expect(validateWaitlistField("position", "")).toBeUndefined();
    expect(validateWaitlistField("position", "goalie")).toBeDefined();
    expect(validateWaitlistField("ageGroup", "under14")).toBeUndefined();
    expect(validateWaitlistField("ageGroup", "adult")).toBeDefined();
  });
});

describe("schema_v60_waitlist_signups.sql", () => {
  const sql = readFileSync(path.join(process.cwd(), "supabase/schema_v60_waitlist_signups.sql"), "utf8");

  it("allows every position and age group the form offers", () => {
    POSITIONS.forEach((position) => expect(sql).toContain(`'${position.value}'`));
    WAITLIST_AGE_GROUPS.forEach((group) => expect(sql).toContain(`'${group.value}'`));
  });

  it("turns on RLS with an insert-only policy for anonymous visitors", () => {
    expect(sql).toMatch(/enable row level security/i);
    expect(sql).toMatch(/for insert to anon, authenticated/i);
    expect(sql).not.toMatch(/for (select|update|delete|all)\b/i);
    expect(sql).toMatch(/grant insert \(name, email, position, age_group\)/i);
  });
});
