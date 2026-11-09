import { describe, expect, it } from "vitest";

import { isOpenWithoutPlan, needsPlan, paywallMessage } from "@/lib/access";

const solo = { billingEnabled: true, onTeam: false, billingLoadFailed: false };

describe("needsPlan (P-02)", () => {
  it("locks a solo athlete with no plan, a canceled plan or a failed payment", () => {
    expect(needsPlan({ ...solo, status: null })).toBe(true);
    expect(needsPlan({ ...solo, status: "none" })).toBe(true);
    expect(needsPlan({ ...solo, status: "canceled" })).toBe(true);
    expect(needsPlan({ ...solo, status: "past_due" })).toBe(true);
    expect(needsPlan({ ...solo, status: "incomplete" })).toBe(true);
  });

  it("lets trialing and paying athletes in", () => {
    expect(needsPlan({ ...solo, status: "trialing" })).toBe(false);
    expect(needsPlan({ ...solo, status: "active" })).toBe(false);
  });

  it("never locks anyone on a team, while payments are off, or when billing can't be read", () => {
    expect(needsPlan({ ...solo, onTeam: true, status: null })).toBe(false);
    expect(needsPlan({ ...solo, billingEnabled: false, status: null })).toBe(false);
    expect(needsPlan({ ...solo, billingLoadFailed: true, status: null })).toBe(false);
  });
});

describe("isOpenWithoutPlan", () => {
  it("keeps settings, onboarding, team setup and feedback open", () => {
    for (const path of ["/settings", "/onboarding", "/coach", "/feedback", "/settings/anything"]) {
      expect(isOpenWithoutPlan(path), path).toBe(true);
    }
  });

  it("locks the training pages", () => {
    for (const path of ["/dashboard", "/workout", "/workouts", "/stats", "/plan", "/calendar", "/library", "/coaching"]) {
      expect(isOpenWithoutPlan(path), path).toBe(false);
    }
  });
});

describe("paywallMessage", () => {
  it("says why the athlete is seeing the paywall", () => {
    expect(paywallMessage("past_due")).toMatch(/card/);
    expect(paywallMessage("canceled")).toMatch(/ended/);
    expect(paywallMessage(null)).toMatch(/free trial/);
  });
});
