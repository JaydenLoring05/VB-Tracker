import { describe, expect, it } from "vitest";

import { isOpenWithoutPlan, needsPlan, paywallMessage } from "@/lib/access";

// Past the free first workout unless a test says otherwise.
const solo = { billingEnabled: true, onTeam: false, billingLoadFailed: false, finishedWorkouts: 1 };

describe("first workout free (Phase 1 #2)", () => {
  it("stays open until the first workout is finished, then asks for the trial", () => {
    expect(needsPlan({ ...solo, status: null, finishedWorkouts: 0 })).toBe(false);
    expect(needsPlan({ ...solo, status: "none", finishedWorkouts: 0 })).toBe(false);
    expect(needsPlan({ ...solo, status: null, finishedWorkouts: 1 })).toBe(true);
    expect(needsPlan({ ...solo, status: "none", finishedWorkouts: 3 })).toBe(true);
  });
  it("never opens the door for canceled or past-due athletes", () => {
    expect(needsPlan({ ...solo, status: "canceled", finishedWorkouts: 0 })).toBe(true);
    expect(needsPlan({ ...solo, status: "past_due", finishedWorkouts: 0 })).toBe(true);
  });
});

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
