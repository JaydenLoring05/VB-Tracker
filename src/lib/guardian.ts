// Age and the parent-consent step (N-03). Pure helpers shared by sign-up,
// onboarding, the Today/Settings prompt and the coach roster flag.
//
// Jayden's rule (2026-11-03): athletes under 13 need a parent or guardian to
// give consent (their email, a checkbox, a link to the privacy policy)
// before the account is created. 13 and up have no parent step. No date of
// birth is stored: only the age group and whether the athlete is under 13.

import type { AgeGroup } from "@/lib/trainingProfile";

export const PARENT_CONSENT_AGE = 13;
export const MIN_AGE = 5;
export const MAX_AGE = 99;

export type GuardianAnswer = {
  /** Age as typed. */
  age: string;
  parentEmail: string;
  /** The parent ticked "I'm the parent or guardian and I agree". */
  agreed: boolean;
};

export const EMPTY_GUARDIAN_ANSWER: GuardianAnswer = { age: "", parentEmail: "", agreed: false };

export type GuardianFields = {
  is_adult: boolean;
  under_13: boolean;
  age_group: AgeGroup;
  guardian_name: null;
  guardian_email: string | null;
  guardian_acknowledged_at: string | null;
};

const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

/** A whole-number age between 5 and 99, or null. */
export function parseAge(input: string): number | null {
  const trimmed = input.trim();
  if (!/^\d{1,2}$/.test(trimmed)) return null;
  const age = Number(trimmed);
  return age >= MIN_AGE && age <= MAX_AGE ? age : null;
}

export function ageGroupForAge(age: number): AgeGroup {
  if (age < 14) return "under14";
  if (age < 18) return "14to17";
  return "18plus";
}

/** True when the typed age is valid and under 13: show the parent step. */
export function needsParentConsent(ageInput: string): boolean {
  const age = parseAge(ageInput);
  return age !== null && age < PARENT_CONSENT_AGE;
}

export function validateGuardianAnswer(
  answer: GuardianAnswer,
  now: Date = new Date()
): { ok: true; fields: GuardianFields } | { ok: false; error: string } {
  const age = parseAge(answer.age);
  if (age === null) return { ok: false, error: "Enter your age." };

  const base = { is_adult: age >= 18, age_group: ageGroupForAge(age), guardian_name: null } as const;
  if (age >= PARENT_CONSENT_AGE) {
    return { ok: true, fields: { ...base, under_13: false, guardian_email: null, guardian_acknowledged_at: null } };
  }

  const email = answer.parentEmail.trim().toLowerCase();
  if (!EMAIL.test(email) || email.length > 254) return { ok: false, error: "Enter your parent or guardian's email." };
  if (!answer.agreed) return { ok: false, error: "A parent or guardian needs to tick the box to agree." };

  return {
    ok: true,
    fields: { ...base, under_13: true, guardian_email: email, guardian_acknowledged_at: now.toISOString() }
  };
}

type GuardianProfile = {
  is_adult?: boolean | null;
  under_13?: boolean | null;
  guardian_email?: string | null;
  guardian_acknowledged_at?: string | null;
};

/**
 * "missing" means the athlete hasn't told us their age, or is under 13 with
 * no parent consent: the coach sees a flag and the athlete sees the prompt.
 */
export function guardianStatus(profile: GuardianProfile): "adult" | "complete" | "missing" {
  if (profile.is_adult === true) return "adult";
  if (profile.under_13 === true) {
    return profile.guardian_email && profile.guardian_acknowledged_at ? "complete" : "missing";
  }
  // 13 to 17 with under_13 recorded (N-03), or under 18 with a guardian from #49.
  if (profile.is_adult === false && (profile.under_13 === false || (profile.guardian_email && profile.guardian_acknowledged_at))) {
    return "complete";
  }
  return "missing";
}

/**
 * What sign-up keeps on the new account (auth user metadata) so onboarding
 * can save it to the profile, even when the confirmation email opens in
 * another browser. Google sign-up keeps the same object in localStorage.
 */
export type SignupAgeMetadata = {
  signup_age_group: AgeGroup;
  signup_under_13: boolean;
  signup_parent_email: string | null;
  signup_parent_consent_at: string | null;
};

export const SIGNUP_AGE_KEY = "nextrep-signup-age";

export function signupAgeMetadata(fields: GuardianFields): SignupAgeMetadata {
  return {
    signup_age_group: fields.age_group,
    signup_under_13: fields.under_13,
    signup_parent_email: fields.guardian_email,
    signup_parent_consent_at: fields.guardian_acknowledged_at
  };
}

/** Reads sign-up metadata back into profile fields, or null when there is none or it's malformed. */
export function fieldsFromSignupMetadata(meta: unknown): GuardianFields | null {
  if (!meta || typeof meta !== "object") return null;
  const m = meta as Partial<Record<keyof SignupAgeMetadata, unknown>>;
  const group = m.signup_age_group;
  if (group !== "under14" && group !== "14to17" && group !== "18plus") return null;
  const under13 = m.signup_under_13 === true;
  const email = typeof m.signup_parent_email === "string" ? m.signup_parent_email : null;
  const consentAt = typeof m.signup_parent_consent_at === "string" ? m.signup_parent_consent_at : null;
  if (under13 && (!email || !consentAt)) return null;
  return {
    is_adult: group === "18plus",
    under_13: under13,
    age_group: group,
    guardian_name: null,
    guardian_email: under13 ? email : null,
    guardian_acknowledged_at: under13 ? consentAt : null
  };
}
