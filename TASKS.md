# Tasks

Refreshed on Sunday 8 November 2026 by the weekly update. Everything through
#120 is merged, and the Shipped table in SUGGESTIONS.md is up to date. The
launch steps (database, accounts, dry run) are in
[docs/LAUNCH_CHECKLIST.md](docs/LAUNCH_CHECKLIST.md).

Nothing new was built this week. Every `planned` row already has an open
pull request except F-19 (supersets), and F-19 is built on F-23's sections,
which are still waiting in #75. Most of the open plan-builder PRs were opened
in October and no longer merge cleanly into `main`.

## Open pull requests

"Conflicts" means the branch no longer merges cleanly into `main` and needs
a rebase before it can be merged.

| PR | What | Needs SQL | Merges cleanly | Waiting on |
| --- | --- | --- | --- | --- |
| #122 | Remove the film feature (moved to a separate tool) | No | Yes | Your review. No backlog row; film rows F-03, F-14, F-15 would become `rejected` or move with it |
| #121 | Landing page from the coach's copy at / (P-01) | No | Yes | Your review. No backlog row for P-01; it overlaps F-44 |
| #87 | F-24: add a day from another program in the plan builder | No | Yes | Your review |
| #75 | F-23: sections in a day, starting with a warm-up | No | **Conflicts** | Rebase, then your review. F-19, F-24 and F-26 build on it |
| #76, #77, #78 | F-17 parts 1-3: bring in a plan by paste, file, or Google Sheets link | No | **Conflicts** | Rebase in order (#76 first), then your review |
| #101 | F-22: a coach's own exercises in the Exercise Library | **Yes**, `schema_v59_team_exercises.sql` | **Conflicts** | Rebase, run the SQL, then merge |
| #83 | F-28: weight targets as a percent of each athlete's max | No | **Conflicts** | Rebase or close: F-40 (#103) already added % of max by level |
| #74 | Continue Workout reopens the workout in progress | No | **Conflicts** | Rebase or close; its "B-07" label clashes with the shipped B-07 (#98) |
| #73 | F-16: plan builder saves each day | No | **Conflicts** | Close: F-16 shipped in #81 |
| #72, #86, #88, #102, #105 | Old docs and housekeeping PRs | No | Mostly no | Close: this PR replaces them |
| This PR | Housekeeping: this file; F-17, F-22, F-23, F-24 marked `building` | No | Yes | Your merge |

## Needs you

- [ ] Decide on #122 (remove film) and #121 (landing page). Neither has a
      backlog row; add rows or tell the weekly update to.
- [ ] Close the superseded PRs: #73, #72, #86, #88, #102, #105, and decide
      on #83 and #74.
- [ ] Get #75 (F-23 sections) rebased and merged. F-19, F-24 and F-26 are
      blocked on it.
- [ ] Run `schema_v59_team_exercises.sql` before merging #101 (F-22).
- [ ] Confirm `schema_v55` to `schema_v64` were run in the Supabase SQL
      Editor (check queries are in the launch checklist).
- [ ] Mark more rows `planned`. Without F-23 merged, no `planned` row can be
      built next Sunday.

## Next up

SUGGESTIONS.md is the backlog. The weekly update builds its top `planned`
rows that have no open PR; the daily bug check fixes at most one bug a day.

| Row | Size | Status | What it needs |
| --- | --- | --- | --- |
| F-19 Supersets in coach-built programs | M | `planned` | F-23 (#75) merged first |
| F-26 "Pick one" groups | S | `new` | You to mark it `planned`; also builds on F-23 |
| F-44 Home page copy matches the athlete-first /join | S | `new` | You to mark it `planned`, or fold it into #121 |
| RF-02 Referral code saved on the account at sign-up | S | `new` | You to mark it `planned` |
| G-07 Weekly challenge and streaks in the athlete's time zone | S | `new` | You to mark it `planned` |
