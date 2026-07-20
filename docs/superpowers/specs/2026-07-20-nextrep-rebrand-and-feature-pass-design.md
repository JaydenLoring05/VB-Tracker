# NextRep Rebrand & Feature Pass — Design

> **Status:** Draft, pending user review before writing-plans.
> **Scope:** Items 1, 3-9 of the 2026-07-20 request. Item 2 (multi-team-per-coach
> + coach-editable programming) already has its own approved, unexecuted plan at
> `docs/superpowers/plans/2026-07-19-multi-team-and-programming.md` — that plan
> is executed as-is via `superpowers:subagent-driven-development`, not
> redesigned here. It already correctly uses `schema_v26_multi_team_coach.sql`
> onward (v25 is taken by `schema_v25_removal_notices.sql`), consuming
> v26-v29. **All new schema files in this doc start at v30.**
> **Out of scope:** `src/app/page.tsx` (landing page) is not touched anywhere
> in this pass, including the rebrand and em-dash sweep.

## Clarifications already resolved with the user

- **Calendar scope:** team events are scoped to the coach's currently active
  team (TeamSwitcher selection), matching how Program-editor writes already
  work. Switch teams to post to a different roster.
- **Readiness trend for Attention Center:** rolling 7-day average vs. the
  prior 7-day average (not single-point comparisons), tolerant of gaps.
- **Onboarding option lists:** standard defaults — position list (Outside
  Hitter, Middle Blocker, Opposite, Setter, Libero/DS) and competitive level
  list (Middle School, JV, Varsity, Club, College), with training-goal
  defaults derived per position.

## Schema plan for this pass

| File | Adds |
|---|---|
| `schema_v30_workout_active_time.sql` | `workout_sessions.active_seconds`, `workout_sessions.resumed_at` (timer fix) |
| `schema_v31_readiness_expansion.sql` | `stress`, `lower_back_pain`, `ankle_pain`, `motivation` columns on `latest_stats` + `stats_history` |
| `schema_v32_workout_rpe.sql` | `workout_sessions.rpe` (1-10, nullable) |
| `schema_v33_team_calendar.sql` | new `team_calendar_events` table + RLS |
| `schema_v34_profile_onboarding.sql` | `profiles.display_name`, `profiles.role_hint`-free onboarding-answer columns (see item 8) |

All applied manually via Supabase SQL Editor per this repo's existing
convention (no CLI/service-role key available). Each is independently
runnable and idempotent (`if not exists` / `drop ... if exists` guards),
matching every prior schema file's style.

---

## 1. Rebrand → NextRep

Mechanical. Live user-facing files to edit (from a full-repo grep, `src/app/page.tsx` excluded):

- `README.md` — title/body references
- `src/components/landing/LandingHeader.tsx:10` — `<h2>ELEVATEOS</h2>` → `<h2>NEXTREP</h2>`
- `src/app/terms/page.tsx` (4 refs), `src/app/privacy/page.tsx` (4 refs)
- `src/app/login/page.tsx` (3 refs)
- `src/app/layout.tsx` — `metadata.title` / `metadata.description`
- `scripts/playwright-verify/task19-rebrand.mjs` — currently asserts the string "ElevateOS" is present; update the assertion to "NextRep" so the verify script still means something (this is a test asserting old behavior, not a historical record)

**Not touched:** `supabase/schema_v19.sql` (filename/comment is a historical
migration record, not user-facing), `docs/superpowers/plans/*.md` and
`docs/superpowers/specs/*.md` (historical record of past sessions),
`src/app/page.tsx` (explicitly out of scope this pass).

