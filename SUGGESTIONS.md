# Suggestions

Things noticed while working through the app that weren't in scope for this
pass, but are worth considering next. Grounded in what's actually in the
codebase, not generic advice.

## Data / content

- **A long tail of substitution hints in `src/data/exercises.ts` still don't
  resolve to a catalog entry** (e.g. "Kettlebell Deadlift", "Wall Sit",
  "Bear Crawl", "Rear Delt Fly" — over 100 remain out of ~160 total
  substitution references). The 10 most-referenced names were fixed in the
  2026-07-19 pre-launch pass (Split Squat, Single-Leg Hip Thrust, Cable
  Pull-Through, Goblet Squat, Seated Calf Raise, Box Step-Offs, Drop Squat,
  Line Hops, Easy Bike, Band Rotations). The rest are low-frequency
  (referenced once or twice each) and are only worth full catalog entries
  as they come up as commonly-picked substitutions in practice.

## Reliability

- **`useCoachRoster` has no pagination.** Fine for a volleyball team (dozens
  of athletes at most), but the roster/stats/profiles queries load everyone
  in one shot with no limit, worth revisiting only if this ever gets used
  for a much larger roster than a single team.
- **Workout-timer active-time flush can lose the most recent window on a
  hard navigation.** The 2026-07-20 timer fix (`useActiveWorkoutSession.ts`)
  flushes accumulated active seconds to Supabase on unmount/pagehide, which
  works reliably for normal in-app navigation (confirmed live) but can be
  aborted by a hard page reload or tab close before the write completes,
  since it's a regular `fetch` with no `keepalive`. This can only ever
  under-count a few seconds/minutes of real active time, never resurrect
  the original bug (each resume always starts a fresh active window), so
  it was accepted as a trade-off rather than adding a raw
  `fetch(..., { keepalive: true })` call to Supabase's REST API bypassing
  the supabase-js client. Worth doing if it turns out to matter in
  practice.
- **The Attention Center's "missed workouts" signal is a proxy, not a
  literal reading of "assigned days."** The app doesn't persist a
  per-athlete current program week server-side (`week` in
  `TrackerContext` is client-local UI state), so there's no coach-queryable
  way to know which days were "assigned" to a given athlete on a given
  week. `computeAttentionItems` (`src/lib/attentionCenter.ts`) instead
  flags fewer than 2 completed `workout_sessions` in the trailing 7
  calendar days. Revisit if a persisted per-athlete program week/start date
  gets added later (the new `season_start`/`season_end` onboarding fields
  on `profiles` are team-level, not a substitute for that).

## Auth

- **Google sign-in.** Was removed at some point and never restored.
  Deliberately left out of the 2026-07-19 pre-launch pass (email/password
  only for the pilot) rather than restored without asking. Revisit if
  athletes or coaches ask for it during the pilot.

## Coach experience

- **Daily coach summary email.** A morning email with checked-in count,
  attention-needed count, average readiness, pain alerts, and today's
  workout. This is a daily, at-a-glance digest, distinct from any future
  weekly report, which would roll up trends over a longer window. (The
  Attention Center itself, built 2026-07-20, covers the in-app
  equivalent of this; the email is still open.)

## Marketing & onboarding

- **Homepage product-demo section.** Real dashboard screenshots or a short
  demo video showing roster, readiness, pain alerts, PRs, and trends, the
  landing page currently describes the product but never shows it.
- **Public demo team/dashboard.** A read-only demo roster visitors can
  explore without signing up, so a skeptical coach can see the real UI
  before handing over an email address.

## Season structure

- **Training load auto-adjusting around team calendar events.** The
  2026-07-20 pass added a coach-authored team calendar
  (practice/match/tournament/travel/testing/playoffs), but `useCalendar`'s
  training-load calculation still only weighs personal `calendar_events`,
  not the new `team_calendar_events`. Worth folding in once there's a
  sense of what weighting coach-authored event types should carry.
- **Position-based starting program templates.** Outside/opposite, middle,
  setter, libero, and beach-specific starting programs, picks the starting
  program for a position. The 2026-07-20 onboarding pass derives initial
  *training goals* from position, but the actual workout program is still
  one universal 20-week plan regardless of position. Distinct from (but
  related to) any future position-specific in-app scorecards, which would
  track position-specific stats on top of whatever program is running.

## Trust & compliance

- **Self-serve data export and account deletion.** Beyond the plain-language
  Privacy Policy added in the 2026-07-19 pre-launch pass, athletes and
  coaches should eventually be able to export or delete their own data
  without emailing support.

## Brand

- **Real visual identity.** Replace the volleyball emoji with an actual
  logo/monogram. Keep this scoped to a single-sport (volleyball) identity
  for now, a multi-sport brand hierarchy (e.g. "NextRep Volleyball /
  Basketball / Football") was suggested in a product review but is
  deliberately deferred. Expanding brand scope before volleyball has proven
  out with a real paying client would dilute focus at exactly the wrong
  time.
