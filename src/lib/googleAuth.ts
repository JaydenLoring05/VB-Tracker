import { MAX_MEMBER_NAME_LENGTH } from "@/lib/memberName";

// Google sign-in through Supabase Auth. Off unless
// NEXT_PUBLIC_GOOGLE_AUTH_ENABLED is "true": the Google OAuth client itself
// is configured in the Google Cloud and Supabase dashboards, not in this
// app, so the flag is how the app knows that setup is done.

export function isGoogleSignInEnabled(flag: string | undefined): boolean {
  return flag?.trim().toLowerCase() === "true";
}

/** Where Google (via Supabase) sends the user back: the existing code-exchange route. */
export function googleOAuthRedirectTo(origin: string): string {
  return `${origin.replace(/\/+$/, "")}/auth/callback`;
}

/**
 * A user-facing message when the provider redirected back with an error
 * instead of a code. Provider text is never shown as-is.
 */
export function oauthErrorMessage(params: URLSearchParams): string | null {
  const error = params.get("error");
  if (!error) return null;
  if (error === "access_denied") {
    return "Google sign-in was cancelled. Try again, or sign in with your email and password.";
  }
  return "Google sign-in didn't work. Try again, or sign in with your email and password.";
}

/**
 * A display name from the provider's user metadata (Google sends full_name
 * and name), so Google sign-ups show a real name on the roster like email
 * sign-ups do. Null when there is nothing usable.
 */
export function nameFromOAuthMetadata(metadata: Record<string, unknown> | undefined): string | null {
  const raw = metadata?.full_name ?? metadata?.name;
  if (typeof raw !== "string") return null;
  const name = raw.replace(/\s+/g, " ").trim().slice(0, MAX_MEMBER_NAME_LENGTH).trim();
  if (!name || name.includes("@")) return null;
  return name;
}
