# Launch checklist: first real team

For one coach and about 12 athletes, some under 18, all on phones. Work top
to bottom. Each step says how to confirm it worked.

PR numbers refer to the launch-readiness pass (#41–#53). Merge them in the
order listed in [TASKS.md](../TASKS.md); the database steps below say which
PR needs which file first.

## 1. Database (Supabase → SQL Editor)

Run each file once, in this order. Every file is safe to re-run. After each
one, run its check query; it should return the value shown.

| # | File | From | Check (run in the SQL Editor) | Expect |
| --- | --- | --- | --- | --- |
| v44 | `schema_v44_program_start_date.sql` | #31 (merged) | `select count(*) from information_schema.columns where table_name = 'profiles' and column_name = 'program_start_date';` | `1` |
| v45 | `schema_v45_starting_program.sql` | #32 (merged) | `select count(*) from information_schema.columns where table_name = 'profiles' and column_name = 'starting_program';` | `1` |
| v46 | `schema_v46_delete_my_account.sql` | #33 (merged) | `select to_regprocedure('public.delete_my_account(boolean)') is not null;` | `true` |
| v47 | `schema_v47_daily_coach_summary.sql` | #35 (merged) | `select to_regprocedure('public.daily_summary_data(text,date)') is not null;` | `true` |
| v48 | `schema_v48_skill_ratings.sql` | #40 (merged), renamed in #41 | `select count(*) from information_schema.columns where table_name = 'performance_profiles' and column_name = 'skill_ratings';` | `1` |
| v49 | `schema_v49_invite_preview.sql` | #44 | `select to_regprocedure('public.invite_preview(text)') is not null;` | `true` |
| v50 | `schema_v50_checkin_reminders.sql` | #45 | `select to_regprocedure('public.checkin_reminder_recipients(text,timestamptz)') is not null;` | `true` |
| v51 | `schema_v51_feedback.sql` | #48 | `select to_regclass('public.feedback') is not null;` | `true` |
| v52 | `schema_v52_guardian_info.sql` | #49 | `select count(*) from information_schema.columns where table_name = 'profiles' and column_name = 'is_adult';` | `1` |
| v53 | `schema_v53_film_quick_tags.sql` | F-02 | `select count(*) from information_schema.columns where table_name = 'film_tags' and column_name = 'result';` | `1` |
| v54 | `schema_v54_daily_summary_date_fix.sql` | B-05 | `select pg_get_functiondef('public.daily_summary_data(text,date)'::regprocedure) like '%to_char(p_today%';` | `true` |

**Already applied in production (October 2, 2026):** v44 to v47, and v48's
statement (it ran as `schema_v44_skill_ratings.sql` before #41 renamed it). The
check queries above all returned the expected values. **Still to run:** v49,
v50, v51 and v52, each before merging its PR.

All four in one check, once everything has run:

```sql
select
  to_regprocedure('public.invite_preview(text)') is not null as v49,
  to_regprocedure('public.checkin_reminder_recipients(text,timestamptz)') is not null as v50,
  to_regclass('public.feedback') is not null as v51,
  exists (select 1 from information_schema.columns where table_name = 'profiles' and column_name = 'is_adult') as v52;
```

## 2. Accounts, environment variables and outside setup

Vercel variables are under the project → Settings → Environment Variables
(Production). Anything starting with `NEXT_PUBLIC_` is read at build time:
**redeploy after changing it.**

### Required before athletes sign up

- [ ] **Resend sending domain.** resend.com → Domains → add a domain you own
      (for example `mail.yourdomain.com`), add the DNS records it shows, and
      wait for "Verified". *Confirm:* the domain shows Verified in Resend.
- [ ] **Supabase SMTP through Resend (sign-up and password emails).**
      Supabase's built-in email is heavily rate-limited (a handful of emails
      an hour on the free plan). Twelve athletes signing up at practice would
      hit that, and some would never get their confirmation email. In
      Supabase → Authentication → Emails → SMTP Settings, enable custom SMTP:
      host `smtp.resend.com`, port `465`, username `resend`, password a Resend
      API key, sender an address on your verified domain. Then raise the email
      rate limit (Authentication → Rate Limits). *Confirm:* sign up a test
      account and the confirmation email arrives within a minute from your
      domain.
- [ ] **Supabase Site URL and redirect URLs.** Authentication → URL
      Configuration: Site URL `https://volleyball-tracker-beta.vercel.app`, and
      redirect URL `https://volleyball-tracker-beta.vercel.app/auth/callback`.
      *Confirm:* the confirmation link in that test email lands back on the
      app, signed in.

### Emails: daily coach summary and athlete check-in reminders

- [ ] `RESEND_API_KEY`: a Resend API key with sending access.
- [ ] `DAILY_SUMMARY_FROM`: for example `NextRep <summary@mail.yourdomain.com>`.
- [ ] `CRON_SECRET`: a long random string (`openssl rand -hex 32`).
- [ ] **Store the cron secret's hash** (Supabase SQL Editor):
      ```sql
      insert into private.cron_secrets (name, secret_hash)
      values ('daily_summary', encode(extensions.digest('<your CRON_SECRET>', 'sha256'), 'hex'))
      on conflict (name) do update set secret_hash = excluded.secret_hash;
      ```
- [ ] **GitHub repository secret `CRON_SECRET`** (same value) under the repo →
      Settings → Secrets and variables → Actions. This switches on the hourly
      check-in reminder workflow (#45).
- [ ] Optional `DAILY_SUMMARY_TIME_ZONE` (default `America/Los_Angeles`).
- *Confirm the coach summary:* as the coach, tick "Email me a morning
  summary", then
  `curl -H "Authorization: Bearer <CRON_SECRET>" https://volleyball-tracker-beta.vercel.app/api/daily-summary`
  returns `"sent":1` and the email arrives.
- *Confirm reminders:* GitHub → Actions → Check-in reminders → Run workflow
  succeeds (see the dry run below for a real reminder).

### Error monitoring and analytics

- [ ] `NEXT_PUBLIC_SENTRY_DSN`: from a free sentry.io Next.js project (Client
      Keys). *Confirm:* trigger an error and it shows up in Sentry with no
      email, cookies, query string or check-in values (#50).
- [ ] `NEXT_PUBLIC_ANALYTICS_ENABLED=true`, and enable Web Analytics on the
      project in Vercel. *Confirm:* page views appear in Vercel → Analytics
      within a few minutes, with `/join/[code]` instead of real codes.

### Payment

- [ ] `NEXT_PUBLIC_PAYMENT_LINK`: an `https://` link, for example a Stripe
      Payment Link for $29/month. Without it, the pilot banner shows with no
      button. Moving a team to paid is manual: see
      [BILLING.md](BILLING.md). *Confirm:* on day 25 of the team's pilot the
      coach sees "Continue for $29/month" and it opens the link.

### Optional

- [ ] **Google sign-in** (#34): Google Cloud OAuth client → Supabase →
      Authentication → Providers → Google (client ID and secret) → add the
      redirect URLs → `NEXT_PUBLIC_GOOGLE_AUTH_ENABLED=true`. *Confirm:*
      "Continue with Google" appears on `/login` and signs in.
- [ ] **Notion sync** (founder only, #51): leave as is. It stays on for your
      deployment because the `NOTION_*` variables are set; regular users never
      trigger it.

### Before the team arrives

- [ ] Have the under-18 wording checked (onboarding question, checkbox text
      and the privacy page; see #49). This is not legal advice.
- [ ] Test account deletion once with a throwaway account (Settings →
      Delete my account).

## 3. Dry run: one coach, three athletes, on phones

Use four real phones if you can (or four browsers, one of them in a private
window). Athlete A is 18+, athlete B is under 18, athlete C is the one who
forgets to check in. Each step says what the coach should see afterwards.

| Day | Who | Do this | Coach should see |
| --- | --- | --- | --- |
| 1 | Coach | Sign up, choose "I'm a Coach", create the team. | The coach dashboard with the setup checklist and "0 athletes". |
| 1 | Coach | Copy the invite link (checklist or team header). Text it to athlete A. | Nothing new yet. |
| 1 | Athlete A | Open the link, tap **Create account**, sign up, confirm the email, finish onboarding (answer **Yes** to 18 or older). | Athlete A on the roster. No "Guardian info missing" flag. |
| 1 | Coach | Tap **Show QR code** and hold the phone up. | The QR dialog with the team name and code. |
| 1 | Athletes B and C | Scan the QR with the camera, sign up, onboard. B answers **No** and enters a guardian's name and email and ticks the box; C answers **Yes**. | 3 athletes. No guardian flags. |
| 1 | Coach | Turn on check-in reminders for an hour that hasn't passed yet today, in your time zone. | "Saved." under the setting. |
| 1 | A and B | Tap **Daily check-in** on Today and save (under 30 seconds). B opens "Anything hurting?" and sets knee to 6. | Readiness for A and B. C shows "No check-in yet". |
| 1 | C | Do nothing. | At the reminder hour (within about 10 minutes), C gets "Quick check-in for &lt;team&gt;". A and B don't. |
| 1 | C | Tap **Check in now** in the email and save. | C's readiness appears. A second workflow run sends C nothing. |
| 2 | A, B, C | Check in again. B keeps knee at 6. | All three "checked in" in the morning summary (if on). |
| 3 | A, B, C | Check in again. B keeps knee at 6. | The Attention Center shows **"B: Reported knee pain 3 days running"** at the top. |
| 3 | A | Start today's workout, log at least one set, tap Finish. | A's workouts this week go up; the drill-down shows the session. |
| 3 | B | Settings → **Send feedback** (or More → Send feedback). | Nothing in the app; a row in Supabase `feedback` with page, role, team, version and device, and an email to you if Resend is set. |
| 3 | A | Save the check-in twice. | Only one entry for today in A's history and drill-down. |

**Also check on the coach's phone:** Clear History and deleting a PR both ask
for confirmation; the invite link shows a clear message after you regenerate
the code (old link: "This invite link doesn't work").

## 4. Known limits for the pilot

- **No in-app billing.** Payment is a hosted link; moving a team to paid is
  an SQL update you run (see [BILLING.md](BILLING.md)). Nothing is ever
  blocked when the pilot ends.
- **Reminders and the coach summary run on fixed schedules.** Reminders go
  out within about 10 minutes of the coach's hour (GitHub's scheduler can be
  late at busy times; a late run still sends, up to 3 hours after). The coach
  summary goes out once a day at 13:00 UTC.
- **One team per athlete.** An athlete must be removed from one team before
  joining another.
- **The app opens on each athlete's current program week only after they
  start a workout** (that's when the start date is set) or set it on the
  Workouts page.
- **No push notifications.** Reminders are email only. The PWA can be added
  to the home screen but doesn't send notifications.
- **"Guardian info missing" can't tell age.** Athletes who joined before the
  age question show the flag until they answer the card on their Today page.
- **Coaches can read a guardian's name and email** (needed to reach a parent);
  nobody else can.
- **Row-level security has no automated tests** (see SUGGESTIONS.md). The
  policies were reviewed by hand.
- **Exports and deletion are self-serve for athletes**, but deleting a coach
  account deletes their teams. The app shows which teams before it lets them
  confirm.
- **Film tagging is coach-only**, and keyboard shortcuts start working a
  moment after the video loads.
