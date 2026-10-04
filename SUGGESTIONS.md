# Suggestions

The single backlog for NextRep. Nothing gets built unless it has a row here.

## How this file works

Every item has an ID, a status, a source and a size.

- **Status**
  - `new`: written down, not approved to build yet.
  - `planned`: approved. The weekly update builds from the top of this list.
  - `building`: a branch or PR is open for it.
  - `shipped`: merged. Move the row to "Shipped" with its PR number.
  - `rejected`: decided against. Keep the row and say why in one line.
- **Source:** `me` (Jayden asked for it), `coach feedback`, `bug`, or
  `your idea` (Claude noticed it while working in the code).
- **Size:** `S` (under an hour), `M` (one work block), `L` (several blocks;
  split it before building).

Rules for automated runs:

- **Weekly update:** build the top one or two `planned` rows, one PR each.
  Never build a `new` row. If nothing is `planned`, build nothing and say so.
- **Daily bug fix:** at most one bug a day. Add a row with source `bug` if
  the bug isn't listed, then fix it in a small PR.
- Add ideas as `new`. Only Jayden moves a row from `new` to `planned`.
- The table order is the priority order. Details for each row are below it,
  under the same ID.

## Backlog

| ID | Item | Status | Source | Size |
| --- | --- | --- | --- | --- |
| B-02 | Film hotkeys ignore key presses right after the player loads | planned | bug | S |
| B-03 | Athlete stats table overflows at modal width | planned | bug | S |
| F-01 | Film stats from tags (set distribution, pass average, block outcomes) | building | me | M |
| F-03 | Film links that aren't YouTube (Hudl and others) | new | me | M |
| F-04 | Per-athlete overview page for coaches | new | me | M |
| F-05 | Jump tracking over time (spike touch, set peak height) | new | me | M |
| F-06 | Athletes with no team (solo plan) | new | me | L |
| F-07 | Coach sets the program start date for the team or a group | new | your idea | M |
| F-08 | Skill radar history (overlay last month on this month) | new | your idea | M |
| F-09 | Morning email at each coach's local time | new | your idea | M |
| F-10 | Notion settings screen (status and "Sync now") | new | your idea | S |
| F-11 | Beach-specific starting program | new | your idea | M |
| F-12 | Pilot clock starts at the first athlete workout, not team creation | new | your idea | S |
| F-13 | Weekly "you haven't trained yet" email to athletes | new | your idea | M |
| R-01 | Database sets `latest_stats.updated_at` itself (needs SQL) | new | your idea | S |
| R-02 | Coaches can read a guardian's email, not just the flag (needs SQL) | new | your idea | S |
| R-03 | Automated tests for row-level security | new | your idea | M |
| R-04 | Several screens only see the first 100 athletes of a roster | new | your idea | S |
| R-05 | Reminder timing depends on GitHub's scheduler | new | your idea | S |
| A-01 | Split `TrackerContext.tsx` into smaller providers | new | your idea | L |
| A-02 | One shared data-fetch hook in place of fetch-in-effect | new | your idea | M |
| F-14 | AI film: find plays and make clips from game video automatically | new | me | L |

## Details

### Bugs

