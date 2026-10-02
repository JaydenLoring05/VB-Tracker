# Tasks

What's still open after the October 2026 pass. Every PR from the pass
(#20–#36, #38, #39) and the skill radar (#40) is merged, and schema
v44–v48 has been run on the production Supabase project.

## Needs you (accounts and secrets)

- [ ] **Google sign-in (#34).** Create the OAuth client in Google Cloud,
      enter its client ID and secret in Supabase → Authentication →
      Providers → Google, add the redirect URLs, then set
      `NEXT_PUBLIC_GOOGLE_AUTH_ENABLED=true` in Vercel and redeploy. Full
      steps are in #34's description.
- [ ] **Daily coach summary email (#35).** Pick a `CRON_SECRET`, store its
      SHA-256 hash with the `insert into private.cron_secrets ...`
      statement at the top of `schema_v47_daily_coach_summary.sql`, verify
      a sending domain in Resend, then set `RESEND_API_KEY`,
      `DAILY_SUMMARY_FROM` and `CRON_SECRET` in Vercel and redeploy. Full
      steps are in #35's description.
- [ ] **Test account deletion once (#33)** with a throwaway account:
      Settings → type the phrase → Delete my account.

## Open PRs not from this pass

- [ ] #16 `simplify-workout-film` ("Simplify 5: workout logger up front,
      film icon cleanup").

## Next up

See SUGGESTIONS.md.
