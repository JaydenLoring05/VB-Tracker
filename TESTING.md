# Testing

Unit tests use [Vitest](https://vitest.dev). They run in plain Node, need no
`.env` file, and never touch the network or a real Supabase project (the
Supabase clients are mocked). The whole suite runs in about a second.

## Run

```
npm test            # single run (what CI runs)
npm run test:watch  # re-run on save
npx vitest run tests/lib/recovery.test.ts   # one file
```

Before opening a PR, all of these must pass (CI runs the same steps in
`.github/workflows/ci.yml`):

```
npx tsc --noEmit
npm run lint       # ESLint flat config in eslint.config.mjs; warnings are allowed, errors fail
npm test
npm run build      # needs NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY set; any placeholder works
```

## End-to-end smoke test

`e2e/demo.spec.ts` opens the public `/demo` page in Chromium against a production build and checks that the sample
roster and the Attention Center render. `e2e/demo-film-stats.spec.ts` checks the film room's Stats view and the
Film tab of the athlete drill-down on the same page. They need no account or secrets. CI runs them as a separate `e2e` job.

```
npx playwright install chromium   # once
npm run build
npm run test:e2e
```

## What is covered

Tests live under `tests/`, mirroring `src/`.

| Area | Test file | Notes |
| --- | --- | --- |
| Pilot form validation | `tests/lib/pilotApplication.test.ts` | Field rules, normalization, control characters |
| `POST /api/pilot` | `tests/api/pilotRoute.test.ts` | Valid input, bad email, honeypot, oversize body, cross-origin, duplicate email, missing table, DB flood guard, per-IP rate limit |
| Team setup checklist | `tests/lib/teamSetup.test.ts` | `computeSetupProgress` combinations, share messages |
| Attention Center | `tests/lib/attentionCenter.test.ts` | Pain streaks, readiness drop, missed assigned days (and the session-count fallback), PRs, ranking |
| Readiness scoring | `tests/lib/recovery.test.ts` | Score weights, status thresholds, severe-pain guardrail, recommendations |
| Program resolution | `tests/lib/programResolution.test.ts` | Phase boundaries, pilot vs paid overrides, substitutions |
| Auth, DB error and date helpers | `tests/lib/smallHelpers.test.ts` | Dead-session detection, user-facing errors, `todayISO`, `formatLastActive` |
| Personal records | `tests/lib/personalRecord.test.ts` | First-ever set, ties, heavier set, longer hold, weighted timed sets, null inputs, PR board labels |
| Training load | `tests/lib/trainingLoad.test.ts` | Personal and team event weights, 7-day window edges, no double count when a session is on both calendars |
| Roster paging | `tests/lib/rosterPaging.test.ts` | Page range with a probe row, `hasMore` detection |
| Program schedule | `tests/lib/programSchedule.test.ts`, `tests/lib/missedWorkouts.test.ts` | Monday-aligned program weeks, start date for a chosen week, assigned days in the 7-day window, missed vs. completed (week, day), coach program vs. recommended plan |
| Data export and account deletion | `tests/lib/accountData.test.ts` | Tables exported, export file shape and name, typed delete confirmation |
| Daily coach summary | `tests/lib/dailySummary.test.ts` | Config gating, cron auth, time zone date, numbers match the Attention Center, pain alerts, today's workout, HTML escaping, Resend call |
| `GET /api/daily-summary` | `tests/api/dailySummaryRoute.test.ts` | Off without env vars, rejects a missing or wrong cron secret, sends one email per opted-in coach, data and send failures |
| Position starting programs | `tests/data/positionPrograms.test.ts`, `tests/lib/positionProgram.test.ts` | Templates pass the builder's validation, use library exercises with the right measure; position mapping; coach program and plan edits win over the template |
| Pilot end | `tests/lib/pilot.test.ts` | Banner from day 25 with end date and days left, "ended" after day 30, never for paid teams, https-only payment link, roster warning past 16 on the pilot only |
| Notion sync flag | `tests/lib/notionSyncFlag.test.ts` | Off by default, on for a deployment already set up, explicit flag wins, no Notion values exposed, the trigger stays silent while off |
| Monitoring and analytics | `tests/lib/monitoring.test.ts` | Off without a DSN or flag, Sentry events lose identity, cookies, bodies and query strings, health fields redacted anywhere, typed-input breadcrumbs dropped, page-view URLs without codes or ids |
| Guardian step | `tests/lib/guardian.test.ts` | Answer required, adults need nothing else, under 18 needs name, valid email and confirmation, saved fields, roster "missing" status |
| Feedback | `tests/lib/feedback.test.ts` | Message validation and control characters, same-site page only, short device label, app version, escaped notification email |
| `POST /api/feedback` | `tests/api/feedbackRoute.test.ts` | Signed in only, same-origin, empty rejected, role and team from the database (not the browser), emails only when Resend is set, save failure sends nothing |
| Check-in reminders | `tests/lib/checkInReminders.test.ts` | Email content (first name, escaped team, check-in link, unsubscribe link and one-click headers, no health data), token validation, hour and time-zone options, headers passed to Resend |
| `GET /api/checkin-reminders`, `POST /api/reminders/unsubscribe` | `tests/api/checkInRemindersRoute.test.ts` | Off without env vars, cron secret required, one email per due athlete, lookup failure sends nothing, unsubscribe by valid token only |
| Invite links | `tests/lib/invite.test.ts` | Code normalization, `/join/<code>` URL, join error messages (dead code, already on a team, no server text), pending invite from this browser or the account, invite message leads with the link |
| Film stats | `tests/lib/filmStats.test.ts` | Set distribution by zone (shares, empty zones, sets with no zone), passing average per athlete and for the team (0 counts, unrated and out-of-range skipped, sort order), block outcomes (three-tap Error, blocks with no outcome), one athlete's rows only, per-film lines newest first, number formatting |
| Daily check-in | `tests/lib/dailyCheckIn.test.ts` | Daily vs. pain fields, starting values (pain always 0), pain saved as 0 when collapsed, test-day numbers untouched, readiness unchanged, sleep stepper, checked in today |
| `latest_stats` save | `tests/lib/statsRow.test.ts` | Each save stamps `updated_at`, so "last check-in" moves forward |
| Stats history dates | `tests/lib/statsHistory.test.ts` | Old `M/D/YYYY` and ISO dates normalize to one day, latest save per day wins, pain streaks on old-format rows are flagged |
| Adherence summary | `tests/hooks/summarizeAdherence.test.ts` | Minutes, completion percent, cap at 100 |
| Demo data | `tests/data/demoData.test.ts` | Deterministic, no missing fields, sane ranges, storylines hold every weekday; demo films embed, tags use roster athletes and valid details; demo workout has last week's numbers for every exercise |
| Workout plan and exercise library | `tests/data/workoutPlan.test.ts` | Every planned exercise exists in the library |
| `src/proxy.ts` | `tests/proxy.test.ts` | Public paths, `/demo`, signed-out redirect, dead-session cookie clearing, matcher exclusions |
| `public/sw.js` | `tests/serviceWorker.test.ts` | Only static assets and `/offline` are cached; never HTML, Supabase or non-GET |

## What is not covered

- React components, pages and hooks that call Supabase (`useTeam`, `TrackerContext`, ...). They are UI or I/O
  glue; the logic worth testing has been kept in pure functions.
- Row-level security and SQL functions. These need a real Postgres; run them against a Supabase branch, not in unit tests.
- Browser behavior of the service worker (install prompts, real cache eviction) and signed-in end-to-end flows. The
  `scripts/playwright-verify` scripts cover those manually against a running app.

## Add a test

1. Put pure logic in `src/lib` (or `src/data`) so it can be imported without React or Supabase.
2. Create `tests/<same path as src>/<name>.test.ts` and import from the `@/` alias, same as app code:

   ```ts
   import { describe, expect, it } from "vitest";
   import { recoveryStatus } from "@/lib/recovery";

   describe("recoveryStatus", () => {
     it("calls 85 and above Elite", () => {
       expect(recoveryStatus(85).label).toBe("Elite");
     });
   });
   ```

3. Code that reads the clock: use `vi.useFakeTimers()` and `vi.setSystemTime(...)`, and restore in `afterEach`.
4. Code that talks to Supabase: `vi.mock("@supabase/supabase-js", ...)` (or `@supabase/ssr`) with a fake client, as in
   `tests/api/pilotRoute.test.ts` and `tests/proxy.test.ts`. A test must never make a real request.
5. Write the test first and watch it fail before making it pass.
