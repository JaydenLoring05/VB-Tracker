# Tasks

What's still open after the October 2026 pass. Everything in "Ready for
review" is finished, committed and checked locally (`npx tsc --noEmit`,
`npm test`, `npm run build`). It just needs to reach GitHub.

## Blocked: get the branches onto GitHub

- [ ] **Fix GitHub push access.** `git push` returned `403: Your account is
      suspended`, and `gh` isn't installed, so no branch was pushed and no PR
      was opened. Every branch below exists locally in this repo. Once
      access works, push each one and open a PR to `main`. The PR text is in
      the PR notes folder next to the repo, one file per branch, in order.

## Ready for review (one branch = one PR, in this order)

Part 1:
- [ ] `docs/readme-accuracy`
- [ ] `chore/eslint-flat-config`
- [ ] `refactor/personal-record-lib`
- [ ] `test/demo-smoke-playwright`
- [ ] `docs/architecture`
- [ ] `chore/package-metadata`
- [ ] `docs/readme-screenshots`: has a question for you at the top
      (`/demo` has no Workout Mode or film room to screenshot)

Part 2:
- [ ] `fix/workout-timer-keepalive`
- [ ] `feat/training-load-team-events`
- [ ] `feat/coach-roster-limit`
- [ ] `fix/substitution-references`
- [ ] `feat/missed-assigned-days`: **run `schema_v44_program_start_date.sql` first**
- [ ] `feat/position-starting-programs`: **run `schema_v45_starting_program.sql` first**
- [ ] `feat/data-export-account-deletion`: **run `schema_v46_delete_my_account.sql` first**
- [ ] `feat/google-sign-in`: Google Cloud, Supabase and Vercel steps in the PR
- [ ] `feat/daily-coach-summary-email`: **run `schema_v47_daily_coach_summary.sql` first**, then the cron secret and Resend steps in the PR
- [ ] `feat/landing-product-screenshots`
- [ ] `feat/brand-monogram`: pick option A, B or C

Part 3:
- [ ] `docs/refresh-suggestions-tasks` (this file and SUGGESTIONS.md)

## Merge notes

Checked by merging every branch into `main` in the order above on a
throwaway branch. All code merges cleanly, and the combined result passes
`tsc`, lint, 557 unit tests, the build and the `/demo` Playwright test.
The only conflicts are in docs, and both are "keep both sides":

- **README.md setup list.** Several branches add their schema file right
  after v35, because `main` still ends there. Merge `docs/readme-accuracy`
  first; each later conflict then becomes "append the new file after
  `schema_v43_team_programs.sql`", in order v44 to v47.
- **TESTING.md coverage table.** Each feature branch adds one row in the
  same place. Keep every row.

## Next up

See SUGGESTIONS.md.
