# Suggestions

Things noticed while working through the app that weren't in scope for this
pass, but are worth considering next. Grounded in what's actually in the
codebase, not generic advice.

## Closed in the October 2026 pass

Each was finished on its own branch. PR numbers get filled in once the
branches are pushed (see TASKS.md).

| Suggestion | Closed by |
| --- | --- |
| Workout-timer active-time flush lost on tab close or hard reload | `fix/workout-timer-keepalive` |
| Training load ignores `team_calendar_events` | `feat/training-load-team-events` |
| `useCoachRoster` has no pagination | `feat/coach-roster-limit` |
| Substitution hints that don't resolve to a catalog entry | `fix/substitution-references` |
| Attention Center "missed workouts" is a proxy | `feat/missed-assigned-days` (schema v44) |
| Position-based starting program templates (indoor) | `feat/position-starting-programs` (schema v45) |
| Self-serve data export and account deletion | `feat/data-export-account-deletion` (schema v46) |
| Google sign-in | `feat/google-sign-in` |
| Daily coach summary email | `feat/daily-coach-summary-email` (schema v47) |
| Homepage product-demo section | `feat/landing-product-screenshots` |
| Public demo team/dashboard | Already shipped as `/demo`; verified, no change needed (below) |
| Real visual identity (volleyball only) | `feat/brand-monogram` (pick option A, B or C in that PR) |

The public demo was checked end to end on a production build, and it covers
what the suggestion asked for:
- a read-only sample roster;
- the Attention Center;
- athlete drill-downs (recovery, PRs, adherence);
- the Plan tab and the athlete view.

It needs no login and makes no Supabase requests, and every write opens the
sign-up prompt. It is linked from the landing hero and listed in the sitemap
and `robots.ts`.

## Still open from the previous list

- **Beach-specific starting program.** The original position-template
  suggestion also listed beach. Only the indoor templates shipped
  (outside/opposite, middle, setter, libero in
  `src/data/positionPrograms.ts`), for two reasons:
  - beach training is different (sand plyometrics, two-person roles instead
    of positions);
  - onboarding has no beach option to pick it from.

  Add a `beach` key, a template and an onboarding choice together.

## Architecture

- **`src/context/TrackerContext.tsx` is 814 lines and does too many jobs.**
  One provider owns the plan week, exercise checks, stats and history, the
  calendar, library filters, workout logs and notes, PRs, substitutions, the
  team override and program resolution, the workout streak, and sync
  errors. That costs in three ways:
  - every consumer re-renders when any of it changes;
  - each new feature (program start date, starting program) adds another
    effect here;
  - `DemoTrackerProvider` has to mirror the whole value.

  Split it into smaller providers (for example `StatsProvider`,
  `PlanProvider`, `LibraryUIProvider`, `SyncStatusProvider`), keeping
  `useTrackerContext` as a thin compatibility layer during the move.
- **Data hooks repeat the same fetch-in-effect pattern.** Most hooks in
  `src/hooks` (`useTeamFilm`, `useTeamCalendar`, `useCoachRoster`,
  `useAthletePRs`, ...) hand-roll loading, error and retry state with
  `setState` inside `useEffect`. The new ESLint config flags 29 of these as
  `react-hooks/set-state-in-effect` and 2 as `react-hooks/refs` (warnings
  for now). A small shared `useQuery`-style hook (or SWR/TanStack Query)
  would remove the duplication, clear the warnings, and give every screen
  the same retry behavior.

## Reliability and security

- **Row-level security has no automated tests.** Every access rule lives in
  SQL policies and `security definer` functions (`is_team_coach`,
  `is_caller_coach_of`, `join_team`, and now `delete_my_account` and the
  secret check in `daily_summary_data`). TESTING.md lists them as not
  covered, so a wrong policy could leak athlete data with nothing to catch
  it. Run a small suite against a Supabase branch in CI:
  - sign in as athlete A, as the coach of A's team, as a coach of another
    team, and as an anonymous client;
  - assert who can read and write each table.
- **Several screens only see the first page of a large roster.**
  `useCoachRoster` now pages at 100 athletes, but four screens use only its
  first page: the film athlete picker (`src/app/(app)/film/page.tsx`),
  program assignment (`CustomProgramPanel`), `TeamProgressView` and
  `TeamNudge`. That's fine for a volleyball team. A club roster past 100
  would need "load all" or search on those screens.

## Coach experience

- **Film stats from tags.** `film_tags` already records `athlete_id`,
  `pass_rating`, `set_zone`, `set_type`, `block_outcome` and
  `attack_direction` (schema v36), but nothing aggregates them. Pure
  functions in `src/lib` could compute:
  - set distribution by zone;
  - pass-rating average per athlete (the 0–3 passing scale);
  - block outcomes per athlete per match.

  Show them on the film page and in the athlete drill-down. This is the
  payoff for the time coaches spend tagging.
- **A per-athlete overview page.** `AthleteStatsModal` splits one athlete
  across Recovery, PRs and Adherence tabs in a modal, and film tags live on
  another page. A `/coach/athletes/[id]` page could combine:
  - the readiness trend;
  - PRs and adherence;
  - recent pain flags;
  - their film stats.

  It would give coaches something to link to and room for the film numbers
  above.
- **The athlete stats table overflows at modal width.** In
  `AthleteStatsModal`'s recovery history table, at the 640 px modal width
  the column headers run together ("MOTIVATIONSORENESSKNEE") and dates wrap
  onto two lines. It's visible in `docs/screenshots/athlete-drilldown.jpg`.
  Show fewer columns on narrow widths, or let the table scroll sideways.
- **The morning email goes out at one fixed time for everyone.**
  `vercel.json` runs `/api/daily-summary` at 13:00 UTC, and
  `DAILY_SUMMARY_TIME_ZONE` sets one zone for "today", so coaches in other
  time zones get it at odd hours. Store a time zone per coach (or per
  team), run the cron hourly, and send to coaches whose local hour matches.

## Athlete experience

- **Jump tracking over time.** `performance_profiles` keeps one row per
  athlete (`standing_reach_in`, `approach_touch_in`, `block_touch_in`), so
  each new measurement overwrites the last. `stats_history` has `vertical`
  and `approach`, but not spike touch or a setter's jump-set contact
  height. A small `jump_tests` table (date, test type, value) would:
  - chart spike height and set peak height across the season;
  - let a new best feed the PR board and the Attention Center's "new PR"
    item.
- **Skills radar chart from self-ratings.** Athletes can't rate their own
  skills (serve, pass, set, attack, block, defense). A short monthly 1–5
  self-rating, stored per athlete, would drive a Recharts `RadarChart`
  (Recharts is already a dependency) on the athlete's stats page.
  Overlaying the previous month shows growth, and the coach could see the
  same chart on the athlete overview.
- **Only the athlete can set their program start date.**
  `profiles.program_start_date` (schema v44) is set on an athlete's first
  workout or from the week selector. A coach starting a new block for the
  whole team has to ask every athlete to reset their week. A coach action
  that sets the start date for the team or a group would keep everyone on
  the same week and make the missed-day signal accurate from day one.

## Marketing & onboarding

- **The demo has no Workout Mode or film room.** `/demo` shows only the
  coach dashboard and the athlete home. "Start today's workout" and the
  film page open the sign-up prompt, so the README and landing screenshots
  can't show the two most hands-on features. Read-only demo versions of
  `ActiveWorkoutView` (with sample sets) and the film room (a sample video
  with tags), fed from `src/data/demoData.ts`, would close that gap.
