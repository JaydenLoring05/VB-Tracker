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
| B-02 | Film hotkeys ignore key presses right after the player loads (PR #62) | building | bug | S |
| B-04 | The Workout Mode browser test fails on rest days, turning CI red (PR #66) | building | bug | S |
| B-05 | Daily coach summary email fails with `text = date` (PR #65, needs SQL) | building | bug | S |
| F-01 | Film stats from tags (set distribution, pass average, block outcomes) (PR #63) | building | me | M |
| F-03 | Film links that aren't YouTube (Hudl and others) | new | me | M |
| F-04 | Per-athlete overview page for coaches | new | me | M |
| B-06 | Plan builder: sets and seconds boxes can't be cleared and retyped (PR #69) | building | bug | S |
| F-25 | Show password and confirm password on sign-up (PR #68) | building | coach feedback | S |
| F-21 | Plan builder remembers a coach's own exercises (PR #70) | building | me | S |
| F-33 | Today's check-in pain (4+) turns on that sore area in the plan for the day | building | me | S |
| F-34 | Save the training profile (level, sore areas, age group) to the athlete's account (needs SQL) | building | me | M |
| F-35 | Youth version for athletes under 14: no heavy barbell or depth jumps, more landing and bodyweight work | building | me | M |
| F-36 | 4-week results card: retest vertical and approach touch, before/after card to share | planned | me | M |
| F-37 | Payments: $14.99/month athlete plan with a 7-day free trial (Stripe; stays off until keys are set) | planned | me | M |
| F-23 | Sections in a day, starting with a warm-up written once and added to every training day | planned | me | M |
| F-17 | Bring in a plan a coach already has (paste it, upload a sheet or doc, or a Google Sheets link) | planned | coach feedback | L |
| F-24 | A day built from more than one program (lifts plus accessory work) | planned | me | M |
| F-19 | Supersets in coach-built programs | planned | coach feedback | M |
| F-22 | A coach's own exercises in the Exercise Library (needs SQL) | planned | me | M |
| F-26 | "Pick one" groups: the coach lists options and the athlete does one | new | your idea | S |
| F-29 | One font across the whole app (PR #84) | building | me | S |
| F-27 | Programs that change by week (a max-test week, a rest week) and weight targets | new | your idea | L |
| F-05 | Jump tracking over time (spike touch, set peak height) | new | me | M |
| F-06 | Athletes with no team (solo plan) and a setup quiz | building | me | L |
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
| R-06 | README setup steps leave out `schema_v53` | new | your idea | S |
| A-01 | Split `TrackerContext.tsx` into smaller providers | new | your idea | L |
| A-02 | One shared data-fetch hook in place of fetch-in-effect | new | your idea | M |
| F-14 | AI film: find plays and make clips from game video automatically | new | me | L |
| F-15 | Three-tap sets record the zone, so set distribution fills in | new | your idea | S |
| F-30 | Phone push reminders players turn on themselves (PR #85, needs SQL and keys) | building | me | L |

## Details

### Bugs

- **B-02. Film hotkeys ignore key presses for a moment after the player
  loads.** In `src/components/film/FilmPanel.tsx`, keyboard tagging only
  starts responding a second or two after the YouTube player mounts (found
  while writing the e2e test in #39, which has to retry the first key).
  Attach the window keydown listener immediately or queue keys until the
  player is ready, so a coach who starts tagging right away doesn't lose
  presses.
- **B-04. The Workout Mode browser test fails on rest days.**
  `e2e/demo-workout-and-film.spec.ts` clicked "Start Today's Workout" on the
  demo athlete view. On a rest day (every Sunday) `DashboardCards` shows
  "Want to train anyway? Pick a workout" in its place, so the test timed
  out and the `e2e` check went red on every PR opened that day (#62, #63
  and #64 on 2026-10-04). The app was never at fault. #66 makes the test
  click whichever label the dashboard shows.
- **B-05. The daily coach summary email fails every morning.** Vercel logs
  `daily-summary: could not load summary data operator does not exist:
  text = date` from `/api/daily-summary` each day at 13:26 UTC since
  2026-10-04. `daily_summary_data` (schema v47) compares
  `team_calendar_events.date`, a text column, with `p_today`, a date, so
  Postgres rejects the query and no coach gets the email. #65 adds
  `schema_v54_daily_summary_date_fix.sql`, which compares text with text.
  The email stays broken until that file is run in the SQL Editor.

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

- **F-15. Three-tap sets record the zone.** The three-tap flow saves a set
  as Good / Hittable / Error (`QUICK_RESULTS` in `src/lib/filmQuickTag.ts`)
  and leaves `set_zone` empty, so the set distribution in film stats (F-01)
  only counts sets tagged through "Detailed tags" or by voice. A fourth tap
  for the zone on sets only (six buttons laid out like the court, with a
  "Skip") would fill it from the flow coaches use most. No schema change:
  `set_zone` exists since v36.

### Coach experience

- **F-04. A per-athlete overview page.** `AthleteStatsModal` splits one
  athlete across Recovery, PRs and Adherence tabs in a modal, and film tags
  live on another page. A `/coach/athletes/[id]` page could combine:
  - the readiness trend;
  - PRs and adherence;
  - recent pain flags;
  - their film stats (F-01).

  It would give coaches something to link to and room for the film numbers.
- **Plan builder rows from Taichi's onboarding call (B-06, F-16 to F-25).**
  Taichi Watanabe (UNLV men's club, first founding pilot coach) built his
  own program in the app on 2026-10-10 and found it long and hard. Jayden
  the same day: make planning as simple as possible for any coach, and work
  through all of Taichi's feedback. The table has the build order.
  None needs SQL unless it says so (`team_programs.days` is jsonb). What
  made the builder slow, in `src/components/coach/CustomProgramPanel.tsx`:
  - nothing is saved until "Save program" at the very bottom, and that
    button refuses while any training day is still empty, so leaving the
    page on Wednesday loses Monday and Tuesday;
  - every exercise is added one row at a time, so a five-day plan with six
    exercises a day is 30 rows and over 100 fields;
  - a day can't be copied to another day, and all seven days are open at
    once, which is a long scroll on a phone.
- **B-06. Sets and seconds boxes couldn't be cleared and retyped.** Taichi
  couldn't backspace and type a two-digit number, so he used the arrows. In
  `ExerciseRow` the sets box turned an empty value straight back into 1, so
  clearing "3" and typing "12" gave "112". #69 adds `WholeNumberInput`.
- **F-25. Show password and confirm password.** Taichi couldn't see what he
  typed on the sign-up screen and wanted a second field that has to match.
  #68 adds a show/hide button to every password field and a confirm field
  on sign-up.
- **F-21. The plan builder forgot a coach's own exercises.** A coach who
  types an exercise that isn't in the library shouldn't retype it every
  time. #70 adds every non-library exercise from the program being built
  and the team's saved programs to the suggestions, marked "(yours)", and
  picking one brings back the sets and reps it had last time.
- **F-16. Save each day.** Taichi asked for a save after every day (do
  Monday, save; do Tuesday, save) so an accidental exit doesn't cost the
  whole week. Two parts:
  - a "Save Monday" button on each day that saves the program as it stands.
    Days not filled in yet must not block it, so save them as rest days or
    add a draft flag, and keep the full `validateProgram` check for
    assigning the program to athletes;
  - keep the open draft in the browser on every change and offer "Pick up
    where you left off" when the coach comes back, so even an unsaved day
    survives a closed tab.
- **What Taichi's three plans look like (read 2026-10-10).** Three Google
  Sheets, shared by link: an in-season accessory and mobility plan, an
  8-week barbell plan, and an 8-week strength plan. This settles the open
  question about his "three programs for one team":
  - **They all train the same days** (Monday, Wednesday, Thursday; one adds
    Friday). They are not different programs for different days.
  - **A day is made of sections:** a warm-up, the day's lifts, accessory
    work and abs. The warm-up and abs sections are the same every day. The
    barbell sheet puts the barbell lifts and the accessory work for the
    same day side by side.
  - **Some sections are "pick one":** three plyometric options or three ab
    exercises, and the athlete does one.
  - **The barbell plan changes by week:** five weeks of the same 5x5, then
    a week of one-rep max tests, then active rest, with a column for the
    weight of each set and one for the athlete's max.
  - **Reps are free text:** "8", "3-10", "15 reps each leg", "1 min per
    side", "30 secs each side", "WU + 5 x 5", and often blank.

  **Build F-23, F-24, F-19 and F-26 on one thing: sections inside a day.**
  A warm-up is a section reused on every training day. A day from several
  programs is sections filled from different saved programs. A superset is
  a section whose exercises alternate. Pick one is a section where the
  athlete does one row. Four separate bolt-ons would give the builder four
  sets of controls. Keep the stored shape backwards compatible: a day with
  no sections is one unnamed section, `parseProgramDays` still reads
  programs saved before this, and `programToWorkoutDays` still returns the
  flat exercise list the rest of the app reads.
- **F-23. Sections, starting with the warm-up.** Taichi should be able to
  add his warm-up to every single day. A program day is one flat exercise
  list, so a warm-up has to be retyped on each day. Add named sections to
  a day, and a warm-up section the coach writes once per program with a
  "use on every training day" switch and a per-day override. Athletes see
  section names as headings on their day and in Workout Mode, warm-up
  first. Store it inside `team_programs.days`. This is the foundation for
  F-24, F-19 and F-26, so it comes before them.
- **F-17. Bring in a plan the coach already has.** Jayden: coaches should
  be able to upload their workouts from a doc or a sheet and have the
  program fill itself in. Always show a preview the coach can edit before
  anything is added. Files are read in the browser and never stored. Split
  into three PRs:
  1. **Paste.** A text box where one line is one exercise:
     `Back squat 3x8`, `Plank 3x30 sec`, `RDL - 4 x 8-10`, with a day name
     on its own line starting a new day. A pure `parseProgramText` in
     `src/lib/customProgram.ts` turns it into rows.
  2. **Upload a file:** `.csv` and `.txt` with no new dependency, then
     `.xlsx` and `.docx` with a maintained parser loaded only when the
     coach opens the import.
  3. **Paste a Google Sheets link.** A sheet shared as "Anyone with the
     link" can be read as CSV with no Google sign-in
     (`https://docs.google.com/spreadsheets/d/<id>/gviz/tq?tqx=out:csv&gid=<gid>`,
     checked on Taichi's three sheets). Add a small API route for signed-in
     coaches that accepts only `docs.google.com` spreadsheet links with a
     well-formed id, fetches that CSV server-side with a size cap and a
     timeout, and hands it to the same reader. A private sheet gets a plain
     message: share it with "Anyone with the link", or download it and
     upload the file.

  **How to read a sheet.** Taichi's sheets are not one table with one
  header row, so don't look for one. Each has three blocks side by side
  with an empty column between them, and each block is three columns:
  exercise, sets, reps. Rules that fit all three:
  - scan every row for a text cell followed by a small whole number and
    then one more cell (name, sets, reps), and group the hits by the column
    they start in;
  - a cell that is only a weekday name or abbreviation starts that day for
    its column group: "Monday:", "Wednesday", "Wed", "Thurs",
    "Thursday/ Day 3". Skip sub-header rows such as "Exercise Movements"
    and header cells such as "Sets" and "Reps";
  - a block with no weekday above it (warm-ups, abs) is a section for every
    training day (F-23), and a label in the name column such as
    "Warm-Ups - Legs" names the section;
  - rows under a label ending "- Pick One" are a pick-one group (F-26).
    Until F-26 exists, bring them in as ordinary rows with "Pick one" in
    the section name;
  - a single "Sets x Reps" cell such as "WU + 5 x 5" splits into 5 sets of
    5 with "warm-up set first" in the note (F-18);
  - keep reps as written ("15 reps each leg", "1 min per side"). A blank
    reps cell must not block the import: bring the row in and mark it for
    the coach to fill.

  Build a made-up fixture in this shape for the tests. Don't commit
  Taichi's plans.
- **F-18. A coach can't leave a note on one exercise.** Taichi wants to
  write his own note next to an exercise; his example was a step-up
  variation of his own. Typing any exercise name already works, but a typed
  exercise has no coaching cues in Workout Mode (`getExercise(...)?.cues`
  is empty) and the only note field is one per day. Add an optional `note`
  to `ProgramExercise`, a small "Add note" under each row in the builder,
  and show it under the exercise in `DayCard` and where the cues show in
  `ActiveWorkoutView`. Carry the note along when F-21 brings an exercise
  back. His sheets carry notes like "land on the balls of your feet" and
  "one set of standing pancake as well", which belong here.
- **F-24. A day built from more than one program.** Jayden: a team that
  practices Monday, Wednesday and Friday and does something else Tuesday
  and Thursday needs a second plan for those days, and Taichi has three
  programs for one team. Taichi's three all train the same days (see
  above), so his need is one day made of parts from more than one plan:
  barbell lifts from one, accessory work from another. Today each team,
  group or athlete follows exactly one program (`pickAssignedProgramId`
  returns one id, and `team_program_assignments` has one row per team, per
  group and per athlete by unique index). Different athletes on different
  programs already works, through groups or a per-athlete override. Build
  the version with no SQL first:
  1. **"Add from another program."** In the builder, a weekday can take a
     whole day or a section from any saved program, added to what is
     already there, not replacing it ("Monday: Barbell day 1, then
     In-season Monday"). Jayden's case is the same control used on
     different weekdays. It copies, so later edits to the source program
     don't follow.
  2. **Only if coaches need the parts to stay linked:** let an assignment
     list several programs and build the athlete's day from all of them.
     Needs a schema file (drop the one-row unique indexes) and changes to
     `pickAssignedProgramId` and `resolveWorkoutDays`. Don't build this
     until a coach asks for it.
- **F-19. Supersets.** Taichi wants to pair exercises as a superset. With
  sections (F-23), a superset is a section marked "superset". Two PRs:
  1. mark and unmark a section as a superset in the builder, and show its
     exercises bracketed (A1, A2) on the athlete's day;
  2. Workout Mode alternates the paired exercises set by set and rests
     after the pair, not after each exercise.
- **F-22. A coach's own exercises in the Exercise Library.** Jayden asked
  for this with F-21. `/library` and Workout Mode read the built-in list in
  `src/data/exercises.ts`, so a coach's exercise has no page, cues or video
  link, and athletes can't look it up. Needs a `team_exercises` table (name,
  cues, optional video link, measure) with `is_team_coach` RLS, an "Add
  exercise" form for coaches, and the library and `getExercise` reading both
  lists. Needs a schema file. F-18 covers most of the need with no SQL, so
  it comes first.
- **F-26. "Pick one" groups.** Not asked for, but Taichi's warm-up and abs
  sections are written this way: "Abs (Obliques) - Pick One" over two or
  three exercises. With sections (F-23) this is a section marked "pick
  one": the athlete's day shows the options, they tap the one they did,
  and the day counts as complete with one done. Without it his plans
  import with every option as a required exercise.
- **F-27. Programs that change by week, and weight targets.** Not asked
  for, but Taichi's barbell plan needs it to be followed in the app: five
  weeks of 5x5, a week of one-rep max tests, a week of active rest, and a
  weight for each set next to the athlete's max. A coach-built
  program is one repeating week with no weight target. Ask Taichi first
  whether the repeating week plus a note covers him. If not, split it:
  1. per-week overrides on a program (week 6 is the max test, week 7 is
     rest), keyed to the program start date (F-07);
  2. a weight or percent-of-max target per exercise, filled from the
     athlete's best on the PR board.
- **F-20. Copy a day, fold the rest.** "Copy to..." on each day in the
  builder, and only the day being edited stays open. Found while reading
  the builder for F-16.
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

- **R-06. The README's setup steps leave out `schema_v53`.** Step 3 of the
  README lists every schema file to run and stops at
  `schema_v52_guardian_info.sql`. `schema_v53_film_quick_tags.sql` (F-02,
  #58) is missing, so a fresh install following the README has no
  `film_tags.result` column and three-tap tags fail to save.
  `docs/LAUNCH_CHECKLIST.md` already lists v53. Add it to the README list.

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

### Plan fit

- **F-33. Check-in turns on injury mode.** When today's daily check-in
  reports knee, shoulder, lower-back or ankle pain at 4 or more (the same
  threshold as the discomfort nudge), that area is added to the athlete's
  profile for today only, so the plan swaps exercises and adds rehab work
  without the athlete touching settings. The saved profile doesn't change.
- **F-34 to F-37.** Asked for by Jayden on 2026-10-21 as the athlete-first
  build: the profile follows the athlete across devices (F-34), an under-14
  version (F-35), a 4-week retest and results card (F-36), and a paid
  individual plan at $14.99/month with a 7-day trial (F-37). Parent-facing
  items (a weekly parent email, a parent landing page) were deliberately
  left out: NextRep stays focused on the athlete.
- **F-32. An open day card is squeezed into one narrow column.** On
  Workouts, `.workout-grid` in `src/styles/workouts.css` is
  `repeat(7, minmax(140px, 1fr))`, so today's expanded card (and any day a
  player opens) is one-seventh of the width: exercise names wrap to three
  lines and the F-31 swap notes ("Knee-friendly swap for Box Jumps") stack
  awkwardly. Seen on desktop Chrome on 2026-10-21. Let the expanded card
  span the full row (`grid-column: 1 / -1`) with the collapsed days staying
  as a row of chips above or below it, and check phone width too.
- **F-31. The plan fits the athlete (level and sore areas).** Jayden asked
  for it on 2026-10-21 as the core of NextRep's move to individual athletes
  and youth: a beginner shouldn't get the same lifts as an advanced player,
  and a sore knee or shoulder should change the workout. A picker on
  Workouts and Start a Workout sets level and sore areas (kept on the
  device for now). `src/lib/trainingProfile.ts` swaps exercises by level,
  then by injury, adds two rehab exercises per sore area on training days,
  and scales sets by level; coach-built programs keep their lifts and
  targets but still get injury swaps. Next step: save the profile to the
  athlete's account so coaches and parents can see it.

## Shipped

Newest first. Add a row when a backlog item merges. Source wasn't recorded
before this file became the backlog; `bug` rows are PRs titled `fix:`.

| Item | Source | PR |
| --- | --- | --- |
| Workouts tab: an open day card gets the full row, exercises side by side on wide screens (F-32) | me | #91 |
| Plan fits the athlete: level and sore areas swap exercises and add rehab work (F-31) | me | #89 |
| Plan builder saves each day; unsaved changes survive a closed tab; unfinished programs can't be assigned (F-16) | coach feedback | #81 |
| Copy a program day to other days, and fold the days not being edited (F-20) | your idea | #80 |
| Coach's own note on each exercise in a program (F-18) | coach feedback | #79 |
| Athlete stats table columns fit their headers and dates at modal width (B-03) | bug | #67 |
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
