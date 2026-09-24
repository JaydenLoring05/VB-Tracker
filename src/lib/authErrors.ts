const DEAD_SESSION_CODES = new Set([
  "refresh_token_not_found",
  "refresh_token_already_used",
  "session_not_found",
  "session_expired",
  "bad_jwt",
  "user_not_found"
]);

type MaybeAuthError = {
  message?: string;
  code?: string;
  name?: string;
  status?: number;
} | null | undefined;

const CONNECTION_MESSAGE = "Couldn't reach NextRep. Check your connection and try again.";
const RATE_LIMIT_MESSAGE = "Too many attempts. Wait a minute and try again.";
const GENERIC_MESSAGE = "Something went wrong on our end. Please try again.";

/**
 * Turns a Supabase auth error into text that is safe and useful on screen.
 * Supabase's own 4xx messages ("Invalid login credentials", "Email not
 * confirmed", "User already registered") are written for end users, so they
 * pass through. Network failures, rate limits and server errors do not.
 */
export function authErrorMessage(error: NonNullable<MaybeAuthError>) {
  const status = error.status ?? 0;

  if (error.name === "AuthRetryableFetchError" || /failed to fetch|network ?error/i.test(error.message ?? "")) {
    return CONNECTION_MESSAGE;
  }

  if (status === 429 || error.code === "over_request_rate_limit" || error.code === "over_email_send_rate_limit") {
    return RATE_LIMIT_MESSAGE;
  }

  if (status >= 500 || !error.message) return GENERIC_MESSAGE;

  return error.message;
}

/**
 * True when Supabase says the stored session can never work again
 * (revoked, rotated, or malformed refresh token), so the right response is
 * to clear it and send the user to sign in. False for transient failures
 * (network, 5xx), where the session should be left alone to recover.
 */
export function isDeadSessionError(error: MaybeAuthError) {
  if (!error) return false;
  if (error.name === "AuthRetryableFetchError") return false;
  if (error.code && DEAD_SESSION_CODES.has(error.code)) return true;
  return /invalid refresh token|refresh token not found|refresh token.*already used/i.test(
    error.message ?? ""
  );
}
