import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import {
  EQUIPMENT,
  equipmentNote,
  goalLabels,
  levelForYearsLifting,
  onboardingSteps,
  quizToRow,
  SEASON_PHASES,
  secondaryGoalOptions,
  validateSeasonDates,
  weeklyWithPracticeDays,
  YEARS_LIFTING
} from "@/lib/onboardingQuiz";

describe("onboarding quiz (P-03)", () => {
  it("gives athletes two quiz steps before the team step; coaches keep four steps", () => {
    expect(onboardingSteps("athlete")).toEqual(["role", "details", "training", "season", "team", "done"]);
    expect(onboardingSteps("coach")).toEqual(["role", "details", "team", "done"]);
    expect(onboardingSteps(null)).toEqual(onboardingSteps("coach"));
  });

  it("maps years lifting to the plan level", () => {
    expect(levelForYearsLifting("none")).toBe("beginner");
    expect(levelForYearsLifting("under1")).toBe("beginner");
    expect(levelForYearsLifting("1to2")).toBe("intermediate");
    expect(levelForYearsLifting("3plus")).toBe("advanced");
    expect(YEARS_LIFTING.map((option) => option.value)).toEqual(["none", "under1", "1to2", "3plus"]);
  });

  it("leaves the main goal out of the second-goal choices", () => {
    const values = secondaryGoalOptions("speed").map((option) => option.value);
    expect(values).not.toContain("speed");
    expect(values).toEqual(["jump", "power", "strength", "healthy"]);
  });

  it("saves the main goal first, then a different second goal", () => {
    expect(goalLabels("speed", null)).toEqual(["Get faster"]);
    expect(goalLabels("speed", "jump")).toEqual(["Get faster", "Jump higher"]);
    expect(goalLabels("power", "power")).toEqual(["Hit harder"]);
  });

  it("marks picked days as practice and keeps lift-elsewhere days", () => {
    expect(
      weeklyWithPracticeDays({ Monday: "practice", Tuesday: "liftClass", Friday: "practice" }, ["Wednesday", "Friday"])
    ).toEqual({ Tuesday: "liftClass", Wednesday: "practice", Friday: "practice" });
    expect(weeklyWithPracticeDays({ Tuesday: "liftClass" }, ["Tuesday"])).toEqual({ Tuesday: "practice" });
    expect(weeklyWithPracticeDays({}, [])).toEqual({});
  });

  it("allows blank season dates but not an end before the start", () => {
    expect(validateSeasonDates("", "")).toBeNull();
    expect(validateSeasonDates("2026-11-20", "")).toBeNull();
    expect(validateSeasonDates("2026-11-20", "2027-03-01")).toBeNull();
    expect(validateSeasonDates("2026-11-20", "2026-11-20")).toBeNull();
    expect(validateSeasonDates("2027-03-01", "2026-11-20")).toMatch(/end before it starts/);
    expect(validateSeasonDates("next week", "")).toMatch(/start/);
  });

  it("only warns about gym lifts when the athlete has no full gym", () => {
    expect(equipmentNote("fullGym")).toBeNull();
    expect(equipmentNote("dumbbells")).toMatch(/Swap/);
    expect(equipmentNote("bodyweight")).toMatch(/Swap/);
  });

  it("writes the three new answers as profile columns", () => {
    expect(quizToRow({ yearsLifting: "3plus", equipment: "bodyweight", seasonPhase: "inSeason" })).toEqual({
      years_lifting: "3plus",
      equipment: "bodyweight",
      season_phase: "inSeason"
    });
  });
});

describe("schema_v66_onboarding_quiz.sql", () => {
  const sql = readFileSync(path.join(process.cwd(), "supabase/schema_v66_onboarding_quiz.sql"), "utf8");

  it("allows exactly the values the app writes", () => {
    YEARS_LIFTING.forEach((option) => expect(sql).toContain(`'${option.value}'`));
    EQUIPMENT.forEach((option) => expect(sql).toContain(`'${option.value}'`));
    SEASON_PHASES.forEach((option) => expect(sql).toContain(`'${option.value}'`));
  });

  it("is safe to re-run", () => {
    expect(sql).toMatch(/add column if not exists years_lifting/);
    expect(sql).toMatch(/drop constraint if exists profiles_season_phase_check/);
  });
});