- **B-02. Film hotkeys ignore key presses for a moment after the player
  loads.** In `src/components/film/FilmPanel.tsx`, keyboard tagging only
  starts responding a second or two after the YouTube player mounts (found
  while writing the e2e test in #39, which has to retry the first key).
  Attach the window keydown listener immediately or queue keys until the
  player is ready, so a coach who starts tagging right away doesn't lose
  presses.
- **B-03. The athlete stats table overflows at modal width.** In
  `AthleteStatsModal`'s recovery history table, at the 640 px modal width
  the column headers run together ("MOTIVATIONSORENESSKNEE") and dates wrap
  onto two lines. It's visible in `docs/screenshots/athlete-drilldown.jpg`.
  Show fewer columns on narrow widths, or let the table scroll sideways.

### Film

- **F-01. Film stats from tags.** `film_tags` already records `athlete_id`,
  `pass_rating`, `set_zone`, `set_type`, `block_outcome` and
  `attack_direction` (schema v36), but nothing aggregates them. Pure
  functions in `src/lib` could compute:
  - set distribution by zone;
  - pass-rating average per athlete (the 0–3 passing scale);
  - block outcomes per athlete per match.

  Show them on the film page and in the athlete drill-down. This is the
  payoff for the time coaches spend tagging.
- **F-03. Film links that aren't YouTube.** `parseYouTubeId` in
  `src/lib/film.ts` only recognises YouTube hosts. For any other link,
  `FilmPanel` shows an "Open video" link that opens in a new tab in place of
  the player, so tags can't be read off the video's own clock. Find out what
  Hudl allows before sizing this: if it can't be embedded, the honest
  version is typed timestamps next to the external link.
- **F-14. AI film.** Jayden plans AI film analysis. Competitors already
  sell it: Balltime (Hudl) charges athletes $20/month for automatic downtime
  removal, play filters, highlight reels, serve and attack speed, and jump
  detection. A first version could find rallies and cut downtime from a
  YouTube link, then suggest tags for a coach to confirm in the F-02 flow.
  It also sets the price of the solo plan (F-06): launch Athlete Pro at
  $7.99/month or $59/year, and raise new signups to about $14.99/month or
  $99/year once AI film ships. Split into smaller rows before building.

### Coach experience

- **F-04. A per-athlete overview page.** `AthleteStatsModal` splits one
  athlete across Recovery, PRs and Adherence tabs in a modal, and film tags
  live on another page. A `/coach/athletes/[id]` page could combine:
  - the readiness trend;
  - PRs and adherence;
  - recent pain flags;
  - their film stats (F-01).

  It would give coaches something to link to and room for the film numbers.
- **F-07. Only the athlete can set their program start date.**
  `profiles.program_start_date` (schema v44) is set on an athlete's first
  workout or from the week selector. A coach starting a new block for the
  whole team has to ask every athlete to reset their week. A coach action
  that sets the start date for the team or a group would keep everyone on
  the same week and make the missed-day signal accurate from day one.
- **F-09. The morning email goes out at one fixed time for everyone.**
  `vercel.json` runs `/api/daily-summary` at 13:00 UTC, and
  `DAILY_SUMMARY_TIME_ZONE` sets one zone for "today", so coaches in other
  time zones get it at odd hours. Store a time zone per coach (or per
  team), run the cron hourly, and send to coaches whose local hour matches.
- **F-10. No Notion settings screen exists.** #51 gates the background sync
  request behind a flag, but the founder still sets the sync up through
  server variables. A small Settings section (status and "Sync now") behind
  the same flag would make it self-serve.
- **F-12. The pilot clock starts when the team is created.** `pilotBanner`
  in `src/lib/pilot.ts` counts the 30 days from `teams.created_at`, so a
  coach who sets up before the season loses pilot days before any athlete
  trains. Starting the clock at the team's first finished athlete workout
  (falling back to `created_at` when there is none) gives every pilot a fair
  30 days of real use before the "Continue for $29/month" banner. Keep the
  same date in the Notion Teams table's Pilot start.

### Athlete experience

- **F-05. Jump tracking over time.** `performance_profiles` keeps one row
  per athlete (`standing_reach_in`, `approach_touch_in`, `block_touch_in`),
  so each new measurement overwrites the last. `stats_history` has
  `vertical` and `approach`, but not spike touch or a setter's jump-set
  contact height. A small `jump_tests` table (date, test type, value) would:
  - chart spike height and set peak height across the season;
  - let a new best feed the PR board and the Attention Center's "new PR"
    item.

  Needs a schema file.
- **F-06. Athletes with no team.** Pricing is per team, and nothing
  describes what an athlete without a team gets. Decide in the pricing work
  first: free, a cheap solo plan, or nothing yet. Check what a team-less
  account can do today before deciding. For athletes under 18 the guardian
  step from #49 already exists; who pays is the open question.
  Decision (Jayden, 2026-10-02): solo accounts stay free, and a paid
  "Athlete Pro" plan is added at $7.99/month or $59/year. Pro adds full
  history and graphs, a self-built program, "My clips" for the athlete's own
  film, and stats export. Athletes on a paying team get Pro free, and Pro
  shows an "Invite your coach" button. Jayden revisits this the week of
  2026-10-05 before marking it planned. See F-14 for the price step-up.
- **F-08. The skill radar only keeps the latest ratings.** #40 stores one
  `performance_profiles.skill_ratings` value per athlete (schema v48), so
  each new self-rating overwrites the last. Keeping dated ratings (a small
  history table, or one row per month) would let the radar overlay last
  month on this month to show growth, and the coach could see the same
  chart on the athlete overview.
- **F-11. Beach-specific starting program.** Only the indoor templates
  shipped (outside/opposite, middle, setter, libero in
  `src/data/positionPrograms.ts`), for two reasons:
  - beach training is different (sand plyometrics, two-person roles instead
    of positions);
  - onboarding has no beach option to pick it from.

  Add a `beach` key, a template and an onboarding choice together.
- **F-13. Nothing nudges an athlete who stops training.** The Attention
  Center flags missed workouts to the coach, and athletes get check-in
  reminder emails (schema v50, `src/lib/checkInReminders.ts`), but no
  email reaches an athlete who hasn't finished a workout this week. A weekly
  reminder that reuses the check-in reminder's opt-in, unsubscribe link and
  hourly job would raise "Athletes logging", the weekly number that best
  predicts a pilot team paying. Needs working email (Resend key and sender
  domain) first.

### Reliability and security

- **R-01. `latest_stats.updated_at` should also be set by the database.**
  #46 fixes it in the app's save. A `before update` trigger on
  `latest_stats` would protect any future writer (an import, an admin fix)
  from bringing back the "everyone looks overdue" bug. Needs a schema file.
- **R-02. Coaches can read a guardian's email, not just the flag.** The
  roster's "Guardian info missing" flag (#49) uses the existing "coach can
  view roster profiles" policy, which exposes every profile column to the
  coach. If coaches should only see the flag, expose it through a function
  and narrow what the policy returns. Needs a schema file.
- **R-03. Row-level security has no automated tests.** Every access rule
  lives in SQL policies and `security definer` functions (`is_team_coach`,
  `is_caller_coach_of`, `join_team`, `delete_my_account`, and the secret
  check in `daily_summary_data`). TESTING.md lists them as not covered, so a
  wrong policy could leak athlete data with nothing to catch it. Run a small
  suite against a Supabase branch in CI:
  - sign in as athlete A, as the coach of A's team, as a coach of another
    team, and as an anonymous client;
  - assert who can read and write each table.
- **R-04. Several screens only see the first page of a large roster.**
  `useCoachRoster` pages at 100 athletes, but four screens use only its
  first page: the film athlete picker (`src/app/(app)/film/page.tsx`),
  program assignment (`CustomProgramPanel`), `TeamProgressView` and
  `TeamNudge`. That's fine for a volleyball team. A club roster past 100
  would need "load all" or search on those screens.
- **R-05. Reminder timing depends on GitHub's scheduler.** #45 triggers
  reminders from a scheduled GitHub workflow because Vercel's Hobby plan
  only allows daily crons. GitHub can run late at busy times. Moving the
  trigger to an hourly Vercel cron (Pro) or Supabase `pg_cron` + `pg_net`
  would make the timing exact. The Vercel option costs money.

### Architecture

- **A-01. `src/context/TrackerContext.tsx` is 814 lines and does too many
  jobs.** One provider owns the plan week, exercise checks, stats and
  history, the calendar, library filters, workout logs and notes, PRs,
  substitutions, the team override and program resolution, the workout
  streak, and sync errors. That costs in three ways:
  - every consumer re-renders when any of it changes;
  - each new feature (program start date, starting program) adds another
    effect here;
  - `DemoTrackerProvider` has to mirror the whole value.

  Split it into smaller providers (for example `StatsProvider`,
  `PlanProvider`, `LibraryUIProvider`, `SyncStatusProvider`), keeping
  `useTrackerContext` as a thin compatibility layer during the move.
- **A-02. Data hooks repeat the same fetch-in-effect pattern.** Most hooks
  in `src/hooks` (`useTeamFilm`, `useTeamCalendar`, `useCoachRoster`,
  `useAthletePRs`, ...) hand-roll loading, error and retry state with
  `setState` inside `useEffect`. The ESLint config flags 29 of these as
  `react-hooks/set-state-in-effect` and 2 as `react-hooks/refs` (warnings
  for now). A small shared `useQuery`-style hook (or SWR/TanStack Query)
  would remove the duplication, clear the warnings, and give every screen
  the same retry behavior.

## Shipped

Newest first. Add a row when a backlog item merges. Source wasn't recorded
before this file became the backlog; `bug` rows are PRs titled `fix:`.

| Item | Source | PR |
| --- | --- | --- |
| Copied check-in reminder links to `/check-in`, not `/stats` (B-01) | bug | #61 |
| Film made simple: three-tap tags, timed comments, "My clips" (F-02) | me | #58 |
| Team streak in the coach's sidebar | not recorded | #56 |
| Attention Center items can be cleared; Send reminder and Recognize achievement send a message | bug | #55 |
| Pilot-ending banner, optional payment link, roster warning past 16 | not recorded | #52 |
| Notion sync behind a founder flag | not recorded | #51 |
| Sentry and Vercel Analytics, off until configured | not recorded | #50 |
| Parent or guardian step for athletes under 18 (schema v52) | not recorded | #49 |
| In-app Send feedback (schema v51) | not recorded | #48 |
| `latest_stats.updated_at` refreshed on every check-in | bug | #46 |
| Check-in reminder emails (schema v50) | not recorded | #45 |
| Invite link and QR code (schema v49) | not recorded | #44 |
| 30-second daily check-in, one tap from Today | not recorded | #43 |
| Confirm Clear History and PR delete, require a PR exercise, one check-in per day | bug | #42 |
| Skills radar chart from self-ratings (schema v48) | me | #40 |
| Demo versions of Workout Mode and the film room | not recorded | #39 |
| Homepage product-demo section | not recorded | #36 |
| Daily coach summary email (schema v47) | not recorded | #35 |
| Google sign-in | not recorded | #34 |
| Self-serve data export and account deletion (schema v46) | not recorded | #33 |
| Position-based starting program templates, indoor (schema v45) | not recorded | #32 |
| Attention Center "missed workouts" uses assigned days (schema v44) | not recorded | #31 |
| Every substitution hint resolves to a catalog entry | bug | #30 |
| `useCoachRoster` pagination | not recorded | #29 |
| Training load counts `team_calendar_events` | not recorded | #28 |
| Workout-timer active-time flush survives tab close and hard reload | bug | #27 |

## Rejected

| Item | Source | Why |
| --- | --- | --- |
| Volleyball "N" monogram as the logo (#37) | your idea | Jayden kept the current gold pulse mark and app icons |
| Public demo team/dashboard as new work | your idea | Already shipped as `/demo`; checked end to end, no change needed |
