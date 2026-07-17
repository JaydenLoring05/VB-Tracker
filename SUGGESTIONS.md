# Suggestions

Things noticed while working through the app that weren't in scope for this
pass, but are worth considering next. Grounded in what's actually in the
codebase, not generic advice.

## Auth

- **No password reset flow.** `src/app/login/page.tsx` has sign-in, sign-up,
  and Google OAuth, but no "Forgot password?" link. Supabase's
  `resetPasswordForEmail` + a `/auth/reset-password` page (reusing the
  `token_hash`/`type` handling now in `src/app/auth/callback/route.ts`) would
  close this gap with a small, self-contained addition.
- **Invite codes never expire or rotate.** `create_team()` in
  `supabase/schema_v20_teams.sql` generates a permanent 6-character code.
  If a coach posts it somewhere public by accident, there's no way to
  invalidate it short of deleting the team. A "regenerate invite code"
  RPC + button on `CoachDashboard.tsx` would be a natural, low-effort
  addition alongside the existing "remove athlete" action.

## Team layer

- **No way to leave or disband a team.** `team_members` has a
  `unique(user_id)` constraint (one team per user, ever), but there's no
  `leave_team()`/`delete_team()` RPC or UI. A coach who wants to start over,
  or an athlete who joined the wrong code, is stuck.
- **Removed-athlete UX is silent.** When a coach removes an athlete
  (`removeAthlete` in `useCoachRoster.ts`), that athlete's next visit to
  `/coach` just drops them back to the create/join screen with no
  explanation (confirmed this degrades gracefully, not a bug — just terse).
  A one-line "You were removed from [team name]" message would be kinder.
- **`removeAthlete` confirmation uses `window.confirm()`** (`CoachDashboard.tsx`)
  — a native unstyled browser dialog that looks out of place against the
  dark/gold theme. The app already has a themed modal pattern
  (`.modal-overlay`/`.modal-card`, built for `AthleteStatsModal`) that a
  small confirm dialog could reuse.

## Data / content

- **~138 of the 219 substitution hints in `src/data/exercises.ts` don't
  resolve to a catalog entry** (this is intentional and already documented/
  handled in `useExerciseSubstitutions.ts` — fixed the 16 that were genuine
  typos this pass). But some of the missing names recur across multiple
  exercises' substitution lists (`"Lat Pulldown"`, `"Romanian Deadlift"`,
  `"Glute Bridge"`, `"Bodyweight Row"`-adjacent variants, `"Dead Bug"`-adjacent
  variants). Writing full catalog entries for the handful of most-referenced
  missing names would let the curated-substitution picker actually surface
  curated options instead of falling back to "same category" every time.
- **`CalendarEvent.type` includes `"rest"`** (`src/types/index.ts`) but
  `calendar.css` has no `.rest` class — only `.workout`/`.practice`/`.game`/
  `.recovery` are styled. Not currently reachable (`makeDefaultEvents()` in
  `TrackerContext.tsx` never creates a `"rest"` event), but if that type is
  ever wired up the chip will render unstyled.

## Reliability

- **No automatic retry once connectivity returns.** `SyncErrorToast` +
  `reportSyncError` (both in `TrackerContext.tsx`) surface failed writes well,
  but a failed save just sits failed — there's no queued-retry when the
  network comes back. Worth considering for a gym app that's often used on
  patchy wifi.
- **`useCoachRoster` has no pagination.** Fine for a volleyball team (dozens
  of athletes at most), but the roster/stats/profiles queries load everyone
  in one shot with no limit — worth revisiting only if this ever gets used
  for a much larger roster than a single team.

## CSS / design system

- **`#0b0f14` is used as a hardcoded "recessed surface" background in at
  least 8 places** (`chart-card`, `pr-card`, `exercise-card`, `calendar-day`,
  `roster-row`, `logged-set`, `workout-summary-list li`, and the base
  `input`/`select`/`textarea` background) but was never promoted to a
  `--surface-2`-style token in `base.css` even though every usage is
  identical. Codifying it would make a future theme change (e.g. a light
  mode) a one-line edit instead of a repo-wide grep.

## Naming

- **"AI Coach" (`CoachPanel.tsx`)** is rule-based logic in
  `src/lib/recovery.ts` (`coachRecommendations`), not an LLM. Not a bug, just
  worth knowing if athletes are expected to assume otherwise.
