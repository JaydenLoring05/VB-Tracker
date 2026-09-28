export const MAX_MEMBER_NAME_LENGTH = 60;

/** Collapses whitespace and checks length. Mirrors set_team_member_name() in schema_v41. */
export function normalizeMemberName(input: string): { ok: true; name: string } | { ok: false; error: string } {
  const name = input.replace(/\s+/g, " ").trim();
  if (!name) return { ok: false, error: "Enter a name." };
  if (name.length > MAX_MEMBER_NAME_LENGTH) {
    return { ok: false, error: `Keep it under ${MAX_MEMBER_NAME_LENGTH} characters.` };
  }
  if (name.includes("@")) return { ok: false, error: "Use a name, not an email." };
  return { ok: true, name };
}

/**
 * The name to show for a team member. Older rows stored the email as the
 * name; never show that, just the part before the @, until the coach (or
 * the schema_v41 backfill) sets a real one.
 */
export function displayMemberName(stored: string | null | undefined, fallback = "Athlete"): string {
  const name = stored?.trim();
  if (!name) return fallback;
  if (name.includes("@")) return name.split("@")[0] || fallback;
  return name;
}
