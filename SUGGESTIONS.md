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
  in one shot with no limit — worth revisiting only if this ever gets used
  for a much larger roster than a single team.

## Auth

- **Google sign-in.** Was removed at some point and never restored.
  Deliberately left out of the 2026-07-19 pre-launch pass (email/password
  only for the pilot) rather than restored without asking. Revisit if
  athletes or coaches ask for it during the pilot.

## Coach experience

- **Coach "Attention Center."** High priority — a strong differentiator
  once there's real usage data to prioritize against. A prioritized list
  surfacing what needs a coach's attention today (pain reports, missed
  workouts, readiness drops, new PRs, missing check-ins), instead of
  requiring the coach to read raw roster numbers and infer it themselves.
- **Daily coach summary email.** A morning email with checked-in count,
  attention-needed count, average readiness, pain alerts, and today's
  workout. This is a daily, at-a-glance digest — distinct from any future
  weekly report, which would roll up trends over a longer window.

## Marketing & onboarding

- **Homepage product-demo section.** Real dashboard screenshots or a short
  demo video showing roster, readiness, pain alerts, PRs, and trends — the
  landing page currently describes the product but never shows it.
- **Public demo team/dashboard.** A read-only demo roster visitors can
  explore without signing up, so a skeptical coach can see the real UI
  before handing over an email address.
- **Multi-step guided onboarding flow.** Replace the current bare
  email/password signup with coach-vs-athlete branching, team setup, season
  dates, and invite-athletes steps, with a progress indicator. The current
  single-form signup works but front-loads every decision onto one screen.

## Season structure

- **Volleyball season planning.** Practices, games, and tournaments entered
  by the coach, with training load auto-adjusting around them.
- **Position-based starting program templates.** Outside/opposite, middle,
  setter, libero, and beach-specific starting programs — picks the
  starting program for a position. Distinct from (but related to) any
  future position-specific in-app scorecards, which would track
  position-specific stats on top of whatever program is running.

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
