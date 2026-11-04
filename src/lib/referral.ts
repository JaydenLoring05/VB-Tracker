import { SITE_URL } from "@/lib/site";

/**
 * Referral codes (RF-01). Every athlete and coach gets a 6-character code.
 * A new account that signs up with one gets an extra free week on the
 * athlete plan; the owner of the code gets XP and the Recruiter badge.
 * Codes are made and redeemed by database functions (schema_v64), so a
 * client can't hand itself a referral.
 */

/** No 0/O, 1/I/L: easy to read out loud and type on a phone. */
export const REFERRAL_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
export const REFERRAL_KEY = "nextrep-referral";
/** Extra trial days for an athlete who signed up with a referral code. */
export const REFERRAL_TRIAL_BONUS_DAYS = 7;
export { XP_PER_REFERRAL } from "@/lib/progression";

/** A valid code in upper case, or null. Accepts lower case and stray spaces. */
export function normalizeReferralCode(input: string | null | undefined): string | null {
  const code = (input ?? "").replace(/\s+/g, "").toUpperCase();
  if (code.length !== 6) return null;
  return [...code].every((char) => REFERRAL_ALPHABET.includes(char)) ? code : null;
}

export function referralLink(code: string): string {
  return `${SITE_URL}/join?ref=${encodeURIComponent(code)}`;
}

export type RedeemResult = "ok" | "invalid" | "self" | "already" | "too_old";

/** Whether a redeem attempt is finished (keep the stored code only if the call itself failed). */
export function isFinalRedeemResult(result: unknown): result is RedeemResult {
  return result === "ok" || result === "invalid" || result === "self" || result === "already" || result === "too_old";
}
