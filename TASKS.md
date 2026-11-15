# Tasks

Refreshed on Sunday 15 November 2026. Everything through #125 is merged.
This week #121 (landing page, P-01), #122 (film removed), #124 (athlete
plan, P-02) and #125 (docs) were merged. The launch steps (database,
accounts, dry run) are in [docs/LAUNCH_CHECKLIST.md](docs/LAUNCH_CHECKLIST.md).

## Open pull requests

### Ready to review

| PR | What | Needs SQL | Merges into `main` |
| --- | --- | --- | --- |
| #126 | P-03: athlete onboarding quiz (years lifting, equipment, two goals, season, practice days) | **Yes**, `schema_v66_onboarding_quiz.sql` | Clean |
| This PR | Housekeeping: this file; F-17, F-22, F-23, F-24 to `building`; rows for F-28 and B-10 | No | Clean |
| #87 | F-24 part 1: add a day from another program in the plan builder | No | Clean |

### Conflict with `main` (need a rebase or a rebuild)

| PR | What | Needs SQL |
| --- | --- | --- |
| #101 | F-22: a coach's own exercises in the Exercise Library | **Yes**, `schema_v59_team_exercises.sql` |
| #75 | F-23: sections in a day, with a warm-up written once (carries #73) | No |
| #76, #77, #78 | F-17 parts 1-3: paste a plan, upload a file, a Google Sheets link (stacked on #75) | No |
| #83 | F-28: weight targets as a percent of max | No |
| #74 | B-10: Continue Workout reopens the workout in progress | No |

### Can be closed (already shipped or replaced)

- #73: F-16 shipped in #81, and #75 carries it.
- #72, #88, #102, #105: old housekeeping, replaced by later ones.
- #123: last week's housekeeping. It now conflicts with `main`, and this
  PR carries its changes.
- #86: docs only. It asks for `schema_v55_push_reminders.sql` to be run,
  which the launch checklist already covers.

## Needs you

- [ ] Review #126 (P-03). Run `schema_v66_onboarding_quiz.sql`, then merge.
      It has three questions for you in the description.
- [ ] Merge this PR, then #87, if you're happy with them.
- [ ] Decide on the plan builder stack: should next Sunday's run rebuild
      F-23 (#75) on current `main`? F-17 (#76 to #78) and F-19 (supersets)
      depend on it. If yes, close #75 to #78 and say so in the F-23 row.
- [ ] Close the PRs listed under "Can be closed".
- [ ] Confirm that the SQL files up to `schema_v65` were run in the Supabase
      SQL Editor. The check queries are in the launch checklist.
- [ ] P-04 and P-05 are size L, so the weekly update won't start them.
      Next Sunday's run splits P-04 into smaller rows and builds nothing
      from it. If you'd rather split them yourself, do it before then.
- [ ] Email setup (Resend, `CRON_SECRET`), Sentry and analytics flags, and
      the under-13 consent wording check. These are unchanged; the details
      are in the launch checklist.

## Next up

SUGGESTIONS.md is the backlog. The weekly update builds its top `planned`
rows; the daily bug check fixes at most one bug a day.

| Row | Size | Status | What it needs |
| --- | --- | --- | --- |
| P-04 Season- and practice-adaptive plan | L | `planned` | Split into smaller rows first; uses P-03's season answers |
| P-05 Test days (jump, broad jump, sprint, pro-agility, Max Day) | L | `planned` | Split into smaller rows first |
| P-06 Free read-only parent and coach viewer | M | `planned` | Nothing, it's ready to build. It also covers P-03's under-13 parent viewer |
