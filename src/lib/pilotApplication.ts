// Shared by the /pilot form (client) and /api/pilot (server), so both sides
// enforce exactly the same rules. The database repeats the length checks as a
// last line of defence (supabase/schema_v40_pilot_applications.sql).

export const LEVELS = [
  { value: "high_school", label: "High school" },
  { value: "club", label: "Club" },
  { value: "college", label: "College" },
  { value: "other", label: "Other" }
] as const;

export const TRACKING_METHODS = [
  { value: "spreadsheets", label: "Spreadsheets" },
  { value: "paper", label: "Paper or whiteboard" },
  { value: "other_app", label: "Another app" },
  { value: "nothing", label: "Nothing formal yet" },
  { value: "other", label: "Something else" }
] as const;

export const LIMITS = {
  name: { min: 2, max: 80 },
  team: { min: 2, max: 100 },
  email: { max: 254 },
  roster: { min: 1, max: 200 },
  notes: { max: 1000 }
} as const;

export type PilotField =
  | "coachName"
  | "email"
  | "teamName"
  | "level"
  | "rosterSize"
  | "trackingMethod"
  | "notes";

export type PilotApplication = {
  coachName: string;
  email: string;
  teamName: string;
  level: (typeof LEVELS)[number]["value"];
  rosterSize: number;
  trackingMethod: (typeof TRACKING_METHODS)[number]["value"];
  notes: string;
};

export type PilotFieldErrors = Partial<Record<PilotField, string>>;

export const PILOT_FIELDS: PilotField[] = [
  "coachName",
  "email",
  "teamName",
  "level",
  "rosterSize",
  "trackingMethod",
  "notes"
];

const EMAIL_PATTERN = /^[^\s@\u0000-\u001f\u007f]+@[^\s@\u0000-\u001f\u007f]+\.[^\s@\u0000-\u001f\u007f]{2,}$/;

function collapse(value: unknown): string {
  // Control characters (including NUL, which Postgres rejects) become spaces.
  return typeof value === "string"
    ? value.replace(/[\u0000-\u001f\u007f]/g, " ").trim().replace(/\s+/g, " ")
    : "";
}

// Notes keep line breaks but lose other control characters.
function cleanNotes(value: unknown): string {
  return typeof value === "string"
    ? value.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, "").trim()
    : "";
}

export function validateField(field: PilotField, raw: unknown): string | undefined {
  switch (field) {
    case "coachName": {
      const value = collapse(raw);
      if (!value) return "Enter your name.";
      if (value.length < LIMITS.name.min) return "Your name needs at least 2 characters.";
      if (value.length > LIMITS.name.max) return `Keep your name under ${LIMITS.name.max} characters.`;
      return undefined;
    }
    case "email": {
      const value = typeof raw === "string" ? raw.trim() : "";
      if (!value) return "Enter your email so we can reply.";
      if (value.length > LIMITS.email.max || !EMAIL_PATTERN.test(value)) {
        return "That email does not look right. Check it and try again.";
      }
      return undefined;
    }
    case "teamName": {
      const value = collapse(raw);
      if (!value) return "Enter your team or club name.";
      if (value.length < LIMITS.team.min) return "The team name needs at least 2 characters.";
      if (value.length > LIMITS.team.max) return `Keep the team name under ${LIMITS.team.max} characters.`;
      return undefined;
    }
    case "level":
      return LEVELS.some((level) => level.value === raw) ? undefined : "Pick the level you coach.";
    case "rosterSize": {
      const asText = typeof raw === "number" ? String(raw) : collapse(raw);
      if (asText === "") return "Enter your roster size.";
      const value = Number(asText);
      if (!Number.isInteger(value) || value < LIMITS.roster.min || value > LIMITS.roster.max) {
        return `Enter a whole number from ${LIMITS.roster.min} to ${LIMITS.roster.max}.`;
      }
      return undefined;
    }
    case "trackingMethod":
      return TRACKING_METHODS.some((method) => method.value === raw)
        ? undefined
        : "Pick what you use today.";
    case "notes": {
      return cleanNotes(raw).length > LIMITS.notes.max
        ? `Keep notes under ${LIMITS.notes.max} characters.`
        : undefined;
    }
  }
}

export type ValidationResult =
  | { ok: true; value: PilotApplication }
  | { ok: false; errors: PilotFieldErrors };

export function validatePilotApplication(input: unknown): ValidationResult {
  const record = (input && typeof input === "object" ? input : {}) as Record<string, unknown>;
  const errors: PilotFieldErrors = {};

  for (const field of PILOT_FIELDS) {
    const message = validateField(field, record[field]);
    if (message) errors[field] = message;
  }

  if (Object.keys(errors).length > 0) return { ok: false, errors };

  return {
    ok: true,
    value: {
      coachName: collapse(record.coachName),
      email: String(record.email).trim().toLowerCase(),
      teamName: collapse(record.teamName),
      level: record.level as PilotApplication["level"],
      rosterSize: Number(record.rosterSize),
      trackingMethod: record.trackingMethod as PilotApplication["trackingMethod"],
      notes: cleanNotes(record.notes)
    }
  };
}
