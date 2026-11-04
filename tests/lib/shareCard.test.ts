import { describe, expect, it } from "vitest";

import { bestJump, buildShareCard, SHARE_WATERMARK } from "@/lib/shareCard";

const BASE = {
  name: "Ava Thompson",
  streak: 12,
  levelName: "Varsity",
  xp: 1800,
  badges: ["first-workout", "streak-7"] as const,
  prs: [
    { exercise: "Front Squat", value: "135", unit: "lbs" },
    { exercise: "Vertical Jump", value: "24.5", unit: "in" }
  ],
  jumpValues: [{ label: "Vertical", value: 23 }]
};

describe("bestJump (G-05)", () => {
  it("takes the highest vertical from PRs and history", () => {
    expect(bestJump(BASE)).toEqual({ label: "Vertical Jump", value: 24.5 });
  });

  it("ignores lift PRs and non-inch units", () => {
    expect(bestJump({ prs: [{ exercise: "Box Jumps", value: "30", unit: "reps" }], jumpValues: [] })).toBeNull();
  });

  it("falls back to an approach touch when there's no vertical", () => {
    expect(bestJump({ prs: [], jumpValues: [{ label: "Approach touch", value: 120 }] })).toEqual({ label: "Approach touch", value: 120 });
  });
});

describe("buildShareCard", () => {
  it("shows streak, level, badges and best jump, watermarked", () => {
    const card = buildShareCard({ ...BASE, badges: [...BASE.badges] });
    expect(card.title).toBe("AVA'S PROGRESS");
    expect(card.stats).toEqual([
      { label: "Streak", value: "12 days" },
      { label: "Level", value: "Varsity" },
      { label: "Badges", value: "2 of 6" },
      { label: "Best vertical", value: "24.5 in" }
    ]);
    expect(card.badges.map((badge) => badge.name)).toEqual(["First Rep", "On Fire"]);
    expect(card.watermark).toBe(SHARE_WATERMARK);
  });

  it("leaves out the jump when there isn't one, and uses only a first name", () => {
    const card = buildShareCard({ ...BASE, name: "", streak: 1, badges: [], prs: [], jumpValues: [] });
    expect(card.title).toBe("MY PROGRESS");
    expect(card.stats.map((stat) => stat.label)).toEqual(["Streak", "Level", "Badges"]);
    expect(card.stats[0].value).toBe("1 day");
  });
});
