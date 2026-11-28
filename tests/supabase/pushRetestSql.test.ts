import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

// SQL can't run in unit tests; read the file and pin the rules that matter.
const sql = readFileSync(path.join(process.cwd(), "supabase", "schema_v68_push_retest.sql"), "utf8");

describe("schema_v68 push_reminder_recipients", () => {
  it("still checks the cron secret and returns needs_retest", () => {
    expect(sql).toMatch(/digest\(p_secret, 'sha256'\)/);
    expect(sql).toMatch(/needs_retest boolean/);
  });

  it("only nudges players who have tested before, in a 28 to 30 day window", () => {
    expect(sql).toMatch(/jump_tests/);
    expect(sql).toMatch(/stats_history/);
    expect(sql).toMatch(/>= 28/);
    expect(sql).toMatch(/<= 30/);
  });

  it("keeps the one-push-a-day log", () => {
    expect(sql).toMatch(/private\.push_reminder_log/);
  });
});
