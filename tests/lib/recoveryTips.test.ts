import { describe, expect, it } from "vitest";

import { exercisePreview, RECOVERY_TIPS, recoveryTipFor } from "@/lib/recoveryTips";

describe("recoveryTipFor (N-02)", () => {
  it("gives a tip for a date and the same tip all day", () => {
    const tip = recoveryTipFor("2026-11-08");
    expect(RECOVERY_TIPS).toContain(tip);
    expect(recoveryTipFor("2026-11-08")).toBe(tip);
  });

  it("changes from one day to the next", () => {
    expect(recoveryTipFor("2026-11-08")).not.toBe(recoveryTipFor("2026-11-09"));
  });

  it("returns nothing before the browser knows the date", () => {
    expect(recoveryTipFor("")).toBe("");
  });

  it("cycles through every tip", () => {
    const seen = new Set<string>();
    for (let day = 1; day <= RECOVERY_TIPS.length; day++) {
      seen.add(recoveryTipFor(`2026-01-${String(day).padStart(2, "0")}`));
    }
    expect(seen.size).toBe(RECOVERY_TIPS.length);
  });
});

describe("exercisePreview", () => {
  it("shows the first four and counts the rest", () => {
    expect(exercisePreview(["A", "B", "C", "D", "E", "F"])).toEqual({ shown: ["A", "B", "C", "D"], more: 2 });
    expect(exercisePreview(["A", "B"])).toEqual({ shown: ["A", "B"], more: 0 });
  });
});
