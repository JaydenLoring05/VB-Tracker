import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

// public.daily_summary_data() is SQL, so unit tests can't run it. What they can
// do is read the schema files and check the one line that broke production:
// team_calendar_events.date is a text column ("YYYY-MM-DD", schema_v33) and
// p_today is a date. Comparing the two directly fails in Postgres with
// "operator does not exist: text = date", which stopped every daily summary
// email (schema_v47, fixed in schema_v54).
//
// The function is replaced as a whole each time it changes, so a later schema
// file that copies an old body would bring the bug back. These tests read
// whichever file defines the function last.

const SCHEMA_DIR = path.join(process.cwd(), "supabase");
const DEFINES_FUNCTION = /create or replace function public\.daily_summary_data\s*\(/i;

function schemaVersion(file: string): number {
  const match = file.match(/^schema_v(\d+)/);
  return match ? Number(match[1]) : 0;
}

/** Schema files that define daily_summary_data, oldest first. */
function filesDefiningFunction(): string[] {
  return readdirSync(SCHEMA_DIR)
    .filter((file) => file.endsWith(".sql"))
    .sort((a, b) => schemaVersion(a) - schemaVersion(b))
    .filter((file) => DEFINES_FUNCTION.test(readFileSync(path.join(SCHEMA_DIR, file), "utf8")));
}

/** The function's body (between the $$ markers) with SQL comments removed. */
function functionBody(file: string): string {
  const sql = readFileSync(path.join(SCHEMA_DIR, file), "utf8");
  const fromDefinition = sql.slice(sql.search(DEFINES_FUNCTION));
  const [, body] = fromDefinition.split("$$");
  return (body ?? "").replace(/--.*$/gm, "");
}

/** True when a text date column is compared straight to the p_today date. */
function comparesTextDateToDate(body: string): boolean {
  return /\.date\s*=\s*p_today\b(?!\s*::\s*text)/i.test(body) || /\bp_today\s*=\s*\w+\.date\b/i.test(body);
}

describe("daily_summary_data SQL", () => {
  const files = filesDefiningFunction();
  const latest = files[files.length - 1];

  it("is defined in the schema files", () => {
    expect(files.length).toBeGreaterThan(0);
    expect(files[0]).toBe("schema_v47_daily_coach_summary.sql");
  });

  it("recognises the comparison that broke production", () => {
    // The v47 body is the one that failed, so the check must flag it.
    expect(comparesTextDateToDate(functionBody("schema_v47_daily_coach_summary.sql"))).toBe(true);
    expect(comparesTextDateToDate("where e.date = to_char(p_today, 'YYYY-MM-DD')")).toBe(false);
  });

  it("compares the text event date with p_today as text in its latest definition", () => {
    const body = functionBody(latest);
    expect(comparesTextDateToDate(body)).toBe(false);
    expect(body).toContain("e.date = to_char(p_today, 'YYYY-MM-DD')");
  });

  it("still checks the cron secret in its latest definition", () => {
    const body = functionBody(latest);
    expect(body).toContain("private.cron_secrets");
    expect(body).toContain("raise exception 'not authorized'");
  });
});
