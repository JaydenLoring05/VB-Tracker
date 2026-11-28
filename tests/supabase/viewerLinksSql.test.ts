import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

// The viewer link functions (P-06) are SQL, so unit tests can't run them.
// These read schema_v67 and check the privacy promises the page makes.

const sql = readFileSync(path.join(process.cwd(), "supabase", "schema_v67_viewer_links.sql"), "utf8");

function functionBody(name: string): string {
  const start = sql.indexOf(`create or replace function public.${name}(`);
  expect(start, name).toBeGreaterThan(-1);
  const end = sql.indexOf("$$;", start);
  return sql.slice(start, end);
}

describe("schema_v67 viewer links", () => {
  it("stores only a hash of the token", () => {
    expect(sql).toMatch(/token_hash text not null unique/);
    expect(sql).not.toMatch(/\btoken text\b/);
    expect(functionBody("create_viewer_link")).toContain("extensions.digest(v_token, 'sha256')");
  });

  it("lets anyone with a link read the summary, but only signed-in users make or revoke links", () => {
    expect(sql).toContain("grant execute on function public.viewer_summary(text) to anon, authenticated;");
    expect(sql).toContain("grant execute on function public.create_viewer_link(text, text) to authenticated;");
    expect(sql).toContain("grant execute on function public.revoke_viewer_link(uuid) to authenticated;");
    expect(functionBody("revoke_viewer_link")).toContain("athlete_id = auth.uid()");
  });

  it("ignores revoked links", () => {
    expect(functionBody("viewer_summary")).toContain("and revoked_at is null");
  });

  it("never returns pain, sleep values, soreness, weight, notes or email", () => {
    const body = functionBody("viewer_summary");
    for (const field of ["knee_pain", "shoulder_pain", "soreness", "energy", "weight", "pullups", "notes", "email", "guardian"]) {
      expect(body, field).not.toContain(field);
    }
    // Sleep is only used to tell a check-in from a test-day save, never returned.
    expect(body).not.toMatch(/'sleep'/);
  });
});