**V19 label removal:** `src/components/layout/Sidebar.tsx:37` — `<h2>V19
TRACKER</h2>` is deleted outright (not renamed to NextRep — the version
number itself is what's internal, per the request).

Verification: grep for `ElevateOS`/`elevateos` and `V19` again after the
edit and confirm zero hits outside the explicitly excluded files; run the
existing `task19-rebrand.mjs` Playwright script.

---

## 2. Multi-team-per-coach + coach-editable programming

Execute `docs/superpowers/plans/2026-07-19-multi-team-and-programming.md`
as written, via `subagent-driven-development`. No design changes. Each of
its 10 tasks is independently live-verified per its own steps before moving
to the next, per the plan's own global constraints.

---

## 3. Fix: workout timer keeps running while away

**Root cause (confirmed via code read):** the live on-screen timer is
already correct — it's a `setInterval` computing `Date.now() - startedAt`,
torn down on unmount. The bug is in what gets *persisted*:
`useActiveWorkoutSession.ts`'s `finishWorkout()` computes
`duration_seconds = ended_at - started_at` as raw wall-clock time, with no
concept of "the athlete wasn't looking at this screen for 3 hours."
`workout_sessions` has no column tracking accumulated active time.

**Fix:** add `active_seconds int not null default 0` and `resumed_at
timestamptz null` to `workout_sessions` (`schema_v30`).

- On mount of `ActiveWorkoutView` for an open session (or on
  `useStartWorkout`'s resume path): if `resumed_at` is null, set it to
  `now()` via a Supabase update (marks "actively being watched" starting
  now).
- On unmount, and on `document.visibilitychange` → hidden (covers tab
  switch/backgrounding, not just in-app navigation — closing the tab
  without a clean unmount is the one case this can't catch synchronously,
  so also compute+flush on the `pagehide` event, which fires more
  reliably than `beforeunload` for this): compute `elapsed = now -
  resumed_at`, add it to `active_seconds`, set `resumed_at = null`,
  persist.
- On `finishWorkout()`: `duration_seconds = active_seconds + (resumed_at ?
  now - resumed_at : 0)` — i.e. flush any currently-open active window
  into the total at the moment of finishing, instead of trusting
  `ended_at - started_at`.
- Resuming later (`useStartWorkout`'s existing "resume open session" path)
  re-opens a new active window the same way as a fresh mount — no special
  case needed.

**Verify live (required — this is the item the user explicitly flagged for
live testing, not just a read-through):** start a workout, let ~30s of
active time pass, navigate to another tab in the app (triggers unmount),
wait 60+ real seconds, return and finish the workout. Confirm the recorded
duration reflects ~30s of active time, not ~90s of wall-clock time.

---

## 4. Coach Attention Center

New default landing view on `/coach` for coaches, above the existing
roster table (roster table stays, demoted to below/secondary). A pure
function `computeAttentionItems(roster, latestStats, statsHistory,
workoutLogs, prs)` — computed client-side from data already fetched by
`useCoachRoster` (no new tables), returning a sorted `AttentionItem[]`.

**Rules** (thresholds are a first-version judgment call, called out
explicitly so they're easy to tune later):

| Priority | Condition | Action label |
|---|---|---|
| High | Any of knee/shoulder/lower-back/ankle pain ≥4 (0-10 scale) reported on each of the athlete's last 3 *consecutive calendar days'* check-ins | "Check in" |
| High | Rolling 7-day average readiness score is ≥20 points lower than the prior 7-day average (requires ≥2 check-ins in each window, else skipped — not enough data) | "Review workload" |
| Medium | 2+ assigned workout days in the current week not marked complete, and today is past that day | "Send reminder" |
| Positive | A new PR logged in the last 7 days | "Recognize achievement" |

An athlete can generate more than one row (e.g. pain flag *and* missed
workouts). Sort: High → Medium → Positive, then most-recent signal first
within a tier. Empty state: "All caught up — nothing needs your attention
today." Each row shows athlete name, the specific reason in plain language
(e.g. "Reported knee pain (6/10) 3 days running"), and the suggested action
as a button — clicking it opens the existing `AthleteStatsModal` for that
athlete (no new modal needed).

**Reused, not duplicated:** pain/readiness reads the same `latest_stats`/
`stats_history` shape item 5 extends; missed-workouts reads the same
week/day model `useWorkoutProgress`/`workoutPlan` already define; PRs read
the existing `prs` table.

---

## 5. Expand the Readiness Score

**Schema (`schema_v31`):** add `stress`, `lower_back_pain`, `ankle_pain`,
`motivation` to `latest_stats` and `stats_history`, each 0-10 like the
existing pain/energy fields (mirrors `sleep`/`kneePain`/etc.'s existing
scale — no new UI pattern needed, `StatsForm`'s existing `[key, label,
max]` tuple array just grows).

**`recovery.ts` — extend, don't duplicate:** `calculateRecovery` gains
weighted terms for the new fields. Rebalanced weights (existing 5 factors
are currently sleep 28 / knee 20 / shoulder 20 / soreness 12 / energy 20 =
100): new distribution — sleep 20, energy 15, stress 10, soreness 10, knee
10, shoulder 10, lower-back 10, ankle 5, motivation 10 = 100. (Ankle
weighted lightly since it's the least universally-loaded joint for most
exercises; stress and motivation are new "readiness" signals distinct from
physical pain.)

**Plain-language explanation (new function `explainReadiness(stats,
score)`):** returns a short sentence identifying the 1-2 lowest-scoring
factors by name (e.g. "Your sleep and right-knee response are below
normal") plus one concrete, non-diagnostic action drawn from the existing
`coachRecommendations`-style logic, e.g. "Complete today's strength
session, but reduce maximum-effort jumps." This replaces the current
generic `recoveryStatus().message` on the check-in result screen (kept
available as a fallback for `hasLoggedStats === false`).

**Non-diagnostic guardrail:** if any single pain field (knee/shoulder/
lower-back/ankle) is ≥8/10 on 3 or more of the athlete's last 3
consecutive check-ins (independent of calendar gaps — "3 check-ins in a
row report this severity", a stricter and differently-scoped rule than the
Attention Center's calendar-day rule in item 4, intentionally: this one
protects the athlete's own screen, the other flags the coach), the
explanation function short-circuits and returns ONLY: *"You've reported
[body part] pain at a high level for several check-ins in a row. This
isn't something the app can safely guide you through — please talk to your
coach or a medical professional before your next session."* — no workout
modification suggestion is appended in this branch, so it can never read
as "here's a workaround for your injury."

---

## 6. Workout screen improvements

All additions land in `ActiveWorkoutView.tsx` (and `WorkoutSummary.tsx`
for the RPE step); nothing here is a new subsystem.

- **Estimated duration + purpose:** `WorkoutDay.minutes`/`.notes` already
  exist on the type and are already populated in `workoutPlan.ts` — they're
  just not rendered in `ActiveWorkoutView` today (only in the planning
  grid). Surface both at the top of the active session.
- **Warm-up section:** a static, non-exercise-specific 5-movement generic
  warm-up (e.g. jog/jumping jacks, arm circles, bodyweight squats, lunges,
  light dynamic stretching) rendered as a collapsible checklist above the
  main exercises. No new data model — a constant array in
  `workoutPlan.ts`.
- **Previous performance:** already built (`previousSets` in
  `useActiveWorkoutSession.ts`, rendered at `ActiveWorkoutView.tsx:286-290`)
  — no change needed, just confirm it's still wired after other edits.
- **Coaching cues:** `Exercise.cues` already exists in the catalog and
  already renders in the library view (`ExerciseCard.tsx`). Surface the
  same `cues` array inline under each exercise during the active workout
  (small expandable "Coaching cues" disclosure per exercise row) — reusing
  the data, not duplicating it.
- **Post-workout RPE:** `schema_v32` adds `workout_sessions.rpe int null
  check (rpe between 1 and 10)`. `WorkoutSummary.tsx` gains a "How hard did
  that feel?" 1-10 picker shown once, on first render of the summary for a
  just-finished session, saved via a small `updateSessionRPE` call in
  `useActiveWorkoutSession.ts`. Skippable (not required to leave the
  screen).
- **Discomfort-based substitution suggestion:** a small `BODY_PART_TO_CATEGORY`
  map (`knee → Jump Development, Landing Mechanics, Knee Strength`;
  `shoulder → Shoulder Health, Hitting Power`; `lowerBack → Rotational
  Core`; `ankle → Jump Development, Landing Mechanics, Speed & Agility`).
  If today's check-in (via `TrackerContext`'s already-loaded
  `latestStats`) reports a body-part pain ≥4 AND the current exercise's
  `category` is in that body part's list AND
  `getSubstitutionCandidates(exercise)` is non-empty, render a dismissible
  inline banner: *"You reported [body part] discomfort today — want to
  swap to [top candidate] instead?"* with an "Swap" button that calls the
  existing `setSubstitution` (same mechanism `DayCard`'s manual swap picker
  already uses) and a "Dismiss" that just hides the banner for the rest of
  this session (component-local state, no persistence needed since it's a
  per-session nudge).

---

## 7. Team-wide coach calendar

**Schema (`schema_v33`):** new `team_calendar_events` table — `id, team_id,
date, type (practice|match|tournament|travel|testing|playoffs), title,
notes, created_by, created_at`. RLS mirrors `team_exercise_defaults`'s
existing pattern from the multi-team plan: any `team_members` row for that
`team_id` can `select`; only `is_team_coach(team_id)` can
`insert/update/delete`. (`is_team_coach(uuid)` already exists,
parameterized, from `schema_v20_teams.sql` — reused as-is.)

**UI:**
- Coach: a "Team Events" panel on the coach dashboard's Roster or a new
  Calendar tab, scoped to the active team (per the resolved clarification),
  reusing `CalendarPanel`'s existing form pattern but posting to
  `team_calendar_events` with the coach's `activeTeam.id` instead of
  `calendar_events` with `user_id`.
- Athlete: `useCalendar.ts` additionally fetches the athlete's team's
  `team_calendar_events` (read-only) and merges them into the existing
  14-day preview / training-load calculation alongside personal events,
  visually distinguished (e.g. a "Team" badge/different color per the new
  event types) so it's clear which events are coach-authored vs.
  self-added. Personal `calendar_events` flow is untouched.

---

## 8. Sign-up and onboarding flow

**Name field + greeting:** add `display_name` to `profiles`
(`schema_v34`) as the source of truth (this repo already has a `profiles`
table from `schema_v22`, extended rather than duplicated). Signup form
(`src/app/login/page.tsx`) gains a "Name" text input alongside
email/password; on successful `signUp`, an insert/upsert into `profiles`
sets `display_name`. `Topbar.tsx`'s greeting changes from
`userEmail.split("@")[0]` to `displayName ?? email-prefix fallback` (keeps
working for any pre-existing accounts with no stored name yet).

**Extended onboarding, with step indicator:** after signup, before landing
on `/coach` or the athlete dashboard, a multi-step flow (new route or modal
sequence, "Step X of 4" indicator) replacing today's "signup → straight to
TeamSetup" jump:
1. Role confirmation (coach/athlete — likely already implied by
   TeamSetup's create-vs-join choice; folded into this flow rather than a
   separate screen)
2. Coach path: team name, competitive level (dropdown: Middle School / JV
   / Varsity / Club / College), season start/end dates, expected number of
   athletes, training days/week. Athlete path: position (dropdown: Outside
   Hitter / Middle Blocker / Opposite / Setter / Libero-DS), 1-2 training
   goals (multi-select from a short curated list, see below).
3. Coach: create-or-join team step (reuses existing `TeamSetup` logic).
   Athlete: join-team step (existing invite-code flow).
4. Confirmation/summary screen → into the app.

New onboarding-answer columns land on `profiles` too (`schema_v34`):
`competitive_level text`, `position text`, `season_start date`,
`season_end date`, `training_days_per_week int`, `athletes_expected int`,
all nullable (coach-only or athlete-only fields stay null for the other
role). `athletes_expected` is stored on the profile (not the team row) —
it's the coach's own onboarding answer, not a team property the multi-team
plan's `teams` table needs to track.

**Training-goal defaults derived from position** (no manual goal-setting
screen needed for a first version): a `POSITION_DEFAULT_GOALS` map, e.g.
Outside Hitter → ["Increase vertical jump", "Hitting power"]; Middle
Blocker → ["Vertical jump", "Blocking footwork/timing"]; Setter →
["Ball-handling speed", "Agility"]; Libero/DS → ["Lateral agility",
"First-step speed"]; Opposite → ["Hitting power", "Vertical jump"]. Stored
alongside the athlete's onboarding answers so wherever "training goals"
render elsewhere in the app, they're pre-populated instead of empty.

---

## 9. Dashboard and workouts-tab polish

**Dashboard (`DashboardCards.tsx`):** currently 4 cards (Today+streak+CTA,
Recovery, Weekly Progress, PR Board-latest-only) — reasonably built but
thin below the fold. Changes:
- Promote "Start today's workout" / "Continue workout" to a full-width
  hero action at the top (larger, primary-styled button, dynamic label
  based on whether an open session exists — reuses `useStartWorkout`'s
  existing open-session detection, no new logic).
- Add a **recent PRs list** (last 3-5, not just latest) and a **phase
  progress** indicator (current week / phase name / weeks remaining in
  phase, derived from `phaseSlug`/`week` already available) as additional
  cards, using data the app already tracks.

**Workouts tab:** `WorkoutGrid`/`DayCard` currently render every day of
the week as equal-weight cards with all exercises always expanded. Reduce
clutter: today's card renders expanded by default (as now); other days
collapse to a compact summary row (day name, title, completion count)
that expands on click. This is a pure presentational change to
`WorkoutGrid`/`DayCard` — no data changes.

**Em-dash/double-hyphen sweep:** in-scope fixes (landing page excluded):
`terms/page.tsx`, `privacy/page.tsx`, `login/page.tsx`,
`layout.tsx`'s metadata description. Each replaced with plain punctuation
(period, comma, or "and"/"but" as sense requires) — handled case-by-case
during implementation, not a mechanical find-replace, since correct
replacement depends on the sentence.

---

## Testing / verification approach

- `npx tsc --noEmit` and `npm run build` after every task (matches this
  repo's established per-task gate).
- Item 3 (timer) and Item 2 (already mandated by its own plan) get
  mandatory live verification via `npm run dev`, not just a code read —
  per explicit user instruction and this repo's `verification-before-
  completion` norm.
- New Playwright verify scripts added to `scripts/playwright-verify/` for:
  Attention Center rendering with seeded pain/PR data, discomfort-
  substitution banner appearing/dismissing, onboarding step flow
  end-to-end, team calendar event visible to a team member. Mirrors this
  repo's existing per-feature verify-script convention.
