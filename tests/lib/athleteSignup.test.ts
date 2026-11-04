import { describe, expect, it } from "vitest";

import { ATHLETE_GOALS, positionLabel, SPORTS } from "@/lib/athleteSignup";

describe("athlete sign-up answers (N-03)", () => {
  it("offers the three goals Jayden asked for", () => {
    expect(ATHLETE_GOALS.map((goal) => goal.label)).toEqual(["Jump higher", "Get stronger", "Stay healthy"]);
  });

  it("lists volleyball first and has an Other choice", () => {
    expect(SPORTS[0].value).toBe("volleyball");
    expect(SPORTS.some((sport) => sport.value === "other")).toBe(true);
  });

  it("keeps the volleyball position, or the typed one for other sports", () => {
    expect(positionLabel("volleyball", "Setter", "ignored")).toBe("Setter");
    expect(positionLabel("basketball", "Setter", "  Point   guard ")).toBe("Point guard");
    expect(positionLabel("soccer", "Setter", "   ")).toBeNull();
  });
});
