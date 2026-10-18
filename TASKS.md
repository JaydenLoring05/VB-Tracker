# Tasks

Refreshed on Sunday 18 October 2026 by the weekly update. Everything through
#85 that was merged is in the Shipped table in SUGGESTIONS.md. The launch
steps (database, accounts, dry run) are in
[docs/LAUNCH_CHECKLIST.md](docs/LAUNCH_CHECKLIST.md).

## Open pull requests

Checked against `main` at #85. "Conflicts" means GitHub can't merge it until
the branch is brought up to date with `main`.

| PR | What | Needs SQL | State | Waiting on |
| --- | --- | --- | --- | --- |
| #86 | B-08 row: push reminders fail until `schema_v55` is run | No (but see below) | Merges cleanly | Your merge |
| #87 | F-24: "Add from another program" puts a day from another saved program under a day in the builder | No | Merges cleanly | You to try it, then merge |
| #88 | Housekeeping: nine rows to Shipped, this file | No | Merges cleanly | Your merge |
| #83 | F-28: weight targets as a percent of each athlete's max | No | Merges cleanly, but its row (F-28) only exists in #72 | Decide on #72 first |
| #75 | F-23: sections in a day, warm-up written once | No | **Conflicts** (branched before #81 shipped F-16) | Rebuild on `main` |
| #76, #77, #78 | F-17 parts 1-3: bring in a plan by paste, file, Google Sheets link | No | **Conflict** (each stacked on #75) | #75 first, then each in order |
| #74 | B-07: Continue Workout reopens the workout in progress | No | **Conflicts** in `DashboardCards.tsx` | Bring up to date with `main` |
| #72 | Docs: rows to Shipped, F-27/F-28 rows, plan builder brief | No | **Conflicts** in SUGGESTIONS.md | Most of it is now done here; keep only F-27/F-28 and the brief, or close |
| #73 | F-16 (first try): save each day | No | **Conflicts**; F-16 already shipped in #81 | Close it |

## Needs you

Not checked against the live project. Tick these off as you confirm them.

- [ ] **Run `supabase/schema_v55_push_reminders.sql` in the Supabase SQL
      Editor.** F-30 (#85) is live but its SQL isn't: `/api/push-reminders`
      fails every hour and no player gets a push (B-08, #86).
- [ ] Confirm `schema_v54_daily_summary_date_fix.sql` was run when #65 was
      merged. Without it the morning coach email still fails.
- [ ] Confirm `schema_v49` to `schema_v53` were run (check queries are in the
      launch checklist). v53 came with F-02 (#58); without it three-tap film
      tags don't save.
- [ ] Merge #86 and #88.
- [ ] Try #87 in the preview (Coach → Programs, two saved programs), then
      merge. Its one question is in the PR description.
- [ ] The F-23 / F-17 stack (#75 → #76 → #77 → #78) can't merge as it is.
      F-19 and F-26 are blocked behind it. Ask for #75 to be redone on `main`
      (the daily or weekly run can do it if you say so), then the F-17 parts.
- [ ] Close #73 (superseded by #81). Decide what to keep from #72.
- [ ] Email setup: Resend domain, Supabase SMTP through Resend,
      `RESEND_API_KEY`, `DAILY_SUMMARY_FROM`, `CRON_SECRET` (Vercel and
      GitHub), and the secret's hash in `private.cron_secrets`.
- [ ] Push keys for F-30 (see #85's description).
- [ ] `NEXT_PUBLIC_SENTRY_DSN`, `NEXT_PUBLIC_ANALYTICS_ENABLED`,
      `NEXT_PUBLIC_PAYMENT_LINK`.
- [ ] Have the under-18 wording checked (#49). This is not legal advice.
- [ ] Do the dry run in the launch checklist with one coach and three athletes.

## Next up

SUGGESTIONS.md is the backlog. The weekly update builds its top `planned`
rows that have no open PR; the daily bug check fixes at most one bug a day.

| Row | Size | Status | What it needs |
| --- | --- | --- | --- |
| F-19 Supersets | M | `planned` | Builds on sections (F-23, #75). Next weekly build once #75 is merged |
| F-22 A coach's own exercises in the Exercise Library | M | `planned` | Needs SQL when built |
| F-26 "Pick one" groups | S | `new` | You to mark it `planned`; builds on sections (F-23) |
