# ElevateOS refresh: bug fixes, audit cleanup, rebrand, small features

Date: 2026-07-18
Status: approved

## Scope

One pass across four independent tracks on the existing VB-Tracker app (repo at
`~/OneDrive/Documents/Projects/VB-Tracker`, rebranding to **ElevateOS**):

1. Rest timer skip bug (real bug, priority)
2. A pre-existing audit list (already largely confirmed by `SUGGESTIONS.md` from
   a prior pass) covering auth, team layer, data/content, reliability, CSS, naming
3. Branding/visual refresh + rename
4. Three small, low-risk feature additions

Explicitly out of scope: program builder, team calendar, in-app messaging,
tournament mode, jump-load tracker, testing combine, position-specific
scorecards, weekly automated reports, recruiting-profile export, smart
pain-based auto-adjustment, full daily-dashboard redesign. These get written
into `SUGGESTIONS.md` as backlog, not implemented.

## A. Rest timer bug (done, pending verification)

**Root cause** (`src/components/workout/ActiveWorkoutView.tsx`): the rest
countdown is driven by an effect keyed on `restEndsAt` (a timestamp) that runs
a 250ms `setInterval` recomputing `restSecondsLeft = restEndsAt - now`. The
`RestTimer`'s `onSkip` handler called `setRestSecondsLeft(null)` directly —
but `restEndsAt` was untouched, so the still-running interval overwrote
`restSecondsLeft` back to a positive number on its very next tick (≤250ms
later), and the timer reappeared almost instantly instead of ending.

**Fix applied**: `onSkip={() => setRestEndsAt(null)}` (was
`setRestSecondsLeft(null)`). Clearing `restEndsAt` triggers the effect's own
`if (restEndsAt === null)` branch, which sets `restSecondsLeft` to `null` and
lets cleanup stop the interval — no race.

**Verification**: install Playwright as a temporary dev dependency, sign up a
throwaway test account through the real sign-up flow (per user's choice —
against the real Supabase project, since no local/staging instance exists),
create a team, start a workout, log a set to trigger the rest timer, click
Skip, confirm the timer clears immediately and does not reappear, then delete
the throwaway account/team/session data afterward. Remove the Playwright dev
dependency at the end unless the user wants it kept.

## B. Audit fixes

All of the below are grounded in the current codebase (confirmed by reading
the actual files, not just `SUGGESTIONS.md`).

### Auth
- **Password reset**: add `supabase.auth.resetPasswordForEmail(email, { redirectTo: '<origin>/auth/callback?type=recovery' })` triggered from a new "Forgot password?" link on `src/app/login/page.tsx`. New page `src/app/auth/reset-password/page.tsx` collects a new password and calls `supabase.auth.updateUser({ password })`; it's reached after `auth/callback/route.ts` (unchanged — it already handles `token_hash`/`type` via `verifyOtp` and redirects to `/`) — redirect target for the recovery flow specifically goes to `/auth/reset-password` instead of `/` when `type=recovery`.
- **Invite code regeneration**: new `regenerate_invite_code()` RPC added to a new `supabase/schema_v23_team_management.sql` (bundled with the leave/disband RPCs below, since all three are team-layer additions to the same tables), coach-only (checks `team_members` role), reuses the same unique-code-generation loop as `create_team()`. Button next to the existing invite-code chip in `CoachDashboard.tsx`, same visual treatment as the invite-code button.

