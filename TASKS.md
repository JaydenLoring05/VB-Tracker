# Tasks

Refreshed by the weekly update on Sunday 4 October 2026. Everything from the
launch-readiness pass (#41 to #56) is merged, along with the backlog file
(#57), F-02 (#58) and B-01 (#61). The launch steps (database, accounts, dry
run) are in [docs/LAUNCH_CHECKLIST.md](docs/LAUNCH_CHECKLIST.md).

## Open pull requests

| PR | What | Needs SQL | Waiting on |
| --- | --- | --- | --- |
| #62 | B-02: film hotkeys work while the YouTube player is still loading | No | Your review and merge |
| #63 | F-01: film stats from tags (passing average, set distribution, block outcomes) | No | Your review and merge, and three questions in the PR description |
| This PR | Weekly housekeeping: this file and three new backlog rows | No | Your review and merge |

The `e2e` check is red on #62 and #63. The cause is B-04 (a browser test
that only passes on training days), not either PR. It goes green on a
re-run on a training day, or once B-04 is fixed.

## Needs you

Not checked against the live project. Tick these off as you confirm them.

- [ ] Review and merge #62 and #63 (neither needs SQL).
- [ ] Mark the next rows `planned` in SUGGESTIONS.md. After F-01 the only
      `planned` row left is B-03 (a bug), so next Sunday's update builds
      nothing unless a feature row is `planned`. Next in the table are F-03,
      F-04 and F-05.
- [ ] Decide B-04 (CI goes red on rest days). To have the daily bug check
      fix it, set its Status to `planned` and its Source to `bug`.
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

| Row | Status | What it needs |
| --- | --- | --- |
| B-03 Athlete stats table overflows at modal width | `planned`, bug | The daily bug check picks it up |
| F-03 Film links that aren't YouTube | `new` | You to mark it `planned` |
| F-04 Per-athlete overview page for coaches | `new` | You to mark it `planned` |
| F-05 Jump tracking over time | `new` | You to mark it `planned`; needs SQL when built |
