import { describe, expect, it } from "vitest";

import { week1Preview } from "@/lib/week1Preview";
import { DEFAULT_TRAINING_PROFILE } from "@/lib/trainingProfile";

const base = { sport: "volleyball", position: "Setter", positionLabel: "Setter", profile: DEFAULT_TRAINING_PROFILE };

describe("week1Preview (Phase 1 #1)", () => {
  it("lists the position's starting week with a summary line", () => {
    const preview = week1Preview(base);
    expect(preview.summary).toContain("Setter");
    expect(preview.days.length).toBeGreaterThan(0);
    expect(preview.days.some((day) => !day.rest && day.highlights.length > 0)).toBe(true);
  });

  it("differs by position (setter vs middle)", () => {
    const setter = week1Preview(base).days.map((d) => d.title).join("|");
    const middle = week1Preview({ ...base, position: "Middle Blocker", positionLabel: "Middle Blocker" }).days
      .map((d) => d.title)
      .join("|");
    expect(setter).not.toEqual(middle);
  });

  it("shows level and age in the summary", () => {
    const preview = week1Preview({ ...base, profile: { level: "beginner", injuries: [], ageGroup: "14to17" } });
    expect(preview.summary).toContain("14-17");
  });
});
