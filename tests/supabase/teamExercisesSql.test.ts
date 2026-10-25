import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

// Row-level security can't run in unit tests (no database). These checks read
// schema_v59 and pin the access rules the F-22 screens rely on: teammates read,
// only the team's coach writes, one name per team.

const sql = readFileSync(path.join(process.cwd(), "supabase", "schema_v59_team_exercises.sql"), "utf8").replace(
  /--.*$/gm,
  ""
);
const squash = (text: string) => text.replace(/\s+/g, " ").toLowerCase();
const body = squash(sql);

describe("schema_v59 team_exercises", () => {
  it("turns on row-level security", () => {
    expect(body).toContain("alter table public.team_exercises enable row level security");
  });

  it("lets team members read through is_team_member()", () => {
    expect(body).toMatch(
      /create policy "team members can view team exercises" on public\.team_exercises for select using \( ?public\.is_team_member\(team_exercises\.team_id\) ?\)/
    );
  });

  it("lets only the team's coach write, on both the using and the check side", () => {
    expect(body).toMatch(
      /create policy "coach can manage team exercises" on public\.team_exercises for all using \( public\.is_team_coach\(team_exercises\.team_id\) \) with check \( public\.is_team_coach\(team_exercises\.team_id\) \)/
    );
  });

  it("has no other policy that could widen access", () => {
    expect(body.match(/create policy/g)).toHaveLength(2);
  });

  it("keeps one exercise per name per team, ignoring case and spaces", () => {
    expect(body).toContain("on public.team_exercises (team_id, lower(btrim(name)))");
  });

  it("only stores https video links", () => {
    expect(body).toContain("video_url ~* '^https://'");
  });
});
