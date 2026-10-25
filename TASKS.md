# Tasks

Refreshed on Sunday 25 October 2026. `main` has everything through #100,
the last merge (22 October). Eleven pull requests are open,
and seven of them now conflict with `main`. The launch steps (database,
accounts, dry run) are in [docs/LAUNCH_CHECKLIST.md](docs/LAUNCH_CHECKLIST.md).

## Open pull requests

"Conflicts" means GitHub can't merge it until the branch is updated from
`main`. The plan builder changed a lot on 18 and 21 October (#79, #80, #81,
#89 to #99), so the older plan builder branches need rebuilding.

| PR | What | Needs SQL | State | Waiting on |
| --- | --- | --- | --- | --- |
| #101 | F-22: a coach's own exercises in the Exercise Library | **Yes**, `schema_v59_team_exercises.sql` | Merges cleanly | You to run the SQL, try it, then merge |
| This PR | Housekeeping: this file and SUGGESTIONS.md | No | Merges cleanly | Your merge |
| #87 | F-24: add a day from another program in the plan builder | No | Merges cleanly | Your review and merge |
| #86 | Docs: push reminders need `schema_v55` run in production (B-09) | No | Merges cleanly | You to run the SQL. #86 only adds a backlog row, and this PR adds the same row as B-09, so you can close #86 |
| #75 | F-23: sections in a day, starting with the warm-up | No | Conflicts | A rebuild on current `main`. F-19 (supersets) and F-26 (pick one) wait on it |
| #76, #77, #78 | F-17: bring in a plan by pasting, by file, or from a Google Sheets link | No | Conflict | A rebuild on current `main`, after #75 |
| #83 | F-28: weight targets as a percent of each athlete's max | No | Conflicts | A rebuild on current `main` |
| #74 | B-10: Continue Workout reopens the workout in progress | No | Conflicts | A rebuild on current `main` |
| #88 | Last week's housekeeping | No | Conflicts | Close it: this PR replaces it |
| #73 | F-16: save each day (first version) | No | Conflicts | Close it: F-16 shipped in #81 |
| #72 | Docs from 10 October (F-28 and F-27 rows, plan builder brief) | No | Conflicts | Close it, or say which parts to keep. Most of it is in `main` already or in #83 |

## Needs you

Not checked against the live project. Tick these off as you confirm them.

- [ ] Run `supabase/schema_v59_team_exercises.sql`, try #101 on its preview,
      then merge it.
- [ ] Confirm these were run in the Supabase SQL Editor. Each came with a
      merged PR, and the feature fails without it:
  - [ ] `schema_v54_daily_summary_date_fix.sql` (#65): the morning coach email.
  - [ ] `schema_v55_push_reminders.sql` (#85): phone push reminders. The
        daily bug check saw them failing on 18 October (#86).
  - [ ] `schema_v56_training_profile.sql` (#93): training profile on the account.
  - [ ] `schema_v57_athlete_billing.sql` (#97): athlete plan payments.
  - [ ] `schema_v58_weekly_schedule.sql` (#99): the athlete's own week.
- [ ] Merge #87 (F-24), or say what to change.
- [ ] Close #88, #73 and #72, or say what to keep from them.
- [ ] Decide on the rebuilds: #75 first (F-19 and F-26 depend on it), then
      #76 to #78, #83 and #74. The weekly update skips any row with an open
      PR, so these rows stay stuck until each PR is rebuilt, merged or
      closed.
- [ ] Mark the next rows `planned`. F-19 is the only `planned` row without
      a PR, and it waits on F-23 (#75). So next Sunday's update builds
      nothing unless you plan another row.
- [ ] Email setup: Resend domain, Supabase SMTP through Resend, `RESEND_API_KEY`,
      `DAILY_SUMMARY_FROM`, `CRON_SECRET` (Vercel and GitHub), and the
      secret's hash in `private.cron_secrets`.
- [ ] Stripe keys for athlete plan payments (#97 stays off until they're set).
- [ ] `NEXT_PUBLIC_SENTRY_DSN` and `NEXT_PUBLIC_ANALYTICS_ENABLED`.
- [ ] Have the under-18 wording checked (#49). This is not legal advice.
- [ ] Do the dry run in the launch checklist with one coach and three athletes.

## Next up

SUGGESTIONS.md is the backlog. The weekly update builds its top `planned`
rows that have no open PR; the daily bug check fixes at most one bug a day.

| Row | Size | Status | What it needs |
| --- | --- | --- | --- |
| F-03 Film links that aren't YouTube | M | `new` | You to mark it `planned` |
| F-04 Per-athlete overview page for coaches | M | `new` | You to mark it `planned` |
| F-19 Supersets in coach-built programs | M | `planned` | F-23 (#75) merged first |
| F-26 "Pick one" groups | S | `new` | You to mark it `planned`; also waits on F-23 |
| F-12 Pilot clock starts at the first athlete workout | S | `new` | You to mark it `planned` |