### Team layer
- **Leave team** (athlete self-service): new RLS policy on `team_members` (in `schema_v23_team_management.sql`) — `for delete using (role = 'athlete' and user_id = auth.uid())` — mirrors the existing "coach can remove athlete" policy, no RPC needed (no atomicity/secrecy concern, consistent with existing pattern). UI: a "Leave team" button in the athlete branch of `src/app/(app)/coach/page.tsx` (lines 30-40 today — the small read-only panel shown to athletes), behind the new themed confirm modal.
- **Disband team** (coach): new `delete_team()` RPC (same schema file), coach-only, deletes the `teams` row for the caller's own team (`team_members.team_id` FK is already `on delete cascade`, so member rows clean up automatically). UI: destructive action in `CoachDashboard.tsx`, behind the new themed confirm modal.
- **Removed-athlete message**: when an athlete's `team_members` row is deleted (by a coach, or by themselves via leave-team), their next `/coach` visit currently just falls through to `TeamSetup` (the `!team || !role` branch in `coach/page.tsx`). Mechanism: whenever `useTeam()` successfully loads a team, persist `{ teamId, teamName }` to `localStorage` under a fixed key (e.g. `vb-tracker:last-team`). On a load where `team` comes back `null` but that localStorage key is set, `coach/page.tsx` shows a one-line banner above `TeamSetup` — "You were removed from {teamName}." The voluntary "Leave team" action clears the localStorage key itself at the moment the athlete clicks it, so that path never shows the removed-by-coach banner to the person who just left on purpose. No new table.
- **Themed confirm modal**: extract a small reusable `ConfirmModal` (or inline pattern) using the existing `.modal-overlay`/`.modal-card` CSS from `AthleteStatsModal.tsx`. Replaces `window.confirm` in two places: `CoachDashboard.tsx` (remove athlete) and `ActiveWorkoutView.tsx` (finish workout) — both currently use the native dialog.

