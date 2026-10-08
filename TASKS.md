# Tasks

Refreshed on Thursday 8 October 2026. Everything through #61 is merged, along
with B-03 (#67). Five pull requests are open and all of them pass their
checks. The launch steps (database, accounts, dry run) are in
[docs/LAUNCH_CHECKLIST.md](docs/LAUNCH_CHECKLIST.md).

## Open pull requests

They can be merged in any order. None of them conflicts with another.
The order below is the suggested one.

| Order | PR | What | Needs SQL | Waiting on |
| --- | --- | --- | --- | --- |
| 1 | #66 | B-04: the browser test no longer fails on rest days | No | Your merge |
| 2 | #62 | B-02: film hotkeys work while the YouTube player is still loading | No | Your merge |
| 3 | #65 | B-05: the daily coach summary email fails with `text = date` | **Yes**, `schema_v54_daily_summary_date_fix.sql` | You to run the SQL, then merge |
| 4 | #63 | F-01: film stats from tags (passing average, set distribution, block outcomes) | No | You to try the preview, then merge. Questions for you are in the PR description |
| 5 | This PR | Housekeeping: this file and two new backlog rows | No | Your merge |

#62 carries #66's change and #63 carries both, because they edit the same
browser test. SUGGESTIONS.md is edited only by this PR, which marks B-02,
B-04, B-05 and F-01 `building`. The weekly update moves each one to Shipped
once its PR is merged.

The bug-fix PRs were not merged automatically on 8 October: the session
that updated them was not allowed to merge. They are ready when you are.

## Needs you

Not checked against the live project. Tick these off as you confirm them.

- [ ] Merge #66 and #62 (neither needs SQL).
- [ ] Run `supabase/schema_v54_daily_summary_date_fix.sql` in the Supabase
      SQL Editor, then merge #65. Until the SQL is run the morning coach
      email fails every day at 13:00 UTC. It has failed every day since
      4 October.
- [ ] Open the #63 preview at `/demo` → Film room → Stats, then merge #63.
- [ ] Mark the next rows `planned` in SUGGESTIONS.md. After F-01 no row is
      `planned`, so Sunday's update builds nothing until one is. Worth a
      look first with a pilot team starting: F-12 (pilot clock starts at
      the first athlete workout), F-15 (three-tap sets record the zone) and
      F-04 (per-athlete overview page).
- [ ] F-06 (solo plan): you set the week of 5 October to revisit it before
      marking it `planned`.
- [ ] Confirm `schema_v49` to `schema_v53` were run in the Supabase SQL
      Editor (check queries are in the launch checklist). v53 came with
      F-02 (#58); without it three-tap film tags don't save.
- [ ] Email setup: Resend domain, Supabase SMTP through Resend, `RESEND_API_KEY`,
      `DAILY_SUMMARY_FROM`, `CRON_SECRET` (Vercel and GitHub), and the
      secret's hash in `private.cron_secrets`.
- [ ] `NEXT_PUBLIC_SENTRY_DSN` and `NEXT_PUBLIC_ANALYTICS_ENABLED`.
- [ ] `NEXT_PUBLIC_PAYMENT_LINK`.
- [ ] Optional: Google sign-in (#34's steps).
- [ ] Have the under-18 wording checked (#49). This is not legal advice.
- [ ] Do the dry run in the launch checklist with one coach and three athletes.

## Next up

SUGGESTIONS.md is the backlog. The weekly update builds its top `planned`
rows; the daily bug check fixes at most one bug a day.

| Row | Size | Status | What it needs |
| --- | --- | --- | --- |
| F-12 Pilot clock starts at the first athlete workout | S | `new` | You to mark it `planned` |
| F-15 Three-tap sets record the zone | S | `new` | You to mark it `planned`; builds on F-01 |
| F-04 Per-athlete overview page for coaches | M | `new` | You to mark it `planned`; builds on F-01 |
| F-03 Film links that aren't YouTube | M | `new` | You to mark it `planned` |
| F-05 Jump tracking over time | M | `new` | You to mark it `planned`; needs SQL when built |
