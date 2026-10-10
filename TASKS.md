# Tasks

Refreshed on Saturday 10 October 2026, after the onboarding call with
Taichi, the first pilot coach. Everything through #71 is merged, including
the three fixes from his call (#68, #69, #70), film stats (#63) and the
morning email fix (#65). The launch steps (database, accounts, dry run) are in
[docs/LAUNCH_CHECKLIST.md](docs/LAUNCH_CHECKLIST.md).

## Open pull requests

| PR | What | Needs SQL | Waiting on |
| --- | --- | --- | --- |
| This PR | Backlog: seven rows moved to Shipped, max day (F-28) added, and the plan builder brief | No | Your merge |

## Needs you

Not checked against the live project. Tick these off as you confirm them.

- [ ] Confirm `supabase/schema_v54_daily_summary_date_fix.sql` was run in
      the Supabase SQL Editor. #65 is merged, but the morning coach email
      only starts working once that file has been run. It has failed every
      day since 4 October.
- [ ] Start the plan builder work: open Claude Code in this repo and tell
      it to read `docs/PLAN_BUILDER_BRIEF.md` and do what it says.
- [ ] Ask Taichi whether he needs weights worked out from each athlete's
      max in the app (F-27), or whether a repeating week plus a max day
      (F-28) covers him for now.
- [ ] Taichi is still at Demo in the Notion Leads table. Confirm his
      players have the team code and his start day, then move him to Pilot.
- [ ] Try film stats on the live site: Film room → Stats.
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
rows; the daily bug check fixes at most one bug a day. Eight rows are
`planned`, all plan builder work from Taichi's call, in this order:

| Row | Size | What it needs |
| --- | --- | --- |
| F-16 Save each day; an unsaved program survives leaving the page | M | Nothing |
| F-23 Sections in a day, starting with a reusable warm-up | M | Nothing |
| F-17 Bring in an existing plan (paste, upload, or a Google Sheets link) | L | Nothing; Taichi's three sheets are the test |
| F-18 Coach's own note on each exercise | S | Nothing |
| F-24 A day built from more than one program | M | Part 1 only |
| F-28 Max day that feeds the PR board | M | Part 2 needs SQL |
| F-19 Supersets | M | Nothing |
| F-22 A coach's own exercises in the Exercise Library | M | SQL when built |

Still `new`, waiting for you to mark them `planned`: F-26 ("pick one"
groups, which Taichi's warm-up and abs sections use), F-27 (programs that
change by week, weight targets), F-20 (copy a day), F-12 (pilot clock) and
F-15 (three-tap sets record the zone).
