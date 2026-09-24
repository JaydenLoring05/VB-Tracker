type DbError = { code?: string; message?: string };

/**
 * Postgres functions in supabase/*.sql raise deliberate, user-readable
 * messages ("Invalid invite code.") with `raise exception`, which arrive as
 * SQLSTATE P0001. Those are safe to show. Anything else (network failures,
 * RLS denials, constraint or syntax errors) carries raw internals and gets the
 * generic fallback instead.
 */
export function userFacingMessage(error: DbError, fallback: string) {
  if (error.code === "P0001" && error.message) return error.message;
  return fallback;
}
