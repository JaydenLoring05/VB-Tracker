import { describe, expect, it } from "vitest";

import {
  buildCheckInReminder,
  buildInviteMessage,
  computeSetupProgress,
  type SetupInputs
} from "@/lib/teamSetup";

const base: SetupInputs = {
  athleteCount: 0,
  checkedInCount: 0,
  programCustomized: false,
  programReviewed: false
};

const doneIds = (input: Partial<SetupInputs>) =>
  computeSetupProgress({ ...base, ...input })
    .steps.filter((step) => step.done)
    .map((step) => step.id);

describe("computeSetupProgress", () => {
  it("always counts team creation as done and points at inviting athletes next", () => {
    const progress = computeSetupProgress(base);

    expect(progress.steps.map((step) => step.id)).toEqual(["team", "invite", "program", "readiness"]);
    expect(doneIds({})).toEqual(["team"]);
    expect(progress.completed).toBe(1);
    expect(progress.total).toBe(4);
    expect(progress.percent).toBe(25);
    expect(progress.next?.id).toBe("invite");
    expect(progress.coachWorkDone).toBe(false);
    expect(progress.complete).toBe(false);
  });

  it("marks invite done as soon as one athlete joins", () => {
    expect(doneIds({ athleteCount: 1 })).toEqual(["team", "invite"]);
    expect(doneIds({ athleteCount: 0 })).not.toContain("invite");
  });

  it("marks the program step done when the coach customized or reviewed it", () => {
    expect(doneIds({ programReviewed: true })).toEqual(["team", "program"]);
    expect(doneIds({ programCustomized: true })).toEqual(["team", "program"]);
    expect(doneIds({ programCustomized: true, programReviewed: true })).toEqual(["team", "program"]);
  });

  it("marks readiness done once any athlete has checked in", () => {
    expect(doneIds({ checkedInCount: 1 })).toEqual(["team", "readiness"]);
  });

  it("lets steps complete out of order and points next at the first gap", () => {
    const progress = computeSetupProgress({ ...base, programReviewed: true, checkedInCount: 2 });

    expect(progress.completed).toBe(3);
    expect(progress.percent).toBe(75);
    expect(progress.next?.id).toBe("invite");
    expect(progress.coachWorkDone).toBe(false);
  });

  it("has coachWorkDone but is not complete when only athlete check-ins are missing", () => {
    const progress = computeSetupProgress({ ...base, athleteCount: 12, programReviewed: true });

    expect(progress.coachWorkDone).toBe(true);
    expect(progress.complete).toBe(false);
    expect(progress.next?.id).toBe("readiness");
    expect(progress.percent).toBe(75);
  });

  it("is not coachWorkDone until the program step is done too", () => {
    const progress = computeSetupProgress({ ...base, athleteCount: 12, checkedInCount: 9 });

    expect(progress.coachWorkDone).toBe(false);
    expect(progress.next?.id).toBe("program");
  });

  it("is complete with no next step when everything is done", () => {
    const progress = computeSetupProgress({
      athleteCount: 12,
      checkedInCount: 9,
      programCustomized: true,
      programReviewed: true
    });

    expect(progress.complete).toBe(true);
    expect(progress.coachWorkDone).toBe(true);
    expect(progress.next).toBeNull();
    expect(progress.completed).toBe(4);
    expect(progress.percent).toBe(100);
  });

  it("writes accurate, correctly pluralized status lines", () => {
    const one = computeSetupProgress({ ...base, athleteCount: 1, checkedInCount: 1 });
    expect(one.steps[1].doneText).toBe("1 athlete on your roster.");
    expect(one.steps[3].doneText).toBe("1 of 1 athlete checked in.");

    const many = computeSetupProgress({ ...base, athleteCount: 12, checkedInCount: 9 });
    expect(many.steps[1].doneText).toBe("12 athletes on your roster.");
    expect(many.steps[3].doneText).toBe("9 of 12 athletes checked in.");
  });

  it("distinguishes customized from reviewed program text", () => {
    expect(computeSetupProgress({ ...base, programCustomized: true }).steps[2].doneText).toBe(
      "Customized for your team."
    );
    expect(computeSetupProgress({ ...base, programReviewed: true }).steps[2].doneText).toBe(
      "Standard plan reviewed."
    );
  });

  it("gives every step a title and a hint", () => {
    for (const step of computeSetupProgress(base).steps) {
      expect(step.title).toBeTruthy();
      expect(step.hint).toBeTruthy();
    }
  });
});

describe("share messages", () => {
  it("builds an invite message with team, code and sign-up link", () => {
    const message = buildInviteMessage("Varsity Girls", "NR-1234", "https://nextrep.app");
    expect(message).toContain("Join Varsity Girls on NextRep.");
    expect(message).toContain("https://nextrep.app/login");
    expect(message).toContain("NR-1234");
  });

  it("builds a check-in reminder pointing at /stats", () => {
    const message = buildCheckInReminder("Varsity Girls", "https://nextrep.app");
    expect(message).toContain("Varsity Girls");
    expect(message).toContain("https://nextrep.app/stats");
  });
});
