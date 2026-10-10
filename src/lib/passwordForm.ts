/** Shortest password Supabase accepts for this project; the forms check it before sending. */
export const MIN_PASSWORD_LENGTH = 6;

export const PASSWORD_TOO_SHORT = `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
export const PASSWORDS_DONT_MATCH = "Passwords don't match.";

/**
 * What stops a new password from being saved (sign-up and password reset),
 * or null when it can go to Supabase. Length is checked first, since a
 * password that is too short is wrong whether or not the second copy matches.
 * The comparison is exact: no trimming and no case folding.
 */
export function newPasswordProblem(password: string, confirmPassword: string): string | null {
  if (password.length < MIN_PASSWORD_LENGTH) return PASSWORD_TOO_SHORT;
  if (password !== confirmPassword) return PASSWORDS_DONT_MATCH;
  return null;
}

export type PasswordMatch = "empty" | "mismatch" | "match";

/**
 * Live state of the confirm field while typing. "empty" until the athlete or
 * coach has typed something in it, so nothing reads as an error before they start.
 */
export function passwordMatchState(password: string, confirmPassword: string): PasswordMatch {
  if (confirmPassword === "") return "empty";
  return password === confirmPassword ? "match" : "mismatch";
}
