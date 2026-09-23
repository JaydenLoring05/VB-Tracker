# CLAUDE.md

Rules for autonomous work on VB-Tracker (NextRep).

## Stack

- Next.js + TypeScript + Supabase.
- Follow existing patterns: hooks live in `src/hooks`, RLS is enforced via
  `is_team_coach(team_id)` (see `supabase/schema_v20_teams.sql`), database
  changes are numbered `supabase/schema_vNN_*.sql` files.

## Workflow

- One feature = one branch = one PR to `main`. Never push to or merge into
  `main` directly.
- Before every PR: run unit tests, `npx tsc --noEmit`, and `npm run build`,
  and they must all pass.
- Database changes go in a new `supabase/schema_vNN_*.sql` file. Never run
  SQL yourself. Flag it at the top of the PR description as "⚠️ Needs SQL
  run before merge."
- Never read, print, or commit `.env` files or keys.
- Only change files the task needs. No unrelated refactors.
- If blocked or unsure, write the question in the PR description and move
  to the next task.
