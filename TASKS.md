# Tasks

What's open after the launch-readiness pass. Everything below is an open PR
to `main`; each passed `npx tsc --noEmit`, `npm run lint`, `npm test` and
`npm run build` before it was opened. The launch steps (database, accounts,
dry run) are in [docs/LAUNCH_CHECKLIST.md](docs/LAUNCH_CHECKLIST.md).

## Merge in this order

**SQL first** means: run that file in the Supabase SQL Editor before merging,
and confirm it with the check query in the launch checklist.

| Order | PR | What | SQL first |
| --- | --- | --- | --- |
| 1 | #41 | Renumber the skill-ratings schema to v48; refresh TASKS.md | No (its statement already ran) |
| 2 | #47 | Restore the daily coach summary README section | No |
| 3 | #42 | Confirm Clear History and PR delete, require a PR exercise, one check-in per day | No |
| 4 | #46 | Refresh `latest_stats.updated_at` on every check-in | No |
| 5 | #43 | 30-second daily check-in, one tap from Today | No |
| 6 | #44 | Invite link and QR code | **`schema_v49_invite_preview.sql`** |
| 7 | #45 | Athlete check-in reminder emails (needs #43's `/check-in`) | **`schema_v50_checkin_reminders.sql`** |
| 8 | #48 | In-app Send feedback | **`schema_v51_feedback.sql`** |
| 9 | #49 | Parent or guardian step for athletes under 18 | **`schema_v52_guardian_info.sql`** |
| 10 | #50 | Sentry and Vercel Analytics, off until configured | No |
| 11 | #51 | Notion sync behind a founder flag | No |
| 12 | #52 | Pilot-ending banner, payment link, roster warning | No |
| 13 | #53 | Launch checklist and this file | No |

Merge notes:
- Several PRs add a schema file to the README setup list, and several add a
  row to the TESTING.md coverage table. Those doc conflicts are always "keep
  both sides" (schema files in version order).
- #45 and #47 both add a README section after the Notion paragraph; keep both.
- #41 and #53 both rewrite this file; keep #53's version.

## Needs you

- [ ] Run v49–v52 as their PRs come up (table above).
- [ ] Email setup: Resend domain, Supabase SMTP through Resend, `RESEND_API_KEY`,
      `DAILY_SUMMARY_FROM`, `CRON_SECRET` (Vercel and GitHub), and the
      secret's hash in `private.cron_secrets`.
- [ ] `NEXT_PUBLIC_SENTRY_DSN` and `NEXT_PUBLIC_ANALYTICS_ENABLED`.
- [ ] `NEXT_PUBLIC_PAYMENT_LINK`.
- [ ] Optional: Google sign-in (#34's steps).
- [ ] Have the under-18 wording checked (#49). This is not legal advice.
- [ ] Answer the open questions at the top of #51 (no Notion settings screen
      exists) and in #44 (QR also in the team header, not only the checklist).
- [ ] Do the dry run in the launch checklist with one coach and three athletes.

## Not from this pass

- [ ] #16 `simplify-workout-film` ("Simplify 5: workout logger up front, film icon cleanup").

## Next up

See SUGGESTIONS.md.
