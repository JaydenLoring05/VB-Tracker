import { ATHLETE_GOALS, AthleteGoal } from "@/lib/athleteSignup";
import { TrainingLevel, WEEKDAYS, Weekday, WeeklySchedule } from "@/lib/trainingProfile";

/**
 * The athlete onboarding quiz (P-03): how long they've lifted, what they can
 * train with, a main and a second goal, and their season. Pure helpers so
 * the screen stays thin and every rule is tested.
 *
 * Saved on `profiles` (schema_v66: years_lifting, equipment, season_phase;
 * season dates and goals reuse schema_v34's columns, practice days reuse
 * schema_v58's weekly_schedule).
 */

export type OnboardingStep = "role" | "details" | "training" | "season" | "team" | "done";

/** The steps each role goes through. Athletes get two quiz steps before the team step. */
export function onboardingSteps(role: "coach" | "athlete" | null): OnboardingStep[] {
  return role === "athlete"
    ? ["role", "details", "training", "season", "team", "done"]
    : ["role", "details", "team", "done"];
}

/** Message under the equipment choice: honest about what the plan does with it today. */
export function equipmentNote(equipment: Equipment): string | null {
  if (equipment === "fullGym") return null;
  return "Some days still use gym lifts. Tap Swap on any exercise you can't do on the Workouts tab.";
}

export type YearsLifting = "none" | "under1" | "1to2" | "3plus";

export const YEARS_LIFTING: { value: YearsLifting; label: string; level: TrainingLevel }[] = [
  { value: "none", label: "Never", level: "beginner" },
  { value: "under1", label: "Less than a year", level: "beginner" },
  { value: "1to2", label: "1-2 years", level: "intermediate" },
  { value: "3plus", label: "3+ years", level: "advanced" }
];

/** The plan level that matches the years lifted (same split as the level hints). */
export function levelForYearsLifting(years: YearsLifting): TrainingLevel {
  return YEARS_LIFTING.find((option) => option.value === years)?.level ?? "intermediate";
}

export type Equipment = "fullGym" | "dumbbells" | "bodyweight";

export const EQUIPMENT: { value: Equipment; label: string; hint: string }[] = [
  { value: "fullGym", label: "Full gym", hint: "Barbells, racks and machines" },
  { value: "dumbbells", label: "Dumbbells and bands", hint: "A home or garage setup" },
  { value: "bodyweight", label: "No equipment", hint: "Bodyweight only" }
];

export type SeasonPhase = "offSeason" | "preseason" | "inSeason";

export const SEASON_PHASES: { value: SeasonPhase; label: string; hint: string }[] = [
  { value: "offSeason", label: "Off-season", hint: "No games for a while: the best time to build strength" },
  { value: "preseason", label: "Preseason", hint: "Games start in the next few weeks" },
  { value: "inSeason", label: "In season", hint: "Playing games now" }
];

/** The second-goal choices: every goal except the main one. */
export function secondaryGoalOptions(main: AthleteGoal) {
  return ATHLETE_GOALS.filter((option) => option.value !== main);
}

/**
 * What goes in `profiles.training_goals`: the main goal's label first, then
 * the second goal's if it's set and different.
 */
export function goalLabels(main: AthleteGoal, secondary: AthleteGoal | null): string[] {
  const labelOf = (goal: AthleteGoal) => ATHLETE_GOALS.find((option) => option.value === goal)?.label;
  const labels = [labelOf(main)];
  if (secondary && secondary !== main) labels.push(labelOf(secondary));
  return labels.filter((label): label is string => Boolean(label));
}

/**
 * The practice days picked in the quiz, merged into the athlete's regular
 * week (F-38). Days picked become "practice"; practice days not picked are
 * cleared; "lift elsewhere" days are left alone unless picked.
 */
export function weeklyWithPracticeDays(current: WeeklySchedule, practiceDays: Weekday[]): WeeklySchedule {
  const next: WeeklySchedule = {};
  WEEKDAYS.forEach((day) => {
    if (practiceDays.includes(day)) next[day] = "practice";
    else if (current[day] === "liftClass") next[day] = "liftClass";
  });
  return next;
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** Both dates are optional; when both are given the end can't be before the start. */
export function validateSeasonDates(start: string, end: string): string | null {
  if (start && !ISO_DATE.test(start)) return "Enter the season start as a date.";
  if (end && !ISO_DATE.test(end)) return "Enter the season end as a date.";
  if (start && end && end < start) return "The season can't end before it starts.";
  return null;
}

export type QuizAnswers = {
  yearsLifting: YearsLifting;
  equipment: Equipment;
  seasonPhase: SeasonPhase;
};

/** Columns on public.profiles (schema_v66). */
export type QuizRow = {
  years_lifting: YearsLifting;
  equipment: Equipment;
  season_phase: SeasonPhase;
};

export function quizToRow(answers: QuizAnswers): QuizRow {
  return {
    years_lifting: answers.yearsLifting,
    equipment: answers.equipment,
    season_phase: answers.seasonPhase
  };
}
