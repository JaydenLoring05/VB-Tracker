# Tasks

Every PR from the launch-readiness pass (#41 to #53) is merged, along with
#54 to #56. There are no open PRs as of 2 October 2026. The launch steps
(database, accounts, dry run) are in
[docs/LAUNCH_CHECKLIST.md](docs/LAUNCH_CHECKLIST.md).

## Needs you

Not checked against the live project. Tick these off as you confirm them.

- [ ] Confirm `schema_v49` to `schema_v52` were run in the Supabase SQL
      Editor (check queries are in the launch checklist).
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
