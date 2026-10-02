// Self-serve data export and account deletion. Pure helpers; the queries run
// in useAccountData with the user's own session, so row-level security
// limits every read to rows the user owns.

/** Tables exported for the signed-in user, and the column that holds their id. */
export const EXPORT_TABLES: { table: string; column: string }[] = [
  { table: "profiles", column: "user_id" },
  { table: "latest_stats", column: "user_id" },
  { table: "stats_history", column: "user_id" },
  { table: "workout_sessions", column: "user_id" },
  { table: "workout_sets", column: "user_id" },
  { table: "exercise_checks", column: "user_id" },
  { table: "workout_logs", column: "user_id" },
  { table: "workout_notes", column: "user_id" },
  { table: "calendar_events", column: "user_id" },
  { table: "prs", column: "user_id" },
  { table: "exercise_substitutions", column: "user_id" },
  { table: "performance_profiles", column: "user_id" },
  { table: "team_members", column: "user_id" },
  { table: "removal_notices", column: "user_id" },
  // Film tags a coach made about this athlete's plays.
  { table: "film_tags", column: "athlete_id" },
  // Teams this user created as a coach.
  { table: "teams", column: "coach_id" }
];

export type DataExport = {
  format: "nextrep-data-export";
  version: 1;
  exportedAt: string;
  user: { id: string; email: string | null };
  data: Record<string, unknown[]>;
  /** Tables that couldn't be read (for example, not created in this project yet). */
  skipped: string[];
};

export function buildDataExport({
  userId,
  email,
  exportedAt,
  sections,
  skipped
}: {
  userId: string;
  email: string | null;
  exportedAt: Date;
  sections: Record<string, unknown[]>;
  skipped: string[];
}): DataExport {
  return {
    format: "nextrep-data-export",
    version: 1,
    exportedAt: exportedAt.toISOString(),
    user: { id: userId, email },
    data: sections,
    skipped
  };
}

export function exportFileName(date: Date): string {
  return `nextrep-data-${date.toISOString().slice(0, 10)}.json`;
}

export const DELETE_CONFIRMATION_PHRASE = "delete my account";

export function isDeleteConfirmed(input: string): boolean {
  return input.trim().toLowerCase() === DELETE_CONFIRMATION_PHRASE;
}
