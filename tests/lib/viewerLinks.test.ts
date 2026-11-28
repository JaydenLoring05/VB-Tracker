import { describe, expect, it } from "vitest";

import {
  describeViewerLink,
  isEmailAddress,
  normalizeViewerLabel,
  parseViewerToken,
  summarizeViewerData,
  VIEWER_LABEL_MAX,
  viewerInviteMailto,
  viewerInviteMessage,
  viewerLink
} from "@/lib/viewerLinks";

const TOKEN = "a".repeat(24) + "0123456789abcdef01234567";

/** A local-time instant as ISO, so tests pass in any time zone. */
function at(year: number, month: number, day: number, hour = 12): string {
  return new Date(year, month - 1, day, hour).toISOString();
}

// Thursday 19 November 2026, mid-afternoon local time.
const NOW = new Date(2026, 10, 19, 15);

describe("parseViewerToken (P-06)", () => {
  it("accepts 48 hex characters in any case and trims spaces", () => {
    expect(parseViewerToken(TOKEN)).toBe(TOKEN);
    expect(parseViewerToken(` ${TOKEN.toUpperCase()} `)).toBe(TOKEN);
  });

  it("rejects anything else", () => {
    for (const input of [TOKEN.slice(1), `${TOKEN}0`, TOKEN.replace("a", "g"), "", null, undefined]) {
      expect(parseViewerToken(input), String(input)).toBeNull();
    }
  });

  it("builds a /view link with the token as a query value", () => {
    expect(viewerLink(TOKEN)).toMatch(new RegExp(`/view\\?t=${TOKEN}$`));
  });
});

describe("link names and invites", () => {
  it("trims and caps the optional name, blank is null", () => {
    expect(normalizeViewerLabel("  Coach   Rivera ")).toBe("Coach Rivera");
    expect(normalizeViewerLabel("   ")).toBeNull();
    expect(normalizeViewerLabel(null)).toBeNull();
    expect(normalizeViewerLabel("x".repeat(80))).toHaveLength(VIEWER_LABEL_MAX);
  });

  it("describes a link by its name and role", () => {
    expect(describeViewerLink({ role: "parent", label: "Mom" })).toBe("Mom (parent)");
    expect(describeViewerLink({ role: "coach", label: null })).toBe("Coach");
  });

  it("checks emails loosely", () => {
    expect(isEmailAddress("parent@example.com")).toBe(true);
    expect(isEmailAddress(" parent@example.com ")).toBe(true);
    expect(isEmailAddress("parent@example")).toBe(false);
    expect(isEmailAddress("not an email")).toBe(false);
  });

  it("puts the link in the invite and fills a mailto with it", () => {
    const link = viewerLink(TOKEN);
    expect(viewerInviteMessage("parent", link).body).toContain(link);
    expect(viewerInviteMessage("coach", link).body).toContain("as my coach");

    const mailto = viewerInviteMailto("coach@example.com", "coach", link);
    expect(mailto.startsWith("mailto:coach%40example.com?subject=")).toBe(true);
    expect(decodeURIComponent(mailto.split("&body=")[1])).toContain(link);
  });
});

describe("summarizeViewerData", () => {
  it("returns null for a dead link or a bad shape", () => {
    expect(summarizeViewerData(null, NOW)).toBeNull();
    expect(summarizeViewerData("nope", NOW)).toBeNull();
    expect(summarizeViewerData({ role: "stranger" }, NOW)).toBeNull();
  });

  it("counts workouts this week (Monday on), in 4 weeks, and days in 14", () => {
    const summary = summarizeViewerData(
      {
        role: "parent",
        name: "Ava",
        workouts: [
          { ended_at: at(2026, 11, 19), duration_seconds: 2520 }, // Thu, this week
          { ended_at: at(2026, 11, 16, 8), duration_seconds: 1800 }, // Mon, this week
          { ended_at: at(2026, 11, 16, 18), duration_seconds: null }, // Mon again
          { ended_at: at(2026, 11, 15), duration_seconds: 3000 }, // Sun, last week
          { ended_at: at(2026, 11, 1), duration_seconds: 3000 }, // 18 days ago
          { ended_at: at(2026, 10, 20), duration_seconds: 3000 } // 30 days ago
        ],
        check_ins: [at(2026, 11, 19, 7), at(2026, 11, 19, 20), at(2026, 11, 18), at(2026, 11, 1)],
        best_vertical: "24.5",
        best_approach: 118
      },
      NOW
    );

    expect(summary).not.toBeNull();
    expect(summary!.firstName).toBe("Ava");
    expect(summary!.workoutsThisWeek).toBe(3);
    expect(summary!.workoutsLast4Weeks).toBe(5);
    expect(summary!.workoutDays14).toBe(3);
    expect(summary!.checkInDays14).toBe(2);
    expect(summary!.bestVertical).toBe(24.5);
    expect(summary!.bestApproach).toBe(118);
    expect(summary!.recentWorkouts[0]).toEqual({ date: "2026-11-19", minutes: 42 });
    expect(summary!.recentWorkouts.map((w) => w.minutes)).toContain(null);
  });

  it("handles an athlete with nothing logged yet", () => {
    const summary = summarizeViewerData({ role: "coach", name: null, workouts: null, check_ins: [] }, NOW);
    expect(summary).toEqual({
      role: "coach",
      firstName: null,
      workoutsThisWeek: 0,
      workoutsLast4Weeks: 0,
      recentWorkouts: [],
      checkInDays14: 0,
      workoutDays14: 0,
      bestVertical: null,
      bestApproach: null
    });
  });

  it("drops bad rows and shows at most 10 workouts", () => {
    const workouts = Array.from({ length: 14 }, (_, i) => ({ ended_at: at(2026, 11, 19 - i), duration_seconds: 600 }));
    const summary = summarizeViewerData(
      { role: "parent", workouts: [...workouts, { ended_at: "garbage" }, null], best_vertical: 0 },
      NOW
    );
    expect(summary!.recentWorkouts).toHaveLength(10);
    expect(summary!.workoutsLast4Weeks).toBe(14);
    expect(summary!.bestVertical).toBeNull();
  });
});
