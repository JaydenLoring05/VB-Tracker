import { describe, expect, it } from "vitest";

import { codeToRedeem, isFinalRedeemResult, normalizeReferralCode, REFERRAL_ALPHABET, referralLink } from "@/lib/referral";

describe("normalizeReferralCode (RF-01)", () => {
  it("accepts six letters and digits from the code alphabet, any case", () => {
    expect(normalizeReferralCode("ava7k2")).toBe("AVA7K2");
    expect(normalizeReferralCode(" AVA 7K2 ")).toBe("AVA7K2");
  });

  it("rejects look-alike characters and wrong lengths", () => {
    for (const input of ["AVA0K2", "AVA1K2", "AVAIK2", "AVALK2", "AVAOK2", "AVA7K", "AVA7K22", "", null, undefined]) {
      expect(normalizeReferralCode(input), String(input)).toBeNull();
    }
  });

  it("matches the alphabet in schema_v64 (no 0, O, 1, I, L)", () => {
    expect(REFERRAL_ALPHABET).toBe("ABCDEFGHJKMNPQRSTUVWXYZ23456789");
  });
});

describe("referralLink", () => {
  it("points at /join with the code", () => {
    expect(referralLink("AVA7K2")).toMatch(/\/join\?ref=AVA7K2$/);
  });
});

describe("isFinalRedeemResult", () => {
  it("knows which answers end the attempt", () => {
    for (const result of ["ok", "invalid", "self", "already", "too_old"]) expect(isFinalRedeemResult(result)).toBe(true);
    expect(isFinalRedeemResult(null)).toBe(false);
    expect(isFinalRedeemResult("maybe")).toBe(false);
  });
});

describe("codeToRedeem (RF-02)", () => {
  it("prefers the code stored in this browser", () => {
    expect(codeToRedeem("abc234", { pending_referral: "ZZZ999" })).toBe("ABC234");
  });
  it("falls back to the code saved on the account", () => {
    expect(codeToRedeem(null, { pending_referral: "abc234" })).toBe("ABC234");
  });
  it("is null when neither is a valid code", () => {
    expect(codeToRedeem("bad", { pending_referral: 5 })).toBeNull();
    expect(codeToRedeem(null, null)).toBeNull();
  });
});
