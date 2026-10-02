# Tasks

What's still open after the October 2026 pass. Everything in "Ready for
review" is an open PR to `main`. Each one passed `npx tsc --noEmit`,
`npm test` and `npm run build` before it was opened.

## Ready for review (merge in this order)

Part 1:
- [ ] #20 `docs/readme-accuracy`
- [ ] #21 `chore/eslint-flat-config`
- [ ] #22 `refactor/personal-record-lib`
- [ ] #23 `test/demo-smoke-playwright`
- [ ] #24 `docs/architecture`
- [ ] #25 `chore/package-metadata`
- [ ] #26 `docs/readme-screenshots`: includes Workout Mode and film room shots from #39

Part 2:
- [ ] #27 `fix/workout-timer-keepalive`
- [ ] #28 `feat/training-load-team-events`
- [ ] #29 `feat/coach-roster-limit`
- [ ] #30 `fix/substitution-references`
- [ ] #31 `feat/missed-assigned-days`: **run `schema_v44_program_start_date.sql` first**
- [ ] #32 `feat/position-starting-programs`: **run `schema_v45_starting_program.sql` first**
- [ ] #33 `feat/data-export-account-deletion`: **run `schema_v46_delete_my_account.sql` first**
- [ ] #34 `feat/google-sign-in`: Google Cloud, Supabase and Vercel steps in the PR
- [ ] #35 `feat/daily-coach-summary-email`: **run `schema_v47_daily_coach_summary.sql` first**, then the cron secret and Resend steps in the PR
- [ ] #36 `feat/landing-product-screenshots`

Follow-ups:
- [ ] #39 `feat/demo-workout-and-film`: merge before #26 and #36 so the live demo matches their screenshots

Part 3:
- [ ] #38 `docs/refresh-suggestions-tasks` (this file and SUGGESTIONS.md)

## Merge notes

Checked by merging every branch into `main` in the order above on a
throwaway branch. All code merges cleanly, and the combined result passes
`tsc`, lint, 557 unit tests, the build and the `/demo` Playwright test.
The only conflicts are in docs, and both are "keep both sides":

- **README.md setup list.** Several branches add their schema file right
  after v35, because `main` still ends there. Merge #20 (`docs/readme-accuracy`)
  first; each later conflict then becomes "append the new file after
  `schema_v43_team_programs.sql`", in order v44 to v47.
- **TESTING.md coverage table.** Each feature branch adds one row in the
  same place. Keep every row.

## Next up

See SUGGESTIONS.md.
