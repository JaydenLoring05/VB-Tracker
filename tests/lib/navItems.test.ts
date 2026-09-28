import { describe, expect, it } from "vitest";

import { NAV_ROUTES, activePrimaryHref, isNavLinkActive, navItemsFor } from "@/lib/navItems";

const labels = (links: { label: string }[]) => links.map((link) => link.label);

describe("navItemsFor", () => {
  it("gives athletes Today, Plan, Progress, Film up front", () => {
    expect(labels(navItemsFor("athlete").primary)).toEqual(["Today", "Plan", "Progress", "Film"]);
  });

  it("gives coaches Team, Plan, Film, Progress up front", () => {
    expect(labels(navItemsFor("coach").primary)).toEqual(["Team", "Plan", "Film", "Progress"]);
  });

  it("sends coaches' Progress to team progress and keeps their own stats under More", () => {
    const { primary, more } = navItemsFor("coach");
    expect(primary.find((link) => link.label === "Progress")?.href).toBe("/team-progress");
    expect(more.find((link) => link.label === "My Stats")?.href).toBe("/stats");
  });

  it("keeps athletes' Progress on their own stats", () => {
    expect(navItemsFor("athlete").primary.find((link) => link.label === "Progress")?.href).toBe("/stats");
  });

  it("falls back to the athlete nav when there is no team or the role is still loading", () => {
    expect(navItemsFor(null)).toBe(navItemsFor("athlete"));
    expect(navItemsFor(undefined)).toBe(navItemsFor("athlete"));
  });

  it.each(["athlete", "coach"] as const)("keeps the %s bottom bar at 5 items including More", (role) => {
    expect(navItemsFor(role).primary.length + 1).toBeLessThanOrEqual(5);
  });

  it.each(["athlete", "coach"] as const)("puts Exercise Library behind More for %s", (role) => {
    expect(labels(navItemsFor(role).more)).toContain("Exercise Library");
    expect(labels(navItemsFor(role).primary)).not.toContain("Exercise Library");
  });

  it.each(["athlete", "coach"] as const)("keeps every existing route reachable for %s", (role) => {
    const { primary, more } = navItemsFor(role);
    const reachable = new Set([...primary, ...more].flatMap((link) => [link.href, ...(link.alsoMatches ?? [])]));

    for (const route of NAV_ROUTES) {
      expect(reachable, route).toContain(route);
    }
  });

  it.each(["athlete", "coach"] as const)("never lists the same page twice for %s", (role) => {
    const { primary, more } = navItemsFor(role);
    const hrefs = [...primary, ...more].map((link) => link.href);
    expect(new Set(hrefs).size).toBe(hrefs.length);
  });
});

describe("isNavLinkActive", () => {
  const plan = navItemsFor("athlete").primary[1];

  it("matches the link itself and its sub-pages", () => {
    expect(isNavLinkActive(plan, "/workouts")).toBe(true);
    expect(isNavLinkActive(plan, "/workouts/3")).toBe(true);
  });

  it("matches the extra routes the item covers", () => {
    expect(isNavLinkActive(plan, "/calendar")).toBe(true);
  });

  it("does not match a route that only shares a prefix", () => {
    // "/workout" (Start Workout) must not light up "/workouts" (Plan), or the other way round.
    expect(isNavLinkActive(plan, "/workout")).toBe(false);
    expect(isNavLinkActive(plan, "/stats")).toBe(false);
  });
});

describe("activePrimaryHref", () => {
  it("puts an athlete's active workout under Today", () => {
    expect(activePrimaryHref(navItemsFor("athlete"), "/workout/abc")).toBe("/dashboard");
  });

  it("puts an athlete's calendar under Plan", () => {
    expect(activePrimaryHref(navItemsFor("athlete"), "/calendar")).toBe("/workouts");
  });

  it("returns null for pages that live under More", () => {
    expect(activePrimaryHref(navItemsFor("athlete"), "/library")).toBeNull();
    expect(activePrimaryHref(navItemsFor("coach"), "/workouts")).toBeNull();
  });
});
