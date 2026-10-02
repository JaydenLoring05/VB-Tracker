import { describe, expect, it } from "vitest";

import { inviteUrl, joinErrorMessage, normalizeInviteCode, pendingInviteFrom } from "@/lib/invite";
import { buildInviteMessage } from "@/lib/teamSetup";

describe("normalizeInviteCode", () => {
  it("upper-cases and trims real codes", () => {
    expect(normalizeInviteCode(" a1b2c3 ")).toBe("A1B2C3");
    expect(normalizeInviteCode("NR-DEMO")).toBe("NR-DEMO");
  });

  it("rejects anything that can't be a code", () => {
    expect(normalizeInviteCode("")).toBeNull();
    expect(normalizeInviteCode("abc")).toBeNull();
    expect(normalizeInviteCode("has spaces in it")).toBeNull();
    expect(normalizeInviteCode("<script>")).toBeNull();
    expect(normalizeInviteCode(undefined)).toBeNull();
  });
});

describe("inviteUrl", () => {
  it("builds the join link on the given origin", () => {
    expect(inviteUrl("https://volleyball-tracker-beta.vercel.app/", "a1b2c3")).toBe(
      "https://volleyball-tracker-beta.vercel.app/join/A1B2C3"
    );
  });
});

describe("joinErrorMessage", () => {
  it("explains a dead or regenerated code", () => {
    expect(joinErrorMessage("Invalid invite code.")).toMatch(/isn't valid anymore/);
  });

  it("explains an account that's already on a team", () => {
    expect(joinErrorMessage("You are already on a team.")).toMatch(/already on a team/);
  });

  it("falls back to a generic message without echoing server text", () => {
    expect(joinErrorMessage("duplicate key value violates unique constraint")).toBe(
      "Couldn't join that team. Check your connection and try again."
    );
  });
});

describe("pendingInviteFrom", () => {
  it("prefers this browser's saved code, then the account's", () => {
    expect(pendingInviteFrom("a1b2c3", { pending_invite: "ZZZZZZ" })).toBe("A1B2C3");
    expect(pendingInviteFrom(null, { pending_invite: "zzzzzz" })).toBe("ZZZZZZ");
  });

  it("ignores missing or malformed codes", () => {
    expect(pendingInviteFrom(null, {})).toBeNull();
    expect(pendingInviteFrom("x", { pending_invite: 42 })).toBeNull();
  });
});

describe("buildInviteMessage", () => {
  it("leads with the one-tap join link and keeps the typed-code fallback", () => {
    const message = buildInviteMessage("Varsity Girls", "a1b2c3", "https://nextrep.app");
    expect(message.split("\n")[0]).toBe("Join Varsity Girls on NextRep: https://nextrep.app/join/A1B2C3");
    expect(message).toContain("https://nextrep.app/login");
    expect(message).toContain("a1b2c3");
  });
});
