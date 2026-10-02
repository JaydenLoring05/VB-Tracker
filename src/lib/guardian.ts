// The parent/guardian step for athletes under 18 (profiles columns from
// schema_v52). Pure helpers shared by onboarding, the Today/Settings prompt
// and the coach roster flag. No date of birth is ever collected.

export type GuardianAnswer = {
  isAdult: boolean | null;
  name: string;
  email: string;
  acknowledged: boolean;
};

export type GuardianFields = {
  is_adult: boolean;
  guardian_name: string | null;
  guardian_email: string | null;
  guardian_acknowledged_at: string | null;
};

const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export function validateGuardianAnswer(
  answer: GuardianAnswer,
  now: Date = new Date()
): { ok: true; fields: GuardianFields } | { ok: false; error: string } {
  if (answer.isAdult === null) return { ok: false, error: "Choose whether you're 18 or older." };
  if (answer.isAdult) {
    return { ok: true, fields: { is_adult: true, guardian_name: null, guardian_email: null, guardian_acknowledged_at: null } };
  }

  const name = answer.name.replace(/\s+/g, " ").trim();
  const email = answer.email.trim().toLowerCase();
  if (!name || name.length > 100) return { ok: false, error: "Enter your parent or guardian's name." };
  if (!EMAIL.test(email) || email.length > 254) return { ok: false, error: "Enter a valid email for your parent or guardian." };
  if (!answer.acknowledged) return { ok: false, error: "Please confirm your parent or guardian knows." };

  return {
    ok: true,
    fields: { is_adult: false, guardian_name: name, guardian_email: email, guardian_acknowledged_at: now.toISOString() }
  };
}

type GuardianProfile = {
  is_adult?: boolean | null;
  guardian_name?: string | null;
  guardian_email?: string | null;
  guardian_acknowledged_at?: string | null;
};

/** "missing" means the coach should see a "guardian info missing" flag. */
export function guardianStatus(profile: GuardianProfile): "adult" | "complete" | "missing" {
  if (profile.is_adult === true) return "adult";
  if (profile.is_adult === false && profile.guardian_name && profile.guardian_email && profile.guardian_acknowledged_at) {
    return "complete";
  }
  return "missing";
}
