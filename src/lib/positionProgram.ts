import { POSITION_PROGRAMS, type StartingProgramKey } from "@/data/positionPrograms";
import type { TeamOverrideData } from "@/lib/programResolution";

// Onboarding positions (OnboardingFlow POSITIONS) to starting programs.
const POSITION_TO_PROGRAM: Record<string, StartingProgramKey> = {
  "Outside Hitter": "outside_opposite",
  Opposite: "outside_opposite",
  "Middle Blocker": "middle",
  Setter: "setter",
  "Libero/DS": "libero"
};

export function startingProgramKeyForPosition(position: string | null | undefined): StartingProgramKey | null {
  return (position && POSITION_TO_PROGRAM[position]) || null;
}

const STARTING_ID_PREFIX = "starting-";

/** The starting-program key behind a resolved program, or null for a coach's program. */
export function startingProgramKeyFromId(programId: string | null | undefined): StartingProgramKey | null {
  return programId?.startsWith(STARTING_ID_PREFIX) ? parseStartingProgramKey(programId.slice(STARTING_ID_PREFIX.length)) : null;
}

/** profiles.starting_program comes back as loose text; only known keys count. */
export function parseStartingProgramKey(value: unknown): StartingProgramKey | null {
  return typeof value === "string" && value in POSITION_PROGRAMS ? (value as StartingProgramKey) : null;
}

/**
 * Puts the athlete's starting program in place of the recommended plan,
 * unless their coach has made a choice: an assigned program, or edits to the
 * recommended plan (pilot exercise defaults or paid day overrides). The
 * coach always wins over the athlete's starting template.
 */
export function applyStartingProgram(
  team: TeamOverrideData | null,
  key: StartingProgramKey | null
): TeamOverrideData | null {
  if (!key) return team;
  if (team?.customProgram) return team;
  if (team && (Object.keys(team.exerciseDefaults).length > 0 || Object.keys(team.dayOverrides).length > 0)) {
    return team;
  }

  const template = POSITION_PROGRAMS[key];
  return {
    planTier: team?.planTier ?? "pilot",
    exerciseDefaults: {},
    dayOverrides: {},
    customProgram: { id: `${STARTING_ID_PREFIX}${key}`, name: template.program.name, days: template.program.days }
  };
}
