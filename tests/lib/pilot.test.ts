import { describe, expect, it } from "vitest";

import {
  PILOT_ROSTER_LIMIT,
  formatPilotEnd,
  paymentLink,
  pilotBanner,
  pilotDismissKey,
  rosterOverPilotLimit
} from "@/lib/pilot";

const created = "2026-09-01T18:00:00Z";
const team = { id: "t1", created_at: created, plan_tier: "pilot" as const };
const day = (n: number) => new Date(Date.parse(created) + (n - 1) * 24 * 60 * 60 * 1000 + 60 * 1000);

describe("pilotBanner", () => {
  it("stays hidden for the first 24 days", () => {
    expect(pilotBanner(team, day(1))).toBeNull();
    expect(pilotBanner(team, day(24))).toBeNull();
  });

  it("shows from day 25 with the end date and days left", () => {
    expect(pilotBanner(team, day(25))).toEqual({ endsOn: "2026-10-01T18:00:00.000Z", daysLeft: 6, ended: false });
    expect(pilotBanner(team, day(30))?.daysLeft).toBe(1);
  });

  it("says the pilot has ended after day 30, still without blocking anything", () => {
    expect(pilotBanner(team, day(31))).toMatchObject({ ended: true, daysLeft: 0 });
  });

  it("never shows for a paid team", () => {
    expect(pilotBanner({ ...team, plan_tier: "paid" }, day(28))).toBeNull();
  });

  it("ignores a team with no usable creation date", () => {
    expect(pilotBanner({ ...team, created_at: "" }, day(28))).toBeNull();
  });
});

describe("formatPilotEnd", () => {
  it("reads like a date a coach would write", () => {
    expect(formatPilotEnd("2026-10-01T18:00:00.000Z", "America/Los_Angeles")).toBe("October 1");
  });
});

describe("pilotDismissKey", () => {
  it("is per team and per stage, so 'ended' shows again after dismissing the warning", () => {
    expect(pilotDismissKey("t1", false)).not.toBe(pilotDismissKey("t1", true));
    expect(pilotDismissKey("t1", false)).not.toBe(pilotDismissKey("t2", false));
  });
});

describe("paymentLink", () => {
  it("accepts an https link and rejects anything else", () => {
    expect(paymentLink(" https://buy.stripe.com/abc ")).toBe("https://buy.stripe.com/abc");
    expect(paymentLink("http://buy.stripe.com/abc")).toBeNull();
    expect(paymentLink("javascript:alert(1)")).toBeNull();
    expect(paymentLink(undefined)).toBeNull();
  });
});

describe("rosterOverPilotLimit", () => {
  it("warns past 16 athletes on the pilot only", () => {
    expect(PILOT_ROSTER_LIMIT).toBe(16);
    expect(rosterOverPilotLimit(16, "pilot")).toBe(false);
    expect(rosterOverPilotLimit(17, "pilot")).toBe(true);
    expect(rosterOverPilotLimit(40, "paid")).toBe(false);
  });
});
