// Shared by the /join sign-up form (client) and /api/waitlist (server), so both
// sides enforce the same rules. The database repeats them as a last line of
// defence (supabase/schema_v60_waitlist_signups.sql).

import { AGE_GROUPS } from "@/lib/trainingProfile";

export const POSITIONS = [
  { value: "outside", label: "Outside hitter" },
  { value: "opposite", label: "Opposite" },
  { value: "middle", label: "Middle blocker" },
  { value: "setter", label: "Setter" },
  { value: "libero", label: "Libero / DS" },
  { value: "not_sure", label: "Not sure yet" },
  { value: "other_sport", label: "Another sport" }
] as const;

export const WAITLIST_AGE_GROUPS = AGE_GROUPS;

export const WAITLIST_LIMITS = {
  name: { min: 2, max: 80 },
  email: { max: 254 }
} as const;

export type WaitlistField = "name" | "email" | "position" | "ageGroup";

export type WaitlistSignup = {
  name: string;
  email: string;
  position: (typeof POSITIONS)[number]["value"] | null;
  ageGroup: (typeof AGE_GROUPS)[number]["value"] | null;
};

export type WaitlistFieldErrors = Partial<Record<WaitlistField, string>>;

export const WAITLIST_FIELDS: WaitlistField[] = ["name", "email", "position", "ageGroup"];

const EMAIL_PATTERN = /^[^\s@\u0000-\u001f\u007f]+@[^\s@\u0000-\u001f\u007f]+\.[^\s@\u0000-\u001f\u007f]{2,}$/;

function collapse(value: unknown): string {
  return typeof value === "string"
    ? value.replace(/[\u0000-\u001f\u007f]/g, " ").trim().replace(/\s+/g, " ")
    : "";
}

/** Optional select: blank (or missing) is fine, anything else must be on the list. */
function optionalChoice(raw: unknown, list: readonly { value: string }[]): boolean {
  if (raw === undefined || raw === null || raw === "") return true;
  return list.some((item) => item.value === raw);
}

export function validateWaitlistField(field: WaitlistField, raw: unknown): string | undefined {
  switch (field) {
    case "name": {
      const value = collapse(raw);
      if (!value) return "Enter your name.";
      if (value.length < WAITLIST_LIMITS.name.min) return "Your name needs at least 2 characters.";
      if (value.length > WAITLIST_LIMITS.name.max) return `Keep your name under ${WAITLIST_LIMITS.name.max} characters.`;
      return undefined;
    }
    case "email": {
      const value = typeof raw === "string" ? raw.trim() : "";
      if (!value) return "Enter your email so we can tell you when it opens.";
      if (value.length > WAITLIST_LIMITS.email.max || !EMAIL_PATTERN.test(value)) {
        return "That email does not look right. Check it and try again.";
      }
      return undefined;
    }
    case "position":
      return optionalChoice(raw, POSITIONS) ? undefined : "Pick a position from the list, or leave it blank.";
    case "ageGroup":
      return optionalChoice(raw, AGE_GROUPS) ? undefined : "Pick an age group from the list, or leave it blank.";
  }
}

export type WaitlistValidation =
  | { ok: true; value: WaitlistSignup }
  | { ok: false; errors: WaitlistFieldErrors };

export function validateWaitlistSignup(input: unknown): WaitlistValidation {
  const record = (input && typeof input === "object" ? input : {}) as Record<string, unknown>;
  const errors: WaitlistFieldErrors = {};

  for (const field of WAITLIST_FIELDS) {
    const message = validateWaitlistField(field, record[field]);
    if (message) errors[field] = message;
  }

  if (Object.keys(errors).length > 0) return { ok: false, errors };

  return {
    ok: true,
    value: {
      name: collapse(record.name),
      email: String(record.email).trim().toLowerCase(),
      position: record.position ? (record.position as WaitlistSignup["position"]) : null,
      ageGroup: record.ageGroup ? (record.ageGroup as WaitlistSignup["ageGroup"]) : null
    }
  };
}
