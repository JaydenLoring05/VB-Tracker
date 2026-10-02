// Invite links: /join/<code> carries a team's invite code so an athlete
// joins in one tap (signed in) or lands on the team after sign-up and
// onboarding (signed out). Pure helpers; the page is src/app/join/[code].

const CODE = /^[A-Z0-9-]{4,16}$/;

/** Where a pending invite code waits while a new athlete signs up. */
export const PENDING_INVITE_KEY = "nextrep-pending-invite";

/** An upper-cased code, or null when the input can't be an invite code. */
export function normalizeInviteCode(raw: string | null | undefined): string | null {
  const code = raw?.trim().toUpperCase() ?? "";
  return CODE.test(code) ? code : null;
}

export function inviteUrl(origin: string, code: string): string {
  return `${origin.replace(/\/+$/, "")}/join/${encodeURIComponent(code.trim().toUpperCase())}`;
}

/** A user-facing message for a join_team() error. Server text is never shown as-is. */
export function joinErrorMessage(serverMessage: string | null | undefined): string {
  if (serverMessage?.includes("Invalid invite code")) {
    return "This invite link isn't valid anymore. Your coach may have made a new code. Ask them for the latest link.";
  }
  if (serverMessage?.includes("already on a team")) {
    return "This account is already on a team. Athletes can be on one team at a time; ask your current coach to remove you first.";
  }
  return "Couldn't join that team. Check your connection and try again.";
}

/** The invite code to use after sign-up: this browser's saved one, else the one stored on the account. */
export function pendingInviteFrom(
  stored: string | null | undefined,
  userMetadata: Record<string, unknown> | null | undefined
): string | null {
  const fromMetadata = userMetadata?.pending_invite;
  return normalizeInviteCode(stored) ?? normalizeInviteCode(typeof fromMetadata === "string" ? fromMetadata : null);
}