### Data / content
- Add full catalog entries (matching the existing `ex(...)` shape: name, category, level, icon, purpose, cues, mistakes, substitutions, video) for the missing substitution names, confirmed by grepping every `substitutions` array in `exercises.ts` for reference counts: **Lat Pulldown** (3 refs), **RDL** (3 refs — kept as its own entry distinct from "Romanian Deadlift" since the picker matches on exact string and both strings are used independently across different exercises' substitution lists), **Cable Row** (2), **Hollow Hold** (2), **Swiss Ball Curl** (2), **Bird Dog** (2), **Romanian Deadlift** (1 ref, named explicitly in the original ask), **Glute Bridge** (1 ref, named explicitly in the original ask). 8 new entries total, each assigned a category from the new taxonomy (section D) directly rather than the old one. Full drafted entries (ready to paste into `exercises.ts`) are in `docs/superpowers/specs/2026-07-18-exercise-catalog-research.md`.
- Add `.rest { ... }` styling to `src/styles/calendar.css` alongside `.workout`/`.practice`/`.game`/`.recovery` (same visual treatment tier — exact color TBD during the color/contrast pass in section C, likely `--muted`/border-only treatment since it's a "nothing scheduled" marker).
- **Evidence-based accuracy pass (expanded scope, added after initial spec)**: per user request, cross-checked the existing catalog's `purpose`-field claims against Jeff Nippard's coverage where findable, and the broader sports-science literature otherwise. Most claims held up (Nordic Hamstring Curl's injury-resistance framing, Hip Thrust's glute-activation framing, Spanish Squat's patellar-tendon-tolerance framing, Pallof Press's anti-rotation framing, and the plyometrics/SSC claims are all well-supported). Two claims were overstated and get reworded (content unchanged otherwise, no rewriting beyond these two sentences):
  - **Lateral Band Walks** — replace "weak hip abductors are one of the biggest modifiable risk factors for knee valgus (caving-in) collapse on landing" with: "Trains the hip abductors and glute medius to help control knee position on landing — a commonly used piece of knee-injury-risk-reduction work, though the strength-to-valgus link isn't as clear-cut as often claimed."
  - **Single-Leg Balance Reach** — replace "ACL-prevention research consistently pairs balance training with strength training, not strength alone" with: "Builds single-leg stability and proprioception — most useful as a supporting piece of ACL-injury-risk-reduction work alongside real strength and plyometric training, not as a stand-alone fix."
  - Direct, citable Nippard content was only findable for two topics (glute/hip-thrust exercise ranking, Nordic-curl form cues) — everything else above leans on general sports-science literature consistent with his usual sourcing, not a confirmed Nippard quote. Noting this transparently rather than overclaiming the sourcing.

### Reliability
- **Retry-on-reconnect**: `TrackerContext.tsx`'s `reportSyncError(message)` becomes `reportSyncError(message, retry?: () => void | Promise<void>)`. The context stores `{ message, retry }` as a single slot (replacing on every new error, not a queue). `SyncErrorToast` gains a "Retry" button that calls the stored `retry` if present. A `window.addEventListener('online', ...)` in `TrackerContext` also auto-invokes the stored retry once when connectivity returns (if a failed write is currently showing). Every existing `reportSyncError(...)` call site gets updated to pass the retry closure (the same operation it just attempted).

### CSS / design system
- Add `--surface-2: #0b0f14;` to `:root` in `base.css`. Replace all 11 hardcoded `#0b0f14` occurrences: `base.css:104` (input/select/textarea), `coach.css:79`, `calendar.css:23`, `landing.css:218`, `stats.css:24`, `stats.css:51`, `library.css:14`, `library.css:186`, `workout-mode.css:105`, `workout-mode.css:204`, `workouts.css:111`.

### Naming
- `CoachPanel.tsx`'s "AI Coach" heading → **"Recovery Coach"**. Also update the README bullet "AI-style recovery recommendations" to match (e.g. "Rule-based recovery recommendations" or similar non-AI-implying phrasing).

## C. Branding and visual refresh

- **New name: ElevateOS.** Replace "Volleyball Tracker" in: `src/app/layout.tsx` (`metadata.title`, and update `metadata.description`), `src/components/landing/LandingHeader.tsx` (brand lockup), `src/app/login/page.tsx` (subtitle), `src/app/page.tsx` (footer), `README.md` (title + prose). Keep the existing "Athlete Operating System" subtitle framing where it already appears — it pairs fine with the new name (e.g. "ElevateOS — Athlete Operating System").
- **More visual, less text-heavy landing page**: `PROBLEMS` and `STEPS` sections already use an icon + heading + short paragraph card pattern — keep the structure but trim body copy further, and add a simple connector/arrow visual between the 3 "How it works" steps instead of them just sitting in a grid. Add 2-3 stat callout tiles (e.g. "20-week program," "4 training phases," "10 exercise categories") as a visual row rather than folding those facts into paragraph text. The "Why the program is built the way it is" and "Built by someone who's lived it" sections currently are single dense paragraphs — break the philosophy paragraph into 3-4 short labeled points (still the same claims, just chunked), and keep the personal bio section mostly as prose (it's a personal narrative, not a features list, so it's the one place para text is a reasonable choice) but consider pulling the bullet list of facts into a more visual credentials row.
- **Color/contrast pass**: hands-on review of `base.css` and per-page CSS (`landing.css`, `coach.css`, `dashboard.css`, `stats.css`, etc.) for: text contrast (`--muted` #aeb6c4 on `--panel`/`--panel-2` backgrounds), gold-accent overuse (currently used for buttons, focus rings, ghost-button borders, progress fill, empty-state borders, ghost text — check it isn't applied so broadly it stops meaning "primary action"), and visual cohesion between older screens (athlete dashboard) and newer ones (landing, coach dashboard). No pre-specified new values — done by inspection during implementation, informed by the `design-taste`/`impeccable` design skills already active in this project (confirmed via the Impeccable hook already running on edits).
- **Contact email**: replace `jaydenloring05@gmail.com` with a clearly-fake placeholder, `hello@elevateos.com`, in the landing page mailto/button. It will not receive mail until that domain exists. Flagged in `SUGGESTIONS.md` as a known placeholder that needs a real domain email before launch. (Revised from an earlier draft of this spec that kept the real Gmail live — reconsidered because a fake-but-branded address reads better on a page selling to clubs than a personal Gmail, and the flag in SUGGESTIONS.md is enough to remember to wire up real mail later.)

## D. Small feature additions

- **Exercise category reorg**: remap `ExerciseCategory` in `src/types/index.ts` from the current 6 values (`"Lower Body" | "Upper Body" | "Plyometrics" | "Core" | "Mobility" | "Rehab"`) to the 10 new ones (`"Jump Development" | "Landing Mechanics" | "Knee Strength" | "Shoulder Health" | "Hitting Power" | "Rotational Core" | "Speed & Agility" | "Volleyball Conditioning" | "Mobility" | "Recovery"`), and update every exercise's `category` field in `src/data/exercises.ts` accordingly (single-field remap, no secondary tag, per user's choice). Draft mapping by old bucket:
  - **Lower Body** → mostly **Jump Development** (posterior-chain/quad/calf work feeding vertical jump); ambiguous: Nordic Hamstring Curl (hamstring power vs. injury-resistance) — default Jump Development, flagged for override.
  - **Plyometrics** → split into **Jump Development** (Approach Jumps, Box Jumps, Broad Jumps, Drop Jumps, Pogo Hops, Jump Rope), **Landing Mechanics** (Landing Mechanics Drill, Depth Drops), **Speed & Agility** (Lateral Bounds, Sprint Starts), **Volleyball Conditioning** (Court Sprints — explicitly volleyball-specific conditioning per its own `purpose` text).
  - **Upper Body** → split into **Hitting Power** (pressing-dominant: DB Bench Press, Push-Ups, Incline Push-Up, Dips, Landmine/DB Shoulder Press, Push Press, Pike Push-Ups) and **Shoulder Health** (pulling/balance-dominant: Pull-Ups, Band-Assisted Pull-Up, Chin-Ups, Single-Arm Row, Bodyweight Rows, Handstand Practice).
  - **Core** → **Rotational Core** for everything (Pallof Press, Med Ball Rotational Throws, Cable Woodchoppers, Landmine Rotations are true rotational work; the rest — Hanging Leg Raises, L-Sit, Dead Bugs, Side Planks, Planks, Ab Wheel Rollout, Back Extensions, Farmer Carries — don't have a dedicated general-core bucket in the new taxonomy, so they land in Rotational Core as the closest match; flagged as a known imperfect fit).
  - **Rehab** → split into **Knee Strength** (Lateral Band Walks, Clamshells, Spanish Squat, Single-Leg Balance Reach, Tibialis Raises, Patrick Step, Poliquin Step-Down, Reverse Sled Drag) and **Shoulder Health** (Face Pulls, Band Pull-Aparts, External Rotations, Scap Push-Ups, Y-T-W Raises, Cuban Rotations, Light Shoulder Band Work).
  - **Mobility** → split into **Mobility** (Full-Body Mobility Flow, Deep Squat Holds, Couch Stretch, Shoulder CARs, Hip CARs, 90/90 Hip Switches, Ankle Rocks, Thoracic Rotations) and **Recovery** (Walk 20-30 minutes, Light Stretching, Foam Roll).
  - This is a remap only — no exercise content/cues/text changes.
- **Previous result while logging**: **already implemented**, no work required. `useActiveWorkoutSession.ts` (lines 73-111) already queries prior `workout_sets` for the exercises in the current day (excluding the current session) and `ActiveWorkoutView.tsx` (line 286) already renders "Last time: {weight} × {reps}." Confirmed while reading the code for this spec — flagging so it isn't rebuilt or double-counted as new work.
- **Performance profile**: new table in `supabase/schema_v24_performance_profiles.sql`:
  ```sql
  create table if not exists public.performance_profiles (
    user_id uuid primary key references auth.users (id) on delete cascade,
    position text,
    height_in numeric,
    standing_reach_in numeric,
    approach_touch_in numeric,
    block_touch_in numeric,
    body_weight_lbs numeric,
    approach_vertical_in numeric generated always as (approach_touch_in - standing_reach_in) stored,
    updated_at timestamptz not null default now()
  );
  ```
  RLS matches the existing `profiles` table pattern from `schema_v22_profiles.sql`: own-row select/insert/update, plus a coach-read-only policy reusing `is_caller_coach_of()`. Surfaced as a new editable section on the athlete's own profile/stats area, and as an optional column in `CoachDashboard.tsx`'s roster table (position + approach vertical, following the existing roster-row visual pattern).

## E. Backlog

Append a new "Bigger features considered, deferred" section to the existing
`SUGGESTIONS.md` listing (one line + rationale each): program builder, team
calendar, in-app messaging, tournament mode, jump-load tracker, testing
combine, position-specific scorecards, weekly automated reports,
recruiting-profile export, smart pain-based auto-adjustment, full
daily-dashboard redesign. Also prune/update the existing audit-derived
sections of `SUGGESTIONS.md` for items this pass resolves (most of them), and
add the contact-email placeholder note.

## Verification

- `npx tsc --noEmit` and `npm run build` must both pass before considering
  any of this done.
- Rest timer fix verified live via Playwright + throwaway account (section A).
- No project-specific `run`/verify skill exists yet; recommend
  `/run-skill-generator` afterward so future passes don't have to
  rediscover the dev-server/Playwright setup from scratch.
