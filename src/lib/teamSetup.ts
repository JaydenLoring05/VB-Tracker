export type SetupStepId = "team" | "invite" | "program" | "readiness";

export type SetupInputs = {
  /** Number of athletes on the roster. */
  athleteCount: number;
  /** Number of athletes with at least one stats check-in. */
  checkedInCount: number;
  /** The coach changed at least one day or exercise for the team. */
  programCustomized: boolean;
  /** The coach opened the Program tab (the standard plan is already assigned to athletes). */
  programReviewed: boolean;
};

export type SetupStep = {
  id: SetupStepId;
  title: string;
  done: boolean;
  /** Short status line, shown when the step is done. */
  doneText: string;
  /** What to do, shown when this is the current step. */
  hint: string;
};

export type SetupProgress = {
  steps: SetupStep[];
  completed: number;
  total: number;
  percent: number;
  /** First step that is not done, or null when everything is done. */
  next: SetupStep | null;
  /** Steps 1-3 done: the coach has nothing left to do but wait on athletes. */
  coachWorkDone: boolean;
  complete: boolean;
};

function plural(count: number, one: string, many: string) {
  return `${count} ${count === 1 ? one : many}`;
}

/**
 * Setup progress is derived entirely from data that already exists (team,
 * roster, team program rows, athlete check-ins), so it can never drift out of
 * sync with what the coach actually did.
 */
export function computeSetupProgress(input: SetupInputs): SetupProgress {
  const programDone = input.programCustomized || input.programReviewed;

  const steps: SetupStep[] = [
    {
      id: "team",
      title: "Create your team",
      done: true,
      doneText: "Team created.",
      hint: "Create your team to get an invite code."
    },
    {
      id: "invite",
      title: "Invite your athletes",
      done: input.athleteCount > 0,
      doneText: `${plural(input.athleteCount, "athlete", "athletes")} on your roster.`,
      hint: "Send athletes your invite code. They sign up, choose Athlete, and paste it in. This takes them under a minute."
    },
    {
      id: "program",
      title: "Review your training program",
      done: programDone,
      doneText: input.programCustomized ? "Customized for your team." : "Standard plan reviewed.",
      hint: "Athletes already get the standard 4-phase plan. Open the program to check it, and swap any exercise to match your team."
    },
    {
      id: "readiness",
      title: "See your team's readiness",
      done: input.checkedInCount > 0,
      doneText: `${input.checkedInCount} of ${plural(input.athleteCount, "athlete", "athletes")} checked in.`,
      hint: "Readiness appears on your roster after an athlete logs their first daily check-in. A quick reminder helps."
    }
  ];

  const completed = steps.filter((step) => step.done).length;
  const total = steps.length;
  const next = steps.find((step) => !step.done) ?? null;

  return {
    steps,
    completed,
    total,
    percent: Math.round((completed / total) * 100),
    next,
    coachWorkDone: steps.slice(0, 3).every((step) => step.done),
    complete: completed === total
  };
}

export function buildInviteMessage(teamName: string, inviteCode: string, origin: string) {
  return [
    `Join ${teamName} on NextRep.`,
    `1. Create an account at ${origin}/login`,
    `2. Choose "I'm an Athlete"`,
    `3. Enter the team invite code: ${inviteCode}`
  ].join("\n");
}

export function buildCheckInReminder(teamName: string, origin: string) {
  return [
    `Quick one for ${teamName}: log today's check-in on NextRep so I can see how everyone is recovering.`,
    `Open ${origin}/stats and fill in sleep, energy and soreness. It takes about 30 seconds.`
  ].join("\n");
}
