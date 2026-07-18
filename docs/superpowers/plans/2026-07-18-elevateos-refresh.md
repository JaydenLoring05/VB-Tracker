# ElevateOS Refresh Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the ElevateOS rebrand, a rest-timer bug fix, a set of audit-driven fixes (auth, team layer, data/content, reliability, CSS, naming), and three small feature additions to the VB-Tracker Next.js app, without expanding into any of the explicitly out-of-scope features.

**Architecture:** No structural rearchitecture — every task extends the existing hooks-plus-components/plain-CSS/Supabase-RLS conventions already in the codebase (see `docs/superpowers/specs/2026-07-18-elevateos-refresh-design.md` for the full rationale). New Postgres additions follow the existing `schema_vNN_*.sql`, run-once-in-SQL-Editor convention. New UI follows the existing `.panel`/`.card` + CSS-variable styling convention.

**Tech Stack:** Next.js 16 (App Router) + TypeScript + React 19 + Supabase (`@supabase/ssr`, `@supabase/supabase-js`) + plain CSS + Recharts + lucide-react. **No test framework exists in this repo** (no jest/vitest/testing-library in `package.json`, no `test` script) — this is consistent with the project's own conventions, not an oversight to fix in this pass. "Test" steps below therefore mean: `npx tsc --noEmit`, `npm run build`, and — for interactive/stateful flows — a Playwright script driving the real dev server against the real Supabase project (Task 1 builds this harness once; later tasks reuse it). Do not introduce Jest/Vitest/RTL as part of this plan; that's a separate, unrequested infrastructure decision.

## Global Constraints

- Repo root: `C:\Users\jaysk\OneDrive\Documents\Projects\VB-Tracker`. Windows/Git Bash environment.
- Match existing plain-CSS, hooks-plus-components conventions throughout — no new frameworks, state libraries, or CSS methodologies.
- `npx tsc --noEmit` and `npm run build` must both pass before any task is considered done.
- No project service-role/admin Supabase key is available (`.env.local` only has the public URL + anon key) — nothing in this plan may assume admin DB access. New `schema_vNN_*.sql` files are added to `supabase/` and the user is told to run them once in the Supabase SQL Editor, exactly like the existing `schema.sql` → `schema_v22_profiles.sql` chain documented in `README.md`.
- Do not build: program builder, team calendar, in-app messaging, tournament mode, jump-load tracker, testing combine, position-specific scorecards, weekly automated reports, recruiting-profile export, smart pain-based auto-adjustment, full daily-dashboard redesign. (Task 22 files these into `SUGGESTIONS.md` as backlog instead.)
- Rebrand name: **ElevateOS** (confirmed). Keep the existing "Athlete Operating System" subtitle framing where it already appears.
- Contact email is replaced with a fake placeholder, `hello@elevateos.com` (revised decision — see design doc), in the landing page mailto/button. It won't receive mail until that domain is real; flagged in `SUGGESTIONS.md`.
- The rest-timer bug fix described in Task 1 has already been applied to the working tree (uncommitted) as of plan-writing time: `src/components/workout/ActiveWorkoutView.tsx` line 316 was changed from `onSkip={() => setRestSecondsLeft(null)}` to `onSkip={() => setRestEndsAt(null)}`. Task 1 verifies and commits it; do not re-derive the fix from scratch if it's already present — check the file first.

---

## Task 1: Playwright verification harness + rest-timer bug fix verification

**Files:**
- Create: `scripts/playwright-verify/env.mjs`
- Create: `scripts/playwright-verify/auth.mjs`
- Create: `scripts/playwright-verify/rest-timer.mjs`
- Create: `.gitignore` entry (modify existing `.gitignore`)
- Modify (verify only, may already be applied): `src/components/workout/ActiveWorkoutView.tsx`

**Interfaces:**
- Produces: `scripts/playwright-verify/auth.mjs` exports `signUpOrSignIn(page, email, password)` — navigates to `/login`, tries sign-in, falls back to sign-up if the account doesn't exist yet, and resolves once redirected to `/dashboard`. Later tasks (6-9, 16-18, 23) reuse this.
- Produces: two fixed test accounts, `TEST_COACH_EMAIL`/`TEST_COACH_PASSWORD` and `TEST_ATHLETE_EMAIL`/`TEST_ATHLETE_PASSWORD`, defined in `scripts/playwright-verify/env.mjs` (gitignored — real values only exist locally, not committed). Later team-layer tasks reuse these same two accounts rather than creating new ones each time.

- [ ] **Step 1: Confirm the bug fix is present**

Read `src/components/workout/ActiveWorkoutView.tsx` around line 316. Confirm it reads:

```tsx
<RestTimer
  secondsLeft={restSecondsLeft}
  totalSeconds={REST_DURATION}
  onSkip={() => setRestEndsAt(null)}
/>
```

If it still reads `onSkip={() => setRestSecondsLeft(null)}`, apply this exact change now (root cause: the rest-countdown effect is keyed on `restEndsAt` and its `setInterval` recomputes `restSecondsLeft` from `restEndsAt` every 250ms — clearing only `restSecondsLeft` gets immediately overwritten; clearing `restEndsAt` stops the interval for good via the effect's own `if (restEndsAt === null)` branch).

- [ ] **Step 2: Install Playwright as a temporary dev dependency**

Run: `npm install --save-dev @playwright/test`
Run: `npx playwright install chromium`

- [ ] **Step 3: Add gitignore entries for local test credentials and Playwright artifacts**

Add to `.gitignore`:
```
scripts/playwright-verify/env.mjs
scripts/playwright-verify/screenshots/
```

- [ ] **Step 4: Create the local (untracked) test-account config**

Create `scripts/playwright-verify/env.mjs`:

```js
export const BASE_URL = "http://localhost:3000";

export const TEST_COACH_EMAIL = "elevateos.verify.coach@gmail.com";
export const TEST_COACH_PASSWORD = "Verify-Coach-2026!";

export const TEST_ATHLETE_EMAIL = "elevateos.verify.athlete@gmail.com";
export const TEST_ATHLETE_PASSWORD = "Verify-Athlete-2026!";
```

Note: these are throwaway accounts created directly through the real app's sign-up flow against the real Supabase project (per user's explicit choice earlier in this project). They exist for the duration of this implementation pass. Full deletion of the underlying `auth.users` rows requires a service-role key or the user manually removing them from the Supabase dashboard's Authentication > Users panel afterward — flag this to the user in the final task's report; do not claim full cleanup is possible without it.

- [ ] **Step 5: Create the shared auth helper**

Create `scripts/playwright-verify/auth.mjs`:

```js
export async function signUpOrSignIn(page, email, password) {
  await page.goto(`${(await import("./env.mjs")).BASE_URL}/login`);

  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');

  try {
    await page.waitForURL("**/dashboard", { timeout: 5000 });
    return;
  } catch {
    // Sign-in failed (account doesn't exist yet) -- switch to sign-up.
  }

  const signUpToggle = page.locator("button", { hasText: "Sign up" }).first();
  if (await signUpToggle.isVisible().catch(() => false)) {
    await signUpToggle.click();
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', password);
    await page.click('button[type="submit"]');
    await page.waitForURL("**/dashboard", { timeout: 10000 });
  }
}
```

- [ ] **Step 6: Create the rest-timer verification script**

Create `scripts/playwright-verify/rest-timer.mjs`:

```js
import { chromium } from "@playwright/test";
import { BASE_URL, TEST_COACH_EMAIL, TEST_COACH_PASSWORD } from "./env.mjs";
import { signUpOrSignIn } from "./auth.mjs";

const browser = await chromium.launch();
const page = await browser.newPage();

await signUpOrSignIn(page, TEST_COACH_EMAIL, TEST_COACH_PASSWORD);

await page.goto(`${BASE_URL}/workout`);
await page.waitForSelector("text=Start", { timeout: 10000 });
await page.click("button:has-text('Start')");
await page.waitForURL("**/workout/*");

await page.fill('input[placeholder="Reps"]', "10");
await page.click('button:has-text("Log Set")');

await page.waitForSelector(".rest-timer", { timeout: 5000 });
const before = await page.textContent(".rest-timer-header span:nth-child(2)");
console.log("Rest timer showing:", before);

await page.click('button:has-text("Skip Rest")');
await page.waitForTimeout(400);

const restTimerStillVisible = await page.locator(".rest-timer").isVisible().catch(() => false);

if (restTimerStillVisible) {
  console.error("FAIL: rest timer still visible 400ms after clicking Skip Rest");
  await page.screenshot({ path: "scripts/playwright-verify/screenshots/rest-timer-fail.png" });
  process.exitCode = 1;
} else {
  console.log("PASS: rest timer cleared immediately after Skip Rest and did not reappear");
  await page.screenshot({ path: "scripts/playwright-verify/screenshots/rest-timer-pass.png" });
}

await browser.close();
```

- [ ] **Step 7: Start the dev server and run the verification script**

Run: `npm run dev &` (or in a separate terminal) then poll until ready:
`timeout 30 bash -c 'until curl -sf http://localhost:3000 >/dev/null; do sleep 1; done'`

Run: `node scripts/playwright-verify/rest-timer.mjs`
Expected output: `PASS: rest timer cleared immediately after Skip Rest and did not reappear`

If it fails, look at `scripts/playwright-verify/screenshots/rest-timer-fail.png` and re-check Step 1's fix is actually applied and the dev server picked up the change (Next.js hot-reload should handle this automatically).

- [ ] **Step 8: Run typecheck and build**

Run: `npx tsc --noEmit`
Expected: no errors.
Run: `npm run build`
Expected: build succeeds.

- [ ] **Step 9: Commit**

```bash
git add src/components/workout/ActiveWorkoutView.tsx scripts/playwright-verify/auth.mjs scripts/playwright-verify/rest-timer.mjs .gitignore
git commit -m "fix: rest timer skip now actually ends the rest period

onSkip cleared restSecondsLeft but not restEndsAt, so the still-running
250ms interval (keyed on restEndsAt) immediately recomputed and
overwrote it back to a positive value. Clearing restEndsAt instead lets
the effect's own cleanup stop the interval for good.

Verified live via Playwright against the real dev server/Supabase project."
```

(`env.mjs` is gitignored, so it won't be staged — that's intentional.)

---

## Task 2: Shared themed confirm modal

**Files:**
- Create: `src/components/shared/ConfirmModal.tsx`
- Test: manual Playwright check folded into Tasks 3-4 (this task alone has no interactive surface to drive yet — it's not wired into any page).

**Interfaces:**
- Produces: `ConfirmModal({ title, message, confirmLabel, cancelLabel, danger, onConfirm, onCancel }: { title: string; message: string; confirmLabel?: string; cancelLabel?: string; danger?: boolean; onConfirm: () => void; onCancel: () => void })` — a React component. Tasks 3, 4, and 9 import and render this in place of `window.confirm`.

- [ ] **Step 1: Create the component**

Create `src/components/shared/ConfirmModal.tsx`:

```tsx
"use client";

import { useEffect } from "react";

export function ConfirmModal({
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  danger = false,
  onConfirm,
  onCancel
}: {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onCancel();
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onCancel]);

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div
        className="panel modal-card confirm-modal-card"
        role="alertdialog"
        aria-modal="true"
        aria-label={title}
        onClick={(event) => event.stopPropagation()}
      >
        <h2>{title}</h2>
        <p className="muted">{message}</p>

        <div className="button-row">
          <button type="button" className={danger ? "danger-button" : ""} onClick={onConfirm}>
            {confirmLabel}
          </button>
          <button type="button" className="ghost" onClick={onCancel}>
            {cancelLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
```

Note: `.danger-button` is currently only defined as a modifier for `.ghost` buttons in `base.css` (`.ghost.danger-button`/`.danger-button` styles color, not background) — check `base.css` around `.danger-button` (line ~183) before using it standalone on a filled button. If it only looks right combined with `.ghost`, use `className={danger ? "ghost danger-button" : ""}` instead so the confirm button reads as a bordered red action rather than a gold filled one for destructive confirms.

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors (component isn't imported anywhere yet, so this just confirms the file itself is valid TypeScript/JSX).

- [ ] **Step 3: Commit**

```bash
git add src/components/shared/ConfirmModal.tsx
git commit -m "feat: add shared themed ConfirmModal component

Reuses the existing .modal-overlay/.modal-card pattern from
AthleteStatsModal so destructive confirmations no longer fall back to
native window.confirm."
```

---

## Task 3: Replace window.confirm in CoachDashboard (remove athlete)

**Files:**
- Modify: `src/components/coach/CoachDashboard.tsx`

**Interfaces:**
- Consumes: `ConfirmModal` from Task 2.

- [ ] **Step 1: Add state and replace the confirm call**

In `src/components/coach/CoachDashboard.tsx`, add an import:

```tsx
import { ConfirmModal } from "@/components/shared/ConfirmModal";
```

Add state near the existing `selectedAthlete` state:

```tsx
const [pendingRemoval, setPendingRemoval] = useState<RosterAthlete | null>(null);
```

Replace the `handleRemove` function and the Remove button's `onClick`:

```tsx
function requestRemove(athlete: RosterAthlete) {
  if (removingId) return;
  setPendingRemoval(athlete);
}

async function confirmRemove() {
  if (!pendingRemoval) return;
  const userId = pendingRemoval.userId;
  setPendingRemoval(null);
  setRemovingId(userId);
  await removeAthlete(userId);
  setRemovingId(null);
}
```

Update the Remove button's `onClick` (currently `handleRemove(athlete.userId, athlete.displayName)`) to:

```tsx
onClick={(event) => {
  event.stopPropagation();
  requestRemove(athlete);
}}
```

Add the modal render, right after the existing `{selectedAthlete && (...)}` block at the end of the component's returned JSX (before the final closing `</div>`):

```tsx
{pendingRemoval && (
  <ConfirmModal
    title="Remove athlete?"
    message={`Remove ${pendingRemoval.displayName} from your roster?`}
    confirmLabel="Remove"
    danger
    onConfirm={confirmRemove}
    onCancel={() => setPendingRemoval(null)}
  />
)}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Manual verification via Playwright**

Reuse the Task 1 harness. Create `scripts/playwright-verify/remove-athlete-modal.mjs`:

```js
import { chromium } from "@playwright/test";
import { BASE_URL, TEST_COACH_EMAIL, TEST_COACH_PASSWORD } from "./env.mjs";
import { signUpOrSignIn } from "./auth.mjs";

const browser = await chromium.launch();
const page = await browser.newPage();
await signUpOrSignIn(page, TEST_COACH_EMAIL, TEST_COACH_PASSWORD);
await page.goto(`${BASE_URL}/coach`);
await page.waitForTimeout(1000);
await page.screenshot({ path: "scripts/playwright-verify/screenshots/coach-page.png" });
console.log("Screenshot taken -- manually confirm no native browser confirm() dialog fires when clicking Remove on a roster row, and that a themed modal appears instead.");
await browser.close();
```

Run: `node scripts/playwright-verify/remove-athlete-modal.mjs`, inspect the screenshot, and if the coach test account has no roster yet (likely, since it hasn't created/joined a team), note that full interactive verification of this specific modal happens naturally in Task 9 once `TEST_COACH_EMAIL` has created a team and `TEST_ATHLETE_EMAIL` has joined it. For this task, confirming the component compiles and renders without runtime errors (no console errors from `page.on("console")`) is sufficient; the full click-through is verified in Task 9's script instead.

- [ ] **Step 4: Commit**

```bash
git add src/components/coach/CoachDashboard.tsx scripts/playwright-verify/remove-athlete-modal.mjs
git commit -m "fix: replace window.confirm with themed ConfirmModal for athlete removal"
```

---

## Task 4: Replace window.confirm in ActiveWorkoutView (finish workout)

**Files:**
- Modify: `src/components/workout/ActiveWorkoutView.tsx`

**Interfaces:**
- Consumes: `ConfirmModal` from Task 2.

- [ ] **Step 1: Add state and replace the confirm call**

Add import:

```tsx
import { ConfirmModal } from "@/components/shared/ConfirmModal";
```

Add state near the other `useState` calls:

```tsx
const [confirmingFinish, setConfirmingFinish] = useState(false);
```

Replace `handleFinish`:

```tsx
function requestFinish() {
  if (isFinishing) return;
  setConfirmingFinish(true);
}

async function confirmFinish() {
  setConfirmingFinish(false);
  setIsFinishing(true);
  const result = await finishWorkout(resolvedExercises);
  setIsFinishing(false);

  if (result) {
    setFinishResult(result);
    setFinished(true);
  }
}
```

Update the "Finish Workout" button's `onClick` from `handleFinish` to `requestFinish`.

Add the modal render just before the closing `</div>` of the component's returned JSX:

```tsx
{confirmingFinish && (
  <ConfirmModal
    title="Finish workout?"
    message={
      sets.length > 0
        ? `${sets.length} set${sets.length === 1 ? "" : "s"} logged.`
        : "No sets have been logged yet."
    }
    confirmLabel="Finish"
    onConfirm={confirmFinish}
    onCancel={() => setConfirmingFinish(false)}
  />
)}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Manual verification via Playwright**

Extend `scripts/playwright-verify/rest-timer.mjs`'s flow in a new script `scripts/playwright-verify/finish-workout-modal.mjs` (start a workout as `TEST_COACH_EMAIL`, click "Finish Workout", assert `.modal-card` becomes visible via `page.waitForSelector(".modal-card")`, click "Finish" inside it, assert navigation to the workout summary view by waiting for `text=Workout Complete` or similar heading — check `WorkoutSummary.tsx` for the actual heading text before writing the assertion).

Run it and confirm the themed modal appears (no native dialog) and finishing completes correctly.

- [ ] **Step 4: Commit**

```bash
git add src/components/workout/ActiveWorkoutView.tsx scripts/playwright-verify/finish-workout-modal.mjs
git commit -m "fix: replace window.confirm with themed ConfirmModal for finishing a workout"
```

---

## Task 5: Password reset flow

**Files:**
- Modify: `src/app/login/page.tsx`
- Create: `src/app/auth/reset-password/page.tsx`
- Modify: `src/app/auth/callback/route.ts`

**Interfaces:**
- Produces: `/auth/reset-password` page that calls `supabase.auth.updateUser({ password })`.

- [ ] **Step 1: Route recovery-type callbacks to the reset-password page**

In `src/app/auth/callback/route.ts`, both the `code` and `token_hash`/`type` branches currently redirect unconditionally to `${origin}/`. Update the `tokenHash && type` branch so a `type === "recovery"` redirects to the reset-password page instead:

```ts
  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
    if (error) {
      console.error("Failed to verify confirmation token", error);
      return redirectWithError(origin, EXPIRED_LINK_MESSAGE);
    }
    if (type === "recovery") {
      return NextResponse.redirect(`${origin}/auth/reset-password`);
    }
    return NextResponse.redirect(`${origin}/`);
  }
```

- [ ] **Step 2: Add "Forgot password?" to the login page**

In `src/app/login/page.tsx`, add a new mode value and handler. Update the `Mode` type:

```tsx
type Mode = "sign-in" | "sign-up" | "forgot-password";
```

Add state:

```tsx
const [resetSent, setResetSent] = useState(false);
```

Add a handler function (near `handleResend`):

```tsx
async function handleForgotPassword() {
  if (!email.trim()) {
    setError("Enter your email above first.");
    return;
  }

  setLoading(true);
  const supabase = createClient();
  const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
    redirectTo: `${window.location.origin}/auth/callback`
  });
  setLoading(false);

  if (resetError) {
    setError(resetError.message);
    return;
  }

  setError("");
  setResetSent(true);
  setMessage("Check your email for a password reset link.");
}
```

In the `auth-switch` block, add a link (only shown in `sign-in` mode, next to the existing "Need an account?" line):

```tsx
{mode === "sign-in" && !resetSent && (
  <button type="button" className="auth-resend" onClick={handleForgotPassword} disabled={loading}>
    Forgot password?
  </button>
)}
```

- [ ] **Step 3: Create the reset-password page**

Create `src/app/auth/reset-password/page.tsx`:

```tsx
"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

import { createClient } from "@/lib/supabase/client";

import "@/styles/auth.css";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="auth-shell">
      <div className="panel auth-card">
        <div className="logo">🏐</div>
        <h1>Set a new password</h1>

        <form className="auth-form" onSubmit={handleSubmit}>
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="New password"
            autoComplete="new-password"
          />

          <input
            type="password"
            required
            minLength={6}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm new password"
            autoComplete="new-password"
          />

          {error && <p className="auth-error">{error}</p>}

          <button type="submit" disabled={loading}>
            {loading ? "Saving..." : "Set new password"}
          </button>
        </form>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 5: Manual verification via Playwright (email-in-the-loop, best-effort)**

Full email-based verification requires receiving a real email at `TEST_COACH_EMAIL`'s inbox, which is out of reach for an automated script unless that address is a real inbox the user controls. Create `scripts/playwright-verify/forgot-password.mjs` that: navigates to `/login`, fills in `TEST_COACH_EMAIL`, clicks "Forgot password?", and asserts the success message "Check your email for a password reset link." appears (`page.waitForSelector("text=Check your email")`). This verifies the request-side flow (Supabase accepted the call, UI shows confirmation) without requiring inbox access. Note in the final report that the link-click/`updateUser` half of this flow wasn't exercised end-to-end for that reason — flag it as a known gap rather than claiming full verification.

Run it and confirm the PASS condition.

- [ ] **Step 6: Commit**

```bash
git add src/app/login/page.tsx src/app/auth/reset-password/page.tsx src/app/auth/callback/route.ts scripts/playwright-verify/forgot-password.mjs
git commit -m "feat: add password reset flow

Adds a Forgot password? link on the login page using
resetPasswordForEmail(), and a new /auth/reset-password page that
completes the flow via updateUser(). Reuses the existing token_hash/type
handling in auth/callback/route.ts, routing type=recovery there instead
of the default redirect to /."
```

---

## Task 6: Team management schema (invite regeneration, leave, disband)

**Files:**
- Create: `supabase/schema_v23_team_management.sql`

**Interfaces:**
- Produces: RPCs `regenerate_invite_code()` and `delete_team()`, plus a new RLS delete policy on `team_members`, consumed by Tasks 7, 8, 9.

- [ ] **Step 1: Write the migration file**

Create `supabase/schema_v23_team_management.sql`:

```sql
-- Volleyball Tracker V23 schema (team management: invite regen, leave, disband)
-- Run this once in the Supabase SQL Editor, after schema_v20_teams.sql.
-- Safe to re-run.

-- Athletes can remove their own membership row (self-service "leave team"),
-- mirroring the existing "coach can remove athlete" policy in schema_v20.
drop policy if exists "athlete can leave team" on public.team_members;
create policy "athlete can leave team" on public.team_members
  for delete using (
    role = 'athlete' and user_id = auth.uid()
  );

create or replace function public.regenerate_invite_code()
returns table (invite_code text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_team_id uuid;
  v_code text;
  v_attempts int := 0;
begin
  select team_members.team_id into v_team_id
  from public.team_members
  where team_members.user_id = auth.uid()
    and team_members.role = 'coach';

  if v_team_id is null then
    raise exception 'You are not a coach of any team.';
  end if;

  loop
    v_code := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6));
    exit when not exists (select 1 from public.teams t where t.invite_code = v_code);
    v_attempts := v_attempts + 1;
    if v_attempts > 10 then
      raise exception 'Could not generate a unique invite code. Try again.';
    end if;
  end loop;

  update public.teams set invite_code = v_code where id = v_team_id;

  return query select v_code;
end;
$$;

grant execute on function public.regenerate_invite_code() to authenticated;

create or replace function public.delete_team()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_team_id uuid;
begin
  select team_members.team_id into v_team_id
  from public.team_members
  where team_members.user_id = auth.uid()
    and team_members.role = 'coach';

  if v_team_id is null then
    raise exception 'You are not a coach of any team.';
  end if;

  -- team_members.team_id references public.teams(id) on delete cascade,
  -- so deleting the team row cleans up every member row (coach + athletes)
  -- in one statement.
  delete from public.teams where id = v_team_id;
end;
$$;

grant execute on function public.delete_team() to authenticated;
```

- [ ] **Step 2: Ask the user to apply the migration**

Since no service-role key is available to this environment, this SQL cannot be run programmatically. Tell the user: "Please run `supabase/schema_v23_team_management.sql` once in your Supabase project's SQL Editor before I continue to Task 7 (it adds the RPCs and policy the next few tasks depend on)." Wait for confirmation before proceeding to Task 7's live verification (the code for Tasks 7-9 can still be written against this file without the migration being applied yet, but their Playwright verification steps will fail with "function does not exist" until it is).

- [ ] **Step 3: Commit**

```bash
git add supabase/schema_v23_team_management.sql
git commit -m "feat: add team management RPCs (regenerate invite code, disband team) and leave-team policy

New schema_v23_team_management.sql: regenerate_invite_code() and
delete_team() RPCs (both coach-only, mirroring create_team()'s
unique-code-generation loop and RLS conventions), plus a plain RLS
delete policy letting an athlete remove their own team_members row --
consistent with how coach-removes-athlete is already a plain policy,
not an RPC, since there's no atomicity/secrecy concern."
```

---

## Task 7: Invite code regeneration UI

**Files:**
- Modify: `src/hooks/useTeam.ts`
- Modify: `src/components/coach/CoachDashboard.tsx`

**Interfaces:**
- Consumes: `regenerate_invite_code()` RPC from Task 6.
- Produces: `useTeam()` gains `regenerateInviteCode: () => Promise<boolean>`.

- [ ] **Step 1: Add the hook method**

In `src/hooks/useTeam.ts`, add after `joinTeam`:

```tsx
  async function regenerateInviteCode() {
    setError(null);

    const { error: rpcError } = await supabase.rpc("regenerate_invite_code");

    if (rpcError) {
      setError(rpcError.message || "Couldn't regenerate the invite code.");
      return false;
    }

    await loadTeam();
    return true;
  }
```

Add `regenerateInviteCode` to the returned object.

- [ ] **Step 2: Wire it into CoachDashboard**

`CoachDashboard` currently receives `team` as a prop and doesn't call `useTeam()` itself — check `src/app/(app)/coach/page.tsx` to confirm (it does: `CoachDashboard` is rendered with `team={team}` from the page's own `useTeam()` call, and `CoachDashboard` doesn't have access to `regenerateInviteCode` or a way to refresh the parent's `team` prop). Two options: lift `regenerateInviteCode` + a refresh callback down as new props, or call `useTeam()` a second time inside `CoachDashboard` (React Query-less duplicate fetch, acceptable given the existing codebase already re-fetches per-component rather than sharing a cache — e.g. `useCoachRoster` and `useTeam` are already independent). Use the second option for consistency with existing patterns and to avoid a prop-drilling refactor of `coach/page.tsx`.

In `src/components/coach/CoachDashboard.tsx`, add:

```tsx
import { useTeam } from "@/hooks/useTeam";
```

Inside the component, add:

```tsx
const { regenerateInviteCode } = useTeam();
const [regenerating, setRegenerating] = useState(false);
const [regeneratedCode, setRegeneratedCode] = useState<string | null>(null);

async function handleRegenerateCode() {
  if (regenerating) return;
  setRegenerating(true);
  const ok = await regenerateInviteCode();
  setRegenerating(false);
  if (ok) setRegeneratedCode("Invite code regenerated.");
  setTimeout(() => setRegeneratedCode(null), 3000);
}
```

Note: because `CoachDashboard` still receives the original `team` prop from `coach/page.tsx` (unchanged), the invite-code chip button (`handleCopyCode`, using `team.invite_code`) will keep showing the **old** code until `coach/page.tsx`'s own `useTeam()` re-fetches. Since `coach/page.tsx` doesn't currently expose a `refresh` callback down to `CoachDashboard`, add one: modify `src/app/(app)/coach/page.tsx` to pass `onTeamChange={refresh}` (destructure `refresh` from its own `useTeam()` call) into `<CoachDashboard team={team} onTeamChange={refresh} />`, and have `CoachDashboard` accept `onTeamChange?: () => void` in its props and call it after a successful `handleRegenerateCode` (and later, after disband in Task 9).

Update `CoachDashboard`'s props type:

```tsx
export function CoachDashboard({ team, onTeamChange }: { team: Team; onTeamChange?: () => void }) {
```

Update `handleRegenerateCode` to call `onTeamChange?.()` after a successful regenerate.

Add a new button next to the existing invite-code chip:

```tsx
<button className="ghost" onClick={handleRegenerateCode} disabled={regenerating} type="button">
  <RefreshCw size={16} /> {regenerating ? "Regenerating..." : "Regenerate code"}
</button>
```

(`RefreshCw` is already imported in this file for the roster refresh button.)

- [ ] **Step 3: Update `coach/page.tsx`**

In `src/app/(app)/coach/page.tsx`, destructure `refresh` from `useTeam()` and pass it through:

```tsx
const { loading, team, role, error, createTeam, joinTeam, refresh } = useTeam();
...
if (role === "coach") {
  return <CoachDashboard team={team} onTeamChange={refresh} />;
}
```

- [ ] **Step 4: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 5: Manual verification via Playwright**

Confirm the user has applied Task 6's migration (ask if not yet confirmed). Create `scripts/playwright-verify/regenerate-invite-code.mjs`:

```js
import { chromium } from "@playwright/test";
import { BASE_URL, TEST_COACH_EMAIL, TEST_COACH_PASSWORD } from "./env.mjs";
import { signUpOrSignIn } from "./auth.mjs";

const browser = await chromium.launch();
const page = await browser.newPage();
await signUpOrSignIn(page, TEST_COACH_EMAIL, TEST_COACH_PASSWORD);
await page.goto(`${BASE_URL}/coach`);

// Create a team if this account doesn't have one yet.
const createTeamButton = page.locator("button", { hasText: "Create" }).first();
if (await createTeamButton.isVisible().catch(() => false)) {
  await page.fill('input[placeholder*="team" i]', "Verify Team");
  await createTeamButton.click();
  await page.waitForTimeout(1000);
}

const codeButtonBefore = await page.textContent(".invite-code-button");
await page.click("button:has-text('Regenerate code')");
await page.waitForTimeout(1000);
const codeButtonAfter = await page.textContent(".invite-code-button");

if (codeButtonBefore !== codeButtonAfter) {
  console.log("PASS: invite code changed after regenerating", { codeButtonBefore, codeButtonAfter });
} else {
  console.error("FAIL: invite code did not change", { codeButtonBefore, codeButtonAfter });
  process.exitCode = 1;
}

await browser.close();
```

Run it and confirm PASS.

- [ ] **Step 6: Commit**

```bash
git add src/hooks/useTeam.ts src/components/coach/CoachDashboard.tsx src/app/\(app\)/coach/page.tsx scripts/playwright-verify/regenerate-invite-code.mjs
git commit -m "feat: add invite code regeneration to coach dashboard"
```

---

## Task 8: Leave-team UI + removed-athlete banner

**Files:**
- Modify: `src/hooks/useTeam.ts`
- Modify: `src/app/(app)/coach/page.tsx`

**Interfaces:**
- Consumes: the new "athlete can leave team" RLS policy from Task 6, `ConfirmModal` from Task 2.
- Produces: `useTeam()` gains `leaveTeam: () => Promise<boolean>`.

- [ ] **Step 1: Add the hook method and localStorage bookkeeping**

In `src/hooks/useTeam.ts`, add a constant and update `loadTeam` to persist/read the last-known team, and add `leaveTeam`:

```tsx
const LAST_TEAM_KEY = "vb-tracker:last-team";
```

In `loadTeam`, right after `setTeam(teamRow as Team); setRole(memberRow.role as TeamRole);`, add:

```tsx
    if (typeof window !== "undefined") {
      window.localStorage.setItem(
        LAST_TEAM_KEY,
        JSON.stringify({ teamId: teamRow.id, teamName: (teamRow as Team).name })
      );
    }
```

And right after the `if (!memberRow) { setTeam(null); setRole(null); setLoading(false); return; }` branch's `setTeam(null)` (i.e. when there's no membership), leave the localStorage key untouched here (it needs to survive so the removed-athlete banner can read it) -- do not clear it in this branch.

Add `leaveTeam`, after `joinTeam`:

```tsx
  async function leaveTeam() {
    setError(null);

    const { error: deleteError } = await supabase
      .from("team_members")
      .delete()
      .eq("user_id", userId)
      .eq("role", "athlete");

    if (deleteError) {
      setError(deleteError.message || "Couldn't leave the team.");
      return false;
    }

    if (typeof window !== "undefined") {
      window.localStorage.removeItem(LAST_TEAM_KEY);
    }

    await loadTeam();
    return true;
  }
```

Add `leaveTeam` to the returned object.

- [ ] **Step 2: Add the removed-athlete banner + leave-team button to the athlete view**

In `src/app/(app)/coach/page.tsx`, add imports:

```tsx
import { useEffect, useState } from "react";
import { ConfirmModal } from "@/components/shared/ConfirmModal";
```

Inside `CoachPage`, destructure `leaveTeam` too:

```tsx
const { loading, team, role, error, createTeam, joinTeam, refresh, leaveTeam } = useTeam();
const [removedFromTeam, setRemovedFromTeam] = useState<string | null>(null);
const [confirmingLeave, setConfirmingLeave] = useState(false);
```

Add an effect that checks for a stale localStorage key when `team` comes back `null` after loading (place this after the existing hook calls, before the early returns):

```tsx
useEffect(() => {
  if (loading || team) return;
  if (typeof window === "undefined") return;

  const raw = window.localStorage.getItem("vb-tracker:last-team");
  if (!raw) return;

  try {
    const { teamName } = JSON.parse(raw) as { teamName: string };
    setRemovedFromTeam(teamName);
  } catch {
    // Malformed value -- ignore and clear it below.
  }

  window.localStorage.removeItem("vb-tracker:last-team");
}, [loading, team]);
```

Update the `!team || !role` branch to show the banner above `TeamSetup`:

```tsx
if (!team || !role) {
  return (
    <>
      {removedFromTeam && (
        <div className="empty-state">
          <p className="muted">You were removed from {removedFromTeam}.</p>
        </div>
      )}
      <TeamSetup onCreateTeam={createTeam} onJoinTeam={joinTeam} error={error} />
    </>
  );
}
```

Update the athlete-role branch (currently a static `<div className="panel">`) to add a "Leave team" button and its confirm modal:

```tsx
if (role === "athlete") {
  return (
    <div className="panel">
      <h2>
        <Users size={22} /> {team.name}
      </h2>
      <p className="muted">
        You&apos;re on this team as an athlete. Your coach can see your recovery stats and
        training history to check in on you -- your data stays read-only to them.
      </p>

      <button type="button" className="ghost danger-button" onClick={() => setConfirmingLeave(true)}>
        Leave team
      </button>

      {confirmingLeave && (
        <ConfirmModal
          title="Leave team?"
          message={`You'll need a new invite code to rejoin ${team.name} or any other team.`}
          confirmLabel="Leave"
          danger
          onConfirm={async () => {
            setConfirmingLeave(false);
            await leaveTeam();
          }}
          onCancel={() => setConfirmingLeave(false)}
        />
      )}
    </div>
  );
}
```

(This replaces the plain `return (<div className="panel">...</div>)` that previously handled both the athlete display and the implicit fallthrough -- since `role === "coach"` already returns earlier, this final block only ever runs for `role === "athlete"`, so wrapping it in the explicit `if (role === "athlete")` is equivalent to the existing final `return`; keep whichever reads more clearly but ensure only one `return` remains at the bottom of the function.)

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Manual verification via Playwright**

Confirm Task 6's migration is applied. Create `scripts/playwright-verify/leave-team.mjs` that: signs in as `TEST_COACH_EMAIL`, creates a team if needed, copies the invite code (read `.invite-code-button`'s text and parse the 6-char code out of it), signs in as `TEST_ATHLETE_EMAIL` in a second browser context, joins using that code, confirms the athlete view renders with a "Leave team" button, clicks it, confirms the `ConfirmModal` appears, clicks "Leave", and asserts the page now shows `TeamSetup` again (e.g. `page.waitForSelector("text=Create")` or whatever `TeamSetup`'s create-team heading text actually is -- check `TeamSetup.tsx` first). Then, separately, verify the removed-by-coach path: have `TEST_ATHLETE_EMAIL` rejoin using the same code, then have `TEST_COACH_EMAIL` remove them from the roster (Task 3's flow), then reload as `TEST_ATHLETE_EMAIL` and assert the "You were removed from Verify Team." banner appears.

Run it and confirm both paths PASS.

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useTeam.ts src/app/\(app\)/coach/page.tsx scripts/playwright-verify/leave-team.mjs
git commit -m "feat: add self-service leave-team and removed-athlete banner

Athletes can now leave a team via a themed confirm dialog (new
athlete-can-leave-team RLS policy). A one-line 'You were removed from
{team}' banner appears on the next /coach visit if a coach removed the
athlete, tracked via a localStorage flag set whenever a team loads
successfully and cleared on voluntary leave or once the banner is shown."
```

---

## Task 9: Disband-team UI

**Files:**
- Modify: `src/hooks/useTeam.ts`
- Modify: `src/components/coach/CoachDashboard.tsx`

**Interfaces:**
- Consumes: `delete_team()` RPC from Task 6, `ConfirmModal` from Task 2.

- [ ] **Step 1: Add the hook method**

In `src/hooks/useTeam.ts`, add after `regenerateInviteCode` (from Task 7):

```tsx
  async function disbandTeam() {
    setError(null);

    const { error: rpcError } = await supabase.rpc("delete_team");

    if (rpcError) {
      setError(rpcError.message || "Couldn't disband the team.");
      return false;
    }

    if (typeof window !== "undefined") {
      window.localStorage.removeItem("vb-tracker:last-team");
    }

    await loadTeam();
    return true;
  }
```

Add `disbandTeam` to the returned object.

- [ ] **Step 2: Wire it into CoachDashboard**

In `src/components/coach/CoachDashboard.tsx`, destructure `disbandTeam` alongside `regenerateInviteCode` from the `useTeam()` call added in Task 7. Add state:

```tsx
const [confirmingDisband, setConfirmingDisband] = useState(false);
```

Add a handler:

```tsx
async function handleDisband() {
  setConfirmingDisband(false);
  const ok = await disbandTeam();
  if (ok) onTeamChange?.();
}
```

Add a destructive button somewhere clearly separated from the roster (e.g. bottom of the `team-header` panel):

```tsx
<button type="button" className="ghost danger-button" onClick={() => setConfirmingDisband(true)}>
  Disband team
</button>

{confirmingDisband && (
  <ConfirmModal
    title="Disband this team?"
    message={`This removes ${team.name} and every athlete's membership. This can't be undone.`}
    confirmLabel="Disband"
    danger
    onConfirm={handleDisband}
    onCancel={() => setConfirmingDisband(false)}
  />
)}
```

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Manual verification via Playwright**

Create `scripts/playwright-verify/disband-team.mjs`: sign in as `TEST_COACH_EMAIL`, ensure a team exists (create one if not), click "Disband team", confirm the `ConfirmModal`, click "Disband", and assert the page falls back to `TeamSetup` (same assertion approach as Task 8). Also confirm (in a second browser context) that `TEST_ATHLETE_EMAIL`, if currently joined to that team, sees the removed-athlete banner on their next `/coach` load — this is the same banner mechanism from Task 8, now triggered by disband instead of individual removal.

Run it and confirm PASS.

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useTeam.ts src/components/coach/CoachDashboard.tsx scripts/playwright-verify/disband-team.mjs
git commit -m "feat: add disband-team action to coach dashboard"
```

---

## Task 10: Retry-on-reconnect for failed writes

**Files:**
- Modify: `src/context/TrackerContext.tsx`
- Modify: `src/components/layout/SyncErrorToast.tsx`
- Modify: `src/hooks/useActiveWorkoutSession.ts`
- Modify: `src/hooks/useStartWorkout.ts`

**Interfaces:**
- Produces: `reportSyncError(message: string, retry?: () => void)` (was `reportSyncError(message: string)`), plus new context fields `syncRetry: (() => void) | null` and `retrySyncError: () => void`.

- [ ] **Step 1: Update the context's state and function signature**

In `src/context/TrackerContext.tsx`, update the type:

```tsx
  syncError: string | null;
  reportSyncError: (message: string, retry?: () => void) => void;
  retrySyncError: () => void;
  clearSyncError: () => void;
```

Add a new state slot next to `syncError`:

```tsx
  const [syncError, setSyncError] = useState<string | null>(null);
  const [syncRetry, setSyncRetry] = useState<(() => void) | null>(null);
```

Update `reportSyncError` and add `retrySyncError`:

```tsx
  function reportSyncError(message: string, retry?: () => void) {
    setSyncError(message);
    setSyncRetry(() => retry ?? null);
  }

  function clearSyncError() {
    setSyncError(null);
    setSyncRetry(null);
  }

  function retrySyncError() {
    if (syncRetry) {
      clearSyncError();
      syncRetry();
    }
  }
```

(`setSyncRetry(() => retry ?? null)` — the outer arrow function is required so `useState`'s setter stores the function itself rather than calling it as an updater.)

- [ ] **Step 2: Add an online-event listener**

Add a new `useEffect` (anywhere alongside the existing ones, e.g. right after the last-active-timestamp effect):

```tsx
  useEffect(() => {
    function handleOnline() {
      if (syncRetry) retrySyncError();
    }

    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [syncRetry]);
```

- [ ] **Step 3: Pass retry closures at every call site in this file**

Update each of the 11 `reportSyncError(...)` calls in `TrackerContext.tsx` to also pass a retry closure that re-invokes the same operation with the same arguments:

| Line (pre-change) | Call site | New retry arg |
|---|---|---|
| `~300` (calendar setup, inside `load()`) | initial calendar bootstrap | This one runs inside the top-level `load()` effect, not a named callable function — leave this one without a retry (`reportSyncError(message)` unchanged); reconnect will naturally retry it anyway since it re-runs whenever `userId` changes, and wrapping it would require extracting `load()` into a stable reusable function, which is a bigger change than "basic" calls for. Note this exception explicitly rather than silently skipping it. |
| `~356` (`setExerciseChecked`) | `reportSyncError("Couldn't save that checkmark. Check your connection and try again.")` | `reportSyncError("Couldn't save that checkmark. Check your connection and try again.", () => setExerciseChecked(checkedWeek, day, exercise, isChecked))` |
| `~377` (`updateWorkoutLog`) | `reportSyncError("Couldn't save that entry. Check your connection and try again.")` | `reportSyncError("Couldn't save that entry. Check your connection and try again.", () => updateWorkoutLog(day, exercise, value))` |
| `~398` (`updateWorkoutNote`) | `reportSyncError("Couldn't save that note. Check your connection and try again.")` | `reportSyncError("Couldn't save that note. Check your connection and try again.", () => updateWorkoutNote(day, note))` |
| `~419` (`saveStats`'s `rollbackOnce`) | `reportSyncError(message)` | `reportSyncError(message, () => saveStats())` — note `rollbackOnce` already rolled `stats`/`history` back to `previousStats`/`previousHistory` by this point, so retry re-saves whatever the current in-memory `stats` is at retry time (the pre-edit value, since it was rolled back) rather than the user's original attempted edit. This is an accepted limitation of the "basic" single-slot design — flag it in the commit message, don't try to fix it by changing rollback semantics (out of scope). |
| `~455` (`clearStats`) | `reportSyncError("Couldn't clear your stats history. Try again.")` | `reportSyncError("Couldn't clear your stats history. Try again.", () => clearStats())` |
| `~471` (`addGame`) | `reportSyncError("Couldn't add that game to your calendar. Try again.")` | `reportSyncError("Couldn't add that game to your calendar. Try again.", () => addGame(title))` |
| `~496` (`addPR`) | `reportSyncError("Couldn't save that PR. Try again.")` | `reportSyncError("Couldn't save that PR. Try again.", () => addPR(pr))` |
| `~526` (`setSubstitution`) | `reportSyncError("Couldn't save that swap. Check your connection and try again.")` | `reportSyncError("Couldn't save that swap. Check your connection and try again.", () => setSubstitution(originalExercise, chosenExercise))` |
| `~550` (`clearSubstitution`) | `reportSyncError("Couldn't reset that exercise. Try again.")` | `reportSyncError("Couldn't reset that exercise. Try again.", () => clearSubstitution(originalExercise))` |
| `~568` (`deletePR`) | `reportSyncError("Couldn't delete that PR. Try again.")` | `reportSyncError("Couldn't delete that PR. Try again.", () => deletePR(id))` |

Add `retrySyncError` to the context's returned `value` object.

- [ ] **Step 4: Update the two hooks that also call `reportSyncError`**

In `src/hooks/useActiveWorkoutSession.ts`, update the 4 call sites:

```tsx
reportSyncError("Couldn't load this workout. Check your connection and try again.");
```
→ this one is inside the session-loading `useEffect`, not a re-callable named function taking the same args conveniently (it depends on `sessionId`/`userId` from closure, which are stable) — add a retry that re-runs the same effect body's `load()`. Since `load()` is a local function inside the effect, either leave this call without a retry (same reasoning as the calendar bootstrap above) or hoist `load` with `useCallback` so it can be referenced. For consistency with the "basic" scope, leave this one without a retry arg — document the exception.

```tsx
reportSyncError("That set didn't save. Check your connection and log it again.");
```
→ this is inside `logSet(exercise, weight, reps)`:
```tsx
reportSyncError("That set didn't save. Check your connection and log it again.", () => logSet(exercise, weight, reps));
```

```tsx
reportSyncError("Couldn't remove that set. Try again.");
```
→ inside `deleteSet(setId)`:
```tsx
reportSyncError("Couldn't remove that set. Try again.", () => deleteSet(setId));
```

```tsx
reportSyncError("Couldn't finish the workout. Check your connection and try again.");
```
→ inside `finishWorkout(exercisesInDay)`:
```tsx
reportSyncError("Couldn't finish the workout. Check your connection and try again.", () => finishWorkout(exercisesInDay));
```

In `src/hooks/useStartWorkout.ts`, update the one call site inside `startWorkout(day)`:

```tsx
reportSyncError("Couldn't start that workout. Check your connection and try again.", () => startWorkout(day));
```

- [ ] **Step 5: Add a Retry button to the toast**

In `src/components/layout/SyncErrorToast.tsx`:

```tsx
"use client";

import { AlertTriangle, RefreshCw, X } from "lucide-react";
import { useEffect } from "react";

import { useTrackerContext } from "@/context/TrackerContext";

const AUTO_DISMISS_MS = 6000;

export function SyncErrorToast() {
  const { syncError, syncRetry, retrySyncError, clearSyncError } = useTrackerContext();

  useEffect(() => {
    if (!syncError) return;

    const timeout = setTimeout(clearSyncError, AUTO_DISMISS_MS);
    return () => clearTimeout(timeout);
  }, [syncError, clearSyncError]);

  if (!syncError) return null;

  return (
    <div className="sync-toast" role="alert">
      <AlertTriangle size={18} />
      <span>{syncError}</span>
      {syncRetry && (
        <button type="button" className="sync-toast-retry" onClick={retrySyncError} aria-label="Retry">
          <RefreshCw size={14} /> Retry
        </button>
      )}
      <button
        type="button"
        className="sync-toast-dismiss"
        onClick={clearSyncError}
        aria-label="Dismiss"
      >
        <X size={16} />
      </button>
    </div>
  );
}
```

Add a small style for the new button in `src/styles/base.css`, right after the existing `.sync-toast-dismiss` rules:

```css
.sync-toast-retry {
  flex: 0 0 auto;
  background: transparent;
  color: var(--gold);
  border: 1px solid rgba(255, 196, 0, 0.4);
  padding: 4px 10px;
  min-height: auto;
  font-size: var(--fs-xs);
}

.sync-toast-retry:hover {
  background: rgba(255, 196, 0, 0.08);
  box-shadow: none;
}
```

- [ ] **Step 6: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 7: Manual verification via Playwright**

Create `scripts/playwright-verify/retry-on-reconnect.mjs`: sign in as `TEST_COACH_EMAIL`, use Playwright's `page.route()` to intercept and abort requests to the Supabase REST endpoint matching `**/rest/v1/exercise_checks**` (simulating offline for that one write), trigger an exercise checkbox toggle on `/library` or wherever `toggleExercise` is reachable in the UI (check which page exposes it — likely the workouts grid), assert the sync-error toast appears with a "Retry" button, then call `page.unroute()` to stop intercepting (simulating connectivity returning), dispatch a synthetic `window.dispatchEvent(new Event("online"))` via `page.evaluate()`, and assert the toast clears and the checkbox state persists (re-query the row via Supabase REST directly, or reload the page and confirm the checkbox is still checked).

Run it and confirm PASS. If reliably intercepting the right Supabase REST path proves fiddly, a simpler fallback is acceptable: verify the Retry button's presence/click behavior manually by toggling Wi-Fi/network off in a real browser session once, screenshot the toast with its Retry button, and note in the report that the automated network-interception variant was replaced with one manual real-browser check — say so plainly rather than claiming full automation.

- [ ] **Step 8: Commit**

```bash
git add src/context/TrackerContext.tsx src/components/layout/SyncErrorToast.tsx src/hooks/useActiveWorkoutSession.ts src/hooks/useStartWorkout.ts src/styles/base.css scripts/playwright-verify/retry-on-reconnect.mjs
git commit -m "feat: add basic retry-on-reconnect for failed writes

reportSyncError now optionally takes a retry closure, stored as a
single slot (not a queue) alongside the error message. A Retry button
on SyncErrorToast and a window 'online' listener both replay it. Two
call sites (the initial calendar bootstrap and the workout-session
loader) are intentionally left without a retry closure since they're
not simple re-callable functions with the same args -- documented
inline rather than force-fit."
```

---

## Task 11: `--surface-2` CSS token

**Files:**
- Modify: `src/styles/base.css`
- Modify: `src/styles/coach.css`
- Modify: `src/styles/calendar.css`
- Modify: `src/styles/landing.css`
- Modify: `src/styles/stats.css`
- Modify: `src/styles/library.css`
- Modify: `src/styles/workout-mode.css`
- Modify: `src/styles/workouts.css`

- [ ] **Step 1: Add the token**

In `src/styles/base.css`, inside `:root` (right after `--gold-2: #ffdd55;` or anywhere in the color group), add:

```css
  --surface-2: #0b0f14;
```

- [ ] **Step 2: Replace every hardcoded occurrence**

Replace `background: #0b0f14;` with `background: var(--surface-2);` at each of these exact locations:

| File | Line | Selector context |
|---|---|---|
| `src/styles/base.css` | 104 | `input, select, textarea` |
| `src/styles/coach.css` | 79 | `.team-header`-adjacent panel row |
| `src/styles/calendar.css` | 23 | `.calendar-day` |
| `src/styles/landing.css` | 218 | contact/footer-adjacent panel |
| `src/styles/stats.css` | 24 | `.chart-card` |
| `src/styles/stats.css` | 51 | `.pr-card`-adjacent row |
| `src/styles/library.css` | 14 | `.exercise-card` |
| `src/styles/library.css` | 186 | expandable exercise-card detail row |
| `src/styles/workout-mode.css` | 105 | workout session header row |
| `src/styles/workout-mode.css` | 204 | `.workout-summary-list li` |
| `src/styles/workouts.css` | 111 | `.day-notes textarea` |

- [ ] **Step 3: Verify no occurrences remain**

Run: `grep -rn "#0b0f14" src/styles/` (or the project's Grep tool)
Expected: no matches (other than the new `--surface-2: #0b0f14;` definition itself in `base.css`).

- [ ] **Step 4: Typecheck and build**

Run: `npx tsc --noEmit` (CSS changes don't affect this, but keep the habit) and `npm run build`.
Expected: both pass.

- [ ] **Step 5: Visual spot-check via Playwright**

Reuse Task 1's harness to screenshot `/library`, `/stats`, `/coach`, `/calendar`, and mid-workout (`/workout/[sessionId]`) pages as `TEST_COACH_EMAIL`, confirming no visual regression (backgrounds should look identical since the hex value is unchanged, just tokenized).

- [ ] **Step 6: Commit**

```bash
git add src/styles/base.css src/styles/coach.css src/styles/calendar.css src/styles/landing.css src/styles/stats.css src/styles/library.css src/styles/workout-mode.css src/styles/workouts.css
git commit -m "refactor: promote hardcoded #0b0f14 recessed-surface color to --surface-2 token"
```

---

## Task 12: `.rest` calendar event styling

**Files:**
- Modify: `src/styles/calendar.css`

- [ ] **Step 1: Add the missing class**

In `src/styles/calendar.css`, right after the existing `.recovery` rule:

```css
.rest {
  background: rgba(174, 182, 196, 0.14);
  color: var(--muted);
}
```

(Muted/border-only treatment, consistent with it being a "nothing scheduled" marker rather than an active training-type chip like the gold/blue/red/green ones.)

- [ ] **Step 2: Build**

Run: `npm run build`
Expected: passes (this is unreachable UI today per the design doc — `makeDefaultEvents()` never creates a `"rest"` event — so there's nothing to visually verify live; this closes the landmine for whenever it does become reachable).

- [ ] **Step 3: Commit**

```bash
git add src/styles/calendar.css
git commit -m "fix: add missing .rest calendar event styling

CalendarEvent.type includes \"rest\" but calendar.css only styled
workout/practice/game/recovery. Not currently reachable, but closes the
gap before it becomes one."
```

---

## Task 13: Rename "AI Coach" to "Recovery Coach"

**Files:**
- Modify: `src/components/stats/CoachPanel.tsx`
- Modify: `README.md`

- [ ] **Step 1: Update the component**

In `src/components/stats/CoachPanel.tsx`, change:

```tsx
        <HeartPulse size={22} /> AI Coach
```

to:

```tsx
        <HeartPulse size={22} /> Recovery Coach
```

- [ ] **Step 2: Update the README**

In `README.md`, change the bullet "AI-style recovery recommendations" to "Rule-based recovery recommendations" (matches `coachRecommendations` in `src/lib/recovery.ts` — it's `if`/threshold logic, not a model).

- [ ] **Step 3: Typecheck and build**

Run: `npx tsc --noEmit` and `npm run build`.
Expected: both pass.

- [ ] **Step 4: Commit**

```bash
git add src/components/stats/CoachPanel.tsx README.md
git commit -m "fix: rename AI Coach to Recovery Coach

coachRecommendations (src/lib/recovery.ts) is rule-based threshold
logic, not an LLM -- the old name implied AI-generated advice it wasn't."
```

---

## Task 14: Exercise category taxonomy remap

**Files:**
- Modify: `src/types/index.ts`
- Modify: `src/data/exercises.ts`
- Modify: `src/components/library/ExerciseLibrary.tsx`

**Interfaces:**
- Produces: `ExerciseCategory` is now `"Jump Development" | "Landing Mechanics" | "Knee Strength" | "Shoulder Health" | "Hitting Power" | "Rotational Core" | "Speed & Agility" | "Volleyball Conditioning" | "Mobility" | "Recovery"`. Task 15 (new catalog entries) depends on these exact string values.

- [ ] **Step 1: Update the type**

In `src/types/index.ts`, replace:

```ts
export type ExerciseCategory =
  | "Lower Body"
  | "Upper Body"
  | "Plyometrics"
  | "Core"
  | "Mobility"
  | "Rehab";
```

with:

```ts
export type ExerciseCategory =
  | "Jump Development"
  | "Landing Mechanics"
  | "Knee Strength"
  | "Shoulder Health"
  | "Hitting Power"
  | "Rotational Core"
  | "Speed & Agility"
  | "Volleyball Conditioning"
  | "Mobility"
  | "Recovery";
```

- [ ] **Step 2: Remap every exercise's `category` field in `src/data/exercises.ts`**

Update the second argument of each `ex(...)` call to the new category, per this complete mapping (72 existing exercises, grouped by their current category comment block):

**`// LOWER BODY` block → all become `"Jump Development"`:**
Trap Bar Deadlift or RDL, Bulgarian Split Squat, Hip Thrust, Heel-Elevated Goblet Squat, Front Squat, Step-Ups, Reverse Lunges, Hamstring Curls, Nordic Hamstring Curl, Calf Raises, Soleus Raises.

**`// PLYOMETRICS / SPEED` block:**
- `"Jump Development"`: Approach Jumps, Box Jumps, Broad Jumps, Pogo Hops, Drop Jumps, Jump Rope
- `"Landing Mechanics"`: Landing Mechanics Drill, Depth Drops
- `"Speed & Agility"`: Lateral Bounds, Sprint Starts
- `"Volleyball Conditioning"`: Court Sprints

**`// UPPER BODY` block:**
- `"Shoulder Health"`: Pull-Ups, Band-Assisted Pull-Up, Chin-Ups, Single-Arm Row, Bodyweight Rows, Handstand Practice
- `"Hitting Power"`: DB Bench Press, Push-Ups, Incline Push-Up, Dips, Landmine Press or DB Shoulder Press, Push Press, Pike Push-Ups

**`// CORE / ROTATION` block → all become `"Rotational Core"`:**
Pallof Press, Med Ball Rotational Throws, Cable Woodchoppers, Landmine Rotations, Hanging Leg Raises, L-Sit Practice, Dead Bugs, Side Planks, Planks, Ab Wheel Rollout, Back Extensions, Farmer Carries.

**`// KNEE / SHOULDER REHAB` block:**
- `"Knee Strength"`: Lateral Band Walks, Clamshells, Spanish Squat, Single-Leg Balance Reach, Tibialis Raises, Patrick Step, Poliquin Step-Down, Reverse Sled Drag
- `"Shoulder Health"`: Face Pulls, Band Pull-Aparts, External Rotations, Scap Push-Ups, Y-T-W Raises, Cuban Rotations, Light Shoulder Band Work

**`// MOBILITY / RECOVERY` block:**
- `"Mobility"`: Full-Body Mobility Flow, Deep Squat Holds, Couch Stretch, Shoulder CARs, Hip CARs, 90/90 Hip Switches, Ankle Rocks, Thoracic Rotations
- `"Recovery"`: Walk 20-30 minutes, Light Stretching, Foam Roll

Known imperfect fits, carried over verbatim from the approved design doc (do not "fix" these further — they're accepted calls, not open questions): Nordic Hamstring Curl defaults to Jump Development though it also has an injury-resistance angle; the entire old "Core" bucket funnels into "Rotational Core" even for non-rotational anti-extension work (Planks, Dead Bugs, etc.) since the new taxonomy has no separate general-core bucket.

Also update the section comments (`// LOWER BODY`, `// PLYOMETRICS / SPEED`, etc.) to reflect the new grouping, or remove them if the new categories make them redundant — either is fine, just don't leave comments that now describe the wrong bucket.

- [ ] **Step 3: Update the library filter list**

In `src/components/library/ExerciseLibrary.tsx`, replace:

```tsx
const filters = ["All", "Lower Body", "Upper Body", "Plyometrics", "Core", "Mobility", "Rehab"];
```

with:

```tsx
const filters = [
  "All",
  "Jump Development",
  "Landing Mechanics",
  "Knee Strength",
  "Shoulder Health",
  "Hitting Power",
  "Rotational Core",
  "Speed & Agility",
  "Volleyball Conditioning",
  "Mobility",
  "Recovery"
];
```

- [ ] **Step 4: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors (this is the step that will actually catch any exercise left with an old category string, since `Exercise["category"]` is now the new union type).

- [ ] **Step 5: Manual verification via Playwright**

Create `scripts/playwright-verify/category-remap.mjs`: sign in, navigate to `/library`, click through each of the 10 new category filter buttons, and assert `filteredExercises.length` (visible via the "`N` of `M` exercises shown" text) is greater than 0 for every category except possibly "Volleyball Conditioning" (only 1 exercise — Court Sprints — still greater than 0) and "Landing Mechanics" (2 exercises). Screenshot each filtered view.

Run it and confirm every category shows at least one exercise.

- [ ] **Step 6: Commit**

```bash
git add src/types/index.ts src/data/exercises.ts src/components/library/ExerciseLibrary.tsx
git commit -m "feat: remap exercise categories to volleyball-specific taxonomy

Replaces the 6 generic categories (Lower Body/Upper Body/Plyometrics/
Core/Mobility/Rehab) with 10 volleyball-specific ones (Jump
Development, Landing Mechanics, Knee Strength, Shoulder Health, Hitting
Power, Rotational Core, Speed & Agility, Volleyball Conditioning,
Mobility, Recovery). Data remap only -- no exercise content changed."
```

---

## Task 15: Add 8 new exercise catalog entries + reword 2 existing claims

**Files:**
- Modify: `src/data/exercises.ts`

**Interfaces:**
- Consumes: the new `ExerciseCategory` values from Task 14 — this task must run after Task 14.

- [ ] **Step 1: Reword the two overstated claims**

In `src/data/exercises.ts`, find the Lateral Band Walks entry's `purpose` string:

```ts
"Trains the hip abductors and glute medius directly -- weak hip abductors are one of the biggest modifiable risk factors for knee valgus (caving-in) collapse on landing."
```

Replace with:

```ts
"Trains the hip abductors and glute medius to help control knee position on landing -- a commonly used piece of knee-injury-risk-reduction work, though the strength-to-valgus link isn't as clear-cut as often claimed."
```

Find the Single-Leg Balance Reach entry's `purpose` string:

```ts
"Trains proprioception and single-leg stability -- ACL-prevention research consistently pairs balance training with strength training, not strength alone."
```

Replace with:

```ts
"Builds single-leg stability and proprioception -- most useful as a supporting piece of ACL-injury-risk-reduction work alongside real strength and plyometric training, not as a stand-alone fix."
```

- [ ] **Step 2: Add the 8 new entries**

Append these 8 `ex(...)` calls to the end of the `exercises` array (before the closing `];`), each already using the new taxonomy from Task 14:

```ts
  ex(
    "Lat Pulldown",
    "Shoulder Health",
    "Beginner",
    "🏋️",
    "Builds lat and pulling strength with adjustable assistance -- a scalable stepping stone toward bodyweight pull-ups.",
    ["Pull the bar to your upper chest.", "Drive elbows down and back.", "Keep torso still, don't lean back to cheat.", "Control the return."],
    ["Using body English/momentum.", "Pulling behind the neck.", "Only using arms, not lats."],
    ["Pull-Ups", "Band-Assisted Pull-Up", "Bodyweight Rows"]
  ),
  ex(
    "RDL",
    "Jump Development",
    "Intermediate",
    "🏋️",
    "Builds hip-hinge strength and hamstring loading for jumping and sprinting power, with less axial load than a full deadlift.",
    ["Push hips back first.", "Keep the weight close to your legs.", "Soft knee bend -- this is a hinge, not a squat.", "Stop when you feel a hamstring stretch, before your back rounds."],
    ["Squatting the weight down instead of hinging.", "Rounding the lower back.", "Locking the knees straight."],
    ["Trap Bar Deadlift or RDL", "Hamstring Curls", "Nordic Hamstring Curl"]
  ),
  ex(
    "Cable Row",
    "Shoulder Health",
    "Beginner",
    "🚣",
    "Builds mid-back and rear-shoulder pulling strength with continuous tension to balance out overhead hitting volume.",
    ["Chest tall -- don't lean back to pull.", "Pull the handle to your lower ribs.", "Squeeze shoulder blades together.", "Control the return, don't let the weight yank you forward."],
    ["Using the low back to heave the weight.", "Shrugging instead of pulling with the back.", "Partial range of motion."],
    ["Single-Arm Row", "Bodyweight Rows", "Lat Pulldown"]
  ),
  ex(
    "Hollow Hold",
    "Rotational Core",
    "Beginner",
    "🛶",
    "Builds anti-extension core strength and full-body tension -- the base position underneath planks, L-sits, and handstands.",
    ["Press your low back into the floor.", "Arms and legs long, ribs down.", "Squeeze glutes slightly.", "Breathe without losing the low-back position."],
    ["Lower back arching off the floor.", "Holding your breath instead of breathing through it.", "Letting the legs drop too low too soon."],
    ["Dead Bugs", "Planks", "Ab Wheel Rollout"]
  ),
  ex(
    "Swiss Ball Curl",
    "Jump Development",
    "Beginner",
    "🧵",
    "Builds hamstring strength and hip-hamstring coordination using just a stability ball -- a bodyweight, equipment-light option.",
    ["Bridge your hips up first.", "Curl heels toward glutes by pulling with the hamstrings.", "Keep hips up the whole time.", "Roll back out under control."],
    ["Hips sagging or dropping mid-set.", "Curling too fast and losing control of the ball.", "Doing partial-range curls."],
    ["Hamstring Curls", "Nordic Hamstring Curl", "RDL"]
  ),
  ex(
    "Bird Dog",
    "Rotational Core",
    "Beginner",
    "🐕",
    "Builds core and lower-back stability by training the trunk to resist rotation while opposite arm and leg move independently.",
    ["Keep your back flat -- no sagging or arching.", "Move the opposite arm and leg together, slowly.", "Reach long instead of lifting high.", "Keep hips square to the floor."],
    ["Rotating the hips as the leg lifts.", "Rushing through reps.", "Arching the lower back to fake more range."],
    ["Dead Bugs", "Planks", "Pallof Press"]
  ),
  ex(
    "Romanian Deadlift",
    "Jump Development",
    "Intermediate",
    "🏋️",
    "Builds hip-hinge strength and hamstring/glute loading for jumping and sprinting power.",
    ["Bar stays close to your shins and thighs.", "Push hips back with a soft knee bend.", "Keep a neutral spine throughout.", "Stop the descent once hamstrings feel loaded, before the back rounds."],
    ["Rounding the lower back.", "Letting the bar drift away from the body.", "Turning it into a squat."],
    ["RDL", "Trap Bar Deadlift or RDL", "Hip Thrust"]
  ),
  ex(
    "Glute Bridge",
    "Jump Development",
    "Beginner",
    "🍑",
    "Builds basic glute activation and the hip-extension pattern -- the entry point before loading a full hip thrust.",
    ["Feet hip-width, heels close to glutes.", "Drive through your heels.", "Squeeze glutes hard at the top.", "Lower with control instead of dropping."],
    ["Overarching the lower back at the top.", "Pushing through the toes instead of the heels.", "Rushing reps instead of pausing at the top."],
    ["Hip Thrust", "Single-Leg Hip Thrust", "Cable Pull-Through"]
  )
```

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Manual verification via Playwright**

Create `scripts/playwright-verify/new-catalog-entries.mjs`: sign in, go to `/library`, search for each of the 8 new names ("Lat Pulldown", "RDL", "Cable Row", "Hollow Hold", "Swiss Ball Curl", "Bird Dog", "Romanian Deadlift", "Glute Bridge") via the search box, and assert each returns exactly one result. Then verify the substitution picker actually surfaces one of them: navigate to a workout day containing "Pull-Ups" (check `src/data/workoutPlan.ts` for a week/day that includes it), open its substitution picker, and assert "Lat Pulldown" now appears as a curated option rather than a same-category fallback (check whichever component renders the substitution picker — likely inside `ExerciseCard.tsx` or a dedicated substitution UI referenced by `useExerciseSubstitutions`).

Run it and confirm all 8 names resolve and at least one curated substitution surfaces correctly.

- [ ] **Step 5: Commit**

```bash
git add src/data/exercises.ts
git commit -m "feat: add 8 missing exercise catalog entries, reword 2 overstated claims

Adds Lat Pulldown, RDL, Cable Row, Hollow Hold, Swiss Ball Curl, Bird
Dog, Romanian Deadlift, and Glute Bridge -- the most-referenced
substitution names with no catalog entry, confirmed by grepping every
substitutions array for reference counts. Also softens two purpose-field
claims (Lateral Band Walks, Single-Leg Balance Reach) whose
strength-to-injury-prevention framing overstated a more contested
literature, per an evidence-based sourcing pass (see
docs/superpowers/specs/2026-07-18-exercise-catalog-research.md)."
```

---

## Task 16: Performance profile schema

**Files:**
- Create: `supabase/schema_v24_performance_profiles.sql`

**Interfaces:**
- Produces: `public.performance_profiles` table, consumed by Tasks 17-18.

- [ ] **Step 1: Write the migration**

Create `supabase/schema_v24_performance_profiles.sql`:

```sql
-- Volleyball Tracker V24 schema (athlete performance profile)
-- Run this once in the Supabase SQL Editor, after schema_v20_teams.sql.
-- Safe to re-run.

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

alter table public.performance_profiles enable row level security;

drop policy if exists "own performance profile" on public.performance_profiles;
create policy "own performance profile" on public.performance_profiles
  for select using (auth.uid() = user_id);

drop policy if exists "own performance profile insert" on public.performance_profiles;
create policy "own performance profile insert" on public.performance_profiles
  for insert with check (auth.uid() = user_id);

drop policy if exists "own performance profile update" on public.performance_profiles;
create policy "own performance profile update" on public.performance_profiles
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Coaches can view (read-only) their roster's performance profiles,
-- reusing the is_caller_coach_of() helper from schema_v20_teams.sql --
-- same pattern as schema_v22_profiles.sql's roster-visibility policy.
drop policy if exists "coach can view roster performance profiles" on public.performance_profiles;
create policy "coach can view roster performance profiles" on public.performance_profiles
  for select using (public.is_caller_coach_of(user_id));
```

- [ ] **Step 2: Ask the user to apply the migration**

Tell the user: "Please run `supabase/schema_v24_performance_profiles.sql` once in your Supabase project's SQL Editor before I continue to Task 17."

- [ ] **Step 3: Commit**

```bash
git add supabase/schema_v24_performance_profiles.sql
git commit -m "feat: add performance_profiles table

position, height, standing reach, approach touch, block touch, body
weight, plus a generated approach_vertical_in column
(approach_touch_in - standing_reach_in). RLS matches the existing
profiles table pattern: own-row read/write, coach read-only via
is_caller_coach_of()."
```

---

## Task 17: Performance profile — athlete UI

**Files:**
- Create: `src/hooks/usePerformanceProfile.ts`
- Create: `src/components/stats/PerformanceProfileForm.tsx`
- Modify: `src/app/(app)/stats/page.tsx`

**Interfaces:**
- Consumes: `performance_profiles` table from Task 16.
- Produces: `usePerformanceProfile()` returning `{ loading, profile, setProfile, saveProfile, error }`, consumed by Task 18's roster column indirectly (via the same table, through `useCoachRoster`, not this hook directly).

- [ ] **Step 1: Create the hook**

Create `src/hooks/usePerformanceProfile.ts`:

```tsx
"use client";

import { useEffect, useMemo, useState } from "react";

import { useTrackerContext } from "@/context/TrackerContext";
import { createClient } from "@/lib/supabase/client";

export type PerformanceProfile = {
  position: string | null;
  height_in: number | null;
  standing_reach_in: number | null;
  approach_touch_in: number | null;
  block_touch_in: number | null;
  body_weight_lbs: number | null;
  approach_vertical_in: number | null;
};

const emptyProfile: PerformanceProfile = {
  position: null,
  height_in: null,
  standing_reach_in: null,
  approach_touch_in: null,
  block_touch_in: null,
  body_weight_lbs: null,
  approach_vertical_in: null
};

export function usePerformanceProfile() {
  const { userId, reportSyncError } = useTrackerContext();
  const supabase = useMemo(() => createClient(), []);

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<PerformanceProfile>(emptyProfile);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    supabase
      .from("performance_profiles")
      .select("position, height_in, standing_reach_in, approach_touch_in, block_touch_in, body_weight_lbs, approach_vertical_in")
      .eq("user_id", userId)
      .maybeSingle()
      .then(({ data, error: loadError }) => {
        if (cancelled) return;
        if (loadError) {
          console.error("Failed to load performance profile", loadError);
          setError("Couldn't load your profile. Try again.");
        } else if (data) {
          setProfile(data as PerformanceProfile);
        }
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [supabase, userId]);

  async function saveProfile() {
    setError(null);

    const { position, height_in, standing_reach_in, approach_touch_in, block_touch_in, body_weight_lbs } = profile;

    const { error: saveError } = await supabase
      .from("performance_profiles")
      .upsert(
        {
          user_id: userId,
          position,
          height_in,
          standing_reach_in,
          approach_touch_in,
          block_touch_in,
          body_weight_lbs,
          updated_at: new Date().toISOString()
        },
        { onConflict: "user_id" }
      );

    if (saveError) {
      console.error("Failed to save performance profile", saveError);
      reportSyncError("Couldn't save your profile. Check your connection and try again.", () => saveProfile());
      return false;
    }

    return true;
  }

  return { loading, profile, setProfile, saveProfile, error };
}
```

- [ ] **Step 2: Create the form component**

Create `src/components/stats/PerformanceProfileForm.tsx`:

```tsx
"use client";

import { Ruler } from "lucide-react";

import { usePerformanceProfile } from "@/hooks/usePerformanceProfile";

const POSITIONS = ["Outside Hitter", "Middle Blocker", "Opposite", "Setter", "Libero", "Defensive Specialist"];

function numOrNull(value: string) {
  return value === "" ? null : Number(value);
}

export function PerformanceProfileForm() {
  const { loading, profile, setProfile, saveProfile } = usePerformanceProfile();

  if (loading) {
    return (
      <div className="panel">
        <p className="muted">Loading your profile...</p>
      </div>
    );
  }

  const approachVertical =
    profile.approach_touch_in != null && profile.standing_reach_in != null
      ? profile.approach_touch_in - profile.standing_reach_in
      : null;

  return (
    <div className="panel">
      <h2>
        <Ruler size={22} /> Performance Profile
      </h2>

      <div className="stats-grid">
        <label>
          Position
          <select
            value={profile.position ?? ""}
            onChange={(e) => setProfile((current) => ({ ...current, position: e.target.value || null }))}
          >
            <option value="">Select...</option>
            {POSITIONS.map((position) => (
              <option key={position} value={position}>
                {position}
              </option>
            ))}
          </select>
        </label>

        <label>
          Height (in)
          <input
            type="number"
            value={profile.height_in ?? ""}
            onChange={(e) => setProfile((current) => ({ ...current, height_in: numOrNull(e.target.value) }))}
          />
        </label>

        <label>
          Standing Reach (in)
          <input
            type="number"
            value={profile.standing_reach_in ?? ""}
            onChange={(e) =>
              setProfile((current) => ({ ...current, standing_reach_in: numOrNull(e.target.value) }))
            }
          />
        </label>

        <label>
          Approach Touch (in)
          <input
            type="number"
            value={profile.approach_touch_in ?? ""}
            onChange={(e) =>
              setProfile((current) => ({ ...current, approach_touch_in: numOrNull(e.target.value) }))
            }
          />
        </label>

        <label>
          Block Touch (in)
          <input
            type="number"
            value={profile.block_touch_in ?? ""}
            onChange={(e) => setProfile((current) => ({ ...current, block_touch_in: numOrNull(e.target.value) }))}
          />
        </label>

        <label>
          Body Weight (lbs)
          <input
            type="number"
            value={profile.body_weight_lbs ?? ""}
            onChange={(e) =>
              setProfile((current) => ({ ...current, body_weight_lbs: numOrNull(e.target.value) }))
            }
          />
        </label>
      </div>

      {approachVertical != null && (
        <p className="muted">Approach vertical: {approachVertical.toFixed(1)}"</p>
      )}

      <div className="button-row">
        <button onClick={saveProfile}>Save Profile</button>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Add it to the stats page**

In `src/app/(app)/stats/page.tsx`, add the import and render it in its own section:

```tsx
import { PerformanceProfileForm } from "@/components/stats/PerformanceProfileForm";
```

```tsx
      <section className="lower-grid" style={{ marginTop: 24 }}>
        <PRTracker />
        <CoachPanel />
      </section>

      <section style={{ marginTop: 24 }}>
        <PerformanceProfileForm />
      </section>
```

- [ ] **Step 4: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 5: Manual verification via Playwright**

Confirm Task 16's migration is applied. Create `scripts/playwright-verify/performance-profile.mjs`: sign in as `TEST_ATHLETE_EMAIL`, go to `/stats`, fill in Position ("Outside Hitter"), Standing Reach (95), Approach Touch (110), click "Save Profile", reload the page, and assert the same values are still populated and "Approach vertical: 15.0"" is displayed.

Run it and confirm PASS.

- [ ] **Step 6: Commit**

```bash
git add src/hooks/usePerformanceProfile.ts src/components/stats/PerformanceProfileForm.tsx src/app/\(app\)/stats/page.tsx
git commit -m "feat: add athlete-editable performance profile

Position, height, standing reach, approach touch, block touch, body
weight, with approach vertical auto-calculated and displayed."
```

---

## Task 18: Performance profile — coach roster column

**Files:**
- Modify: `src/hooks/useCoachRoster.ts`
- Modify: `src/components/coach/CoachDashboard.tsx`
- Modify: `src/types/index.ts`

**Interfaces:**
- Consumes: `performance_profiles` table from Task 16.

- [ ] **Step 1: Extend `RosterAthlete`**

In `src/types/index.ts`, add two optional fields to `RosterAthlete`:

```ts
export type RosterAthlete = {
  userId: string;
  displayName: string;
  joinedAt: string;
  recovery: number;
  recoveryLabel: string;
  lastCheckIn: string | null;
  needsCheckIn: boolean;
  lastActiveAt: string | null;
  position: string | null;
  approachVerticalIn: number | null;
};
```

- [ ] **Step 2: Fetch profile data in `useCoachRoster`**

In `src/hooks/useCoachRoster.ts`, add a third parallel query alongside `latest_stats` and `profiles`:

```tsx
    const [{ data: statsRows, error: statsError }, { data: profileRows, error: profilesError }, { data: perfRows, error: perfError }] =
      await Promise.all([
        supabase.from("latest_stats").select("*").in("user_id", athleteIds),
        supabase.from("profiles").select("user_id, last_active_at").in("user_id", athleteIds),
        supabase
          .from("performance_profiles")
          .select("user_id, position, approach_vertical_in")
          .in("user_id", athleteIds)
      ]);
```

Add error logging for `perfError` (non-fatal, same treatment as `profilesError`):

```tsx
    if (perfError) {
      console.error("Failed to load roster performance profiles", perfError);
    }
```

Add a lookup map and populate the two new `RosterAthlete` fields:

```tsx
    const perfByUser = new Map<string, { position: string | null; approach_vertical_in: number | null }>(
      (perfRows ?? []).map((row) => [row.user_id as string, row])
    );
```

In the `nextRoster` mapping, add:

```tsx
        position: perfByUser.get(member.user_id)?.position ?? null,
        approachVerticalIn: perfByUser.get(member.user_id)?.approach_vertical_in ?? null
```

- [ ] **Step 3: Add an optional column to the roster table UI**

In `src/components/coach/CoachDashboard.tsx`, inside the `roster-row` mapping, add a column showing position + approach vertical when present:

```tsx
{(athlete.position || athlete.approachVerticalIn != null) && (
  <span className="muted roster-position">
    {athlete.position ?? "-"}
    {athlete.approachVerticalIn != null ? ` · ${athlete.approachVerticalIn.toFixed(1)}" approach` : ""}
  </span>
)}
```

Place it inside the existing `.roster-athlete-name` div, after the `roster-last-active` span, so it doesn't require new grid columns in `coach.css` (check `coach.css`'s `.roster-row`/`.roster-athlete-name` layout first — if it's a flex column, an additional `<span>` just stacks; if it's a fixed-column grid, add a `.roster-position` rule mirroring `.roster-last-active`'s existing style).

- [ ] **Step 4: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 5: Manual verification via Playwright**

Reuse the profile filled in during Task 17 (via `TEST_ATHLETE_EMAIL`, who should already be on `TEST_COACH_EMAIL`'s team from Task 8's verification). Create `scripts/playwright-verify/roster-performance-column.mjs`: sign in as `TEST_COACH_EMAIL`, go to `/coach`, and assert the roster row for the athlete's display name contains "Outside Hitter" and "15.0" approach".

Run it and confirm PASS.

- [ ] **Step 6: Commit**

```bash
git add src/hooks/useCoachRoster.ts src/components/coach/CoachDashboard.tsx src/types/index.ts
git commit -m "feat: surface position and approach vertical on coach roster view"
```

---

## Task 19: ElevateOS rebrand

**Files:**
- Modify: `src/app/layout.tsx`
- Modify: `src/components/landing/LandingHeader.tsx`
- Modify: `src/app/login/page.tsx`
- Modify: `src/app/page.tsx`
- Modify: `README.md`

- [ ] **Step 1: Update page metadata**

In `src/app/layout.tsx`:

```tsx
export const metadata: Metadata = {
  title: "ElevateOS",
  description: "ElevateOS — the athlete training and recovery operating system for volleyball teams"
};
```

- [ ] **Step 2: Update the landing header**

In `src/components/landing/LandingHeader.tsx`:

```tsx
            <h2>ELEVATEOS</h2>
            <p>ATHLETE OPERATING SYSTEM</p>
```

- [ ] **Step 3: Update the login page subtitle**

In `src/app/login/page.tsx`:

```tsx
        <p className="muted">ElevateOS — Athlete Operating System</p>
```

- [ ] **Step 4: Update the landing page footer**

In `src/app/page.tsx`:

```tsx
        <p className="muted">🏐 ElevateOS</p>
```

- [ ] **Step 4b: Replace the contact email with a placeholder**

In `src/app/page.tsx`, replace the live Gmail mailto with a fake placeholder
(does not receive mail until a real domain exists):

```tsx
        <a href="mailto:hello@elevateos.com">
          <button type="button">Email hello@elevateos.com</button>
        </a>
```

- [ ] **Step 5: Update the README**

In `README.md`, change the title `# Volleyball Tracker` to `# ElevateOS` and update the first line's description to mention the new name while keeping the factual content (e.g. "ElevateOS is a Next.js and TypeScript athlete training-and-recovery operating system built for volleyball teams."). Leave the rest of the feature list/setup instructions as-is except where they reference the old schema file list — Tasks 6 and 16 added `schema_v23_team_management.sql` and `schema_v24_performance_profiles.sql`, so update the `Setup` section's numbered SQL-file list to include both, in order:

```
3. Run `supabase/schema.sql`, then `schema_v18_5.sql`, then `schema_v19.sql`, then `schema_v20_teams.sql`, then `schema_v21_substitutions.sql`, then `schema_v22_profiles.sql`, then `schema_v23_team_management.sql`, then `schema_v24_performance_profiles.sql`, once each in your project's SQL Editor to create the tables, row-level security policies, and constraints.
```

- [ ] **Step 6: Grep for any remaining old-name references**

Run: `grep -rln "Volleyball Tracker" src/ README.md`
Expected: no matches (or only ones intentionally left, e.g. if any code comment references the old project name for historical/schema-file-header reasons — check `supabase/schema*.sql` file headers like `-- Volleyball Tracker V20 schema...`; leave those alone, they're historical migration file headers, not user-facing branding, and rewriting them isn't necessary for this pass).

- [ ] **Step 7: Typecheck and build**

Run: `npx tsc --noEmit` and `npm run build`.
Expected: both pass.

- [ ] **Step 8: Visual verification via Playwright**

Screenshot `/`, `/login`, and a signed-in `/dashboard` page, confirming "ElevateOS" appears in each and no "Volleyball Tracker" text remains visible.

- [ ] **Step 9: Commit**

```bash
git add src/app/layout.tsx src/components/landing/LandingHeader.tsx src/app/login/page.tsx src/app/page.tsx README.md
git commit -m "feat: rebrand to ElevateOS"
```

---

## Task 20: Landing page visual refresh

**Files:**
- Modify: `src/app/page.tsx`
- Modify: `src/styles/landing.css`

- [ ] **Step 1: Add stat callout tiles**

In `src/app/page.tsx`, add a new data array near the top (after `STEPS`):

```tsx
const STAT_CALLOUTS = [
  { value: "20", label: "Week Program" },
  { value: "4", label: "Training Phases" },
  { value: "10", label: "Exercise Categories" },
  { value: "80+", label: "Curated Exercises" }
];
```

Add a new section right after the hero section:

```tsx
      <section className="landing-section landing-stats">
        <div className="landing-section-inner landing-stat-row">
          {STAT_CALLOUTS.map((stat) => (
            <div className="landing-stat" key={stat.label}>
              <strong>{stat.value}</strong>
              <span className="muted">{stat.label}</span>
            </div>
          ))}
        </div>
      </section>
```

- [ ] **Step 2: Add a connector visual between "How it works" steps**

In the existing `landing-steps` section, wrap the `.landing-step` items so a connector can render between them via CSS (no extra markup needed if using a `::after` pseudo-element on `.landing-step:not(:last-child)`). In `src/styles/landing.css`, find the `.landing-step` rule and add:

```css
.landing-step {
  position: relative;
}

.landing-step:not(:last-child)::after {
  content: "";
  position: absolute;
  top: 20px;
  right: -12%;
  width: 24%;
  height: 2px;
  background: linear-gradient(90deg, rgba(255, 196, 0, 0.5), rgba(255, 196, 0, 0.05));
}

@media (max-width: 800px) {
  .landing-step:not(:last-child)::after {
    display: none;
  }
}
```

(Check `.landing-steps`'s existing `display`/`grid-template-columns` in `landing.css` first — this connector assumes a horizontal 3-column layout on desktop; if it's already a vertical stack on all breakpoints, adjust the `::after` positioning to a vertical line instead, or skip the connector and rely on the numbered `.landing-step-number` badges already present, which is an acceptable simpler fallback if the horizontal-connector math doesn't line up cleanly with the existing grid.)

- [ ] **Step 3: Trim the philosophy paragraph into labeled points**

In `src/app/page.tsx`, replace the single dense `<p>` inside `.landing-philosophy` with a short intro sentence plus 3 labeled points, keeping the same claims:

```tsx
            <p className="muted">
              Not a generic template -- built on phase-based periodization and volleyball&apos;s
              actual injury patterns.
            </p>

            <div className="landing-philosophy-points">
              <div>
                <strong>Phase-based periodization</strong>
                <p className="muted">
                  Foundation, build, power, and taper phases shift volume and intensity across
                  the season instead of running the same workout on repeat for months.
                </p>
              </div>
              <div>
                <strong>Volleyball-specific injury targeting</strong>
                <p className="muted">
                  Shoulder-health work for hitters logging thousands of overhead swings, and
                  landing-mechanics and hip-stability training aimed at reducing ACL-injury risk
                  on landings and cuts.
                </p>
              </div>
              <div>
                <strong>Built like a real strength program</strong>
                <p className="muted">
                  The kind of programming a strength coach would build for a volleyball team
                  specifically, not a fitness app&apos;s workout of the day.
                </p>
              </div>
            </div>
```

Add a simple 3-column grid style in `landing.css` for `.landing-philosophy-points`:

```css
.landing-philosophy-points {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--sp-5);
  margin-top: var(--sp-5);
}

.landing-philosophy-points strong {
  display: block;
  color: var(--gold);
  margin-bottom: var(--sp-2);
}

@media (max-width: 800px) {
  .landing-philosophy-points {
    grid-template-columns: 1fr;
  }
}
```

- [ ] **Step 4: Add a stat-row style**

In `landing.css`:

```css
.landing-stat-row {
  display: flex;
  justify-content: space-around;
  flex-wrap: wrap;
  gap: var(--sp-6);
  text-align: center;
}

.landing-stat strong {
  display: block;
  font-size: var(--fs-display);
  color: var(--gold);
}

@media (max-width: 800px) {
  .landing-stat-row {
    gap: var(--sp-4);
  }
}
```

- [ ] **Step 5: Typecheck and build**

Run: `npx tsc --noEmit` and `npm run build`.
Expected: both pass.

- [ ] **Step 6: Visual verification via Playwright**

Screenshot the full landing page (`page.screenshot({ path: "...", fullPage: true })`) at both a desktop viewport (1440x900) and a mobile viewport (390x844), confirming the stat row, step connectors (desktop only), and philosophy points all render without overlap or overflow.

- [ ] **Step 7: Commit**

```bash
git add src/app/page.tsx src/styles/landing.css
git commit -m "feat: make landing page more visual, less text-heavy

Adds stat callout tiles, a step-connector visual for How it works, and
breaks the single dense philosophy paragraph into 3 labeled points --
same claims, restructured for scanability."
```

---

## Task 21: Color/contrast and cohesion pass

**Files:**
- Modify: `src/styles/base.css`
- Modify: `src/styles/dashboard.css`
- Modify: `src/styles/coach.css`
- Modify: `src/styles/landing.css`

**Context for whoever implements this task:** computed WCAG contrast ratios (relative luminance formula) for this palette's actual text/background pairs are already strong and do not need fixing: `--muted` (#aeb6c4) on `--panel` (#101419) is ~9:1, on `--surface-2`/#0b0f14 is ~9.4:1; `--text` (#f4f6f8) on `--panel` is ~17:1; `--gold` (#ffc400) on `--panel` is ~11.6:1. All comfortably exceed the WCAG AA 4.5:1 threshold. **Do not spend this task hunting for contrast failures that computed math already rules out.** The real work here is (a) gold-accent overuse and (b) visual cohesion between `dashboard.css` (older screen) and `landing.css`/`coach.css` (newer screens).

- [ ] **Step 1: Audit gold usage**

Run: `grep -c "gold" src/styles/*.css` for each file to see relative density. In `base.css`, gold is currently used for: default button background, `.ghost` text/border, focus-visible outlines, `.progress-fill`, `.empty-state` border/background tint, `.exercise-name-button`. Read through `dashboard.css`, `coach.css`, and `landing.css` and note every additional gold usage. Judgment call (apply directly, don't just list it): reserve solid/filled gold strictly for primary actions (submit buttons, primary CTAs) and progress indicators; where gold is currently used as a decorative border/tint on non-interactive elements that aren't the primary action on their screen (e.g. if `.empty-state`'s gold-tinted border appears on every empty list across the app, which risks flattening its meaning), consider swapping non-interactive decorative gold accents to `var(--border)` or a neutral `rgba(255,255,255,0.08)` tint, keeping gold reserved for things the user can act on. Do not change the default `button` background (that's correctly the primary-action treatment) or focus rings (accessibility-relevant, gold is fine there).

- [ ] **Step 2: Reconcile spacing/component patterns**

Compare `dashboard.css` (the oldest per-page stylesheet) against `landing.css`/`coach.css` (newest) for: border-radius consistency (should all reference `--radius-sm/md/lg` tokens, not hardcoded px), spacing consistency (should reference `--sp-*` tokens), and shadow consistency (should reference `--shadow-md`). Grep for hardcoded px values and hex colors in `dashboard.css` that aren't in the newer files' equivalents, and replace with the matching token where a direct equivalent exists. Do not restructure `dashboard.css`'s layout/markup — token substitution only, to bring it visually in line with newer screens without a redesign.

- [ ] **Step 3: Typecheck and build**

Run: `npx tsc --noEmit` and `npm run build`.
Expected: both pass (pure CSS changes, but keep the habit).

- [ ] **Step 4: Visual verification via Playwright**

Screenshot `/dashboard`, `/coach`, and `/` before-and-after (keep the Task 1-era screenshots if still around, or take fresh "before" shots at the start of this task before editing). Confirm nothing regresses (no invisible text, no broken layout) and that the dashboard reads more visually consistent with the landing/coach pages afterward.

- [ ] **Step 5: Commit**

```bash
git add src/styles/base.css src/styles/dashboard.css src/styles/coach.css src/styles/landing.css
git commit -m "style: reduce gold-accent overuse, reconcile dashboard.css tokens with newer stylesheets

Contrast was already solid (--muted on --panel/--surface-2 computes to
~9:1+, well above WCAG AA) so this pass focuses on gold being reserved
for primary actions rather than decorative use everywhere, and bringing
the older dashboard stylesheet's hardcoded spacing/radius/shadow values
in line with the --sp-*/--radius-*/--shadow-md tokens already used
consistently in landing.css and coach.css."
```

---

## Task 22: SUGGESTIONS.md update

**Files:**
- Modify: `SUGGESTIONS.md`

- [ ] **Step 1: Prune resolved sections**

Remove (or mark resolved, whichever reads more cleanly — removing is fine since git history preserves the old content) the bullet points in the existing `SUGGESTIONS.md` that this pass has now addressed: the entire "Auth" section (both bullets), "Team layer" section (all three bullets), the `.rest` calendar CSS bullet under "Data / content" (keep the substitution-hints bullet's general framing but note the 8 additions from Task 15 are now in the catalog), the "No automatic retry" bullet under "Reliability" (keep the "no pagination" bullet, still unaddressed), the entire "CSS / design system" section, and the "AI Coach" bullet under "Naming".

- [ ] **Step 2: Add the contact-email placeholder note**

Add a new short section:

```markdown
## Branding

- **Contact email is a fake placeholder.** `hello@elevateos.com` is shown on
  the landing page but does not receive mail — a real domain email needs to
  be set up and swapped in before relying on this for actual outreach.
```

- [ ] **Step 3: Add the deferred-features backlog**

Add a new section listing every explicitly out-of-scope item from this pass, one line + rationale each:

```markdown
## Bigger features considered, deferred

- **Program builder** — letting a coach author their own multi-week program
  instead of the fixed 20-week plan. Real demand once a team wants something
  other than the built-in periodization, but it's a large authoring UI + data
  model on its own.
- **Team calendar** — a shared, coach-visible team calendar (practices, games)
  layered on top of each athlete's individual calendar. Valuable but needs a
  team-scoped events table and conflict-handling design of its own.
- **In-app messaging** — coach-to-athlete or team-wide messaging. High value
  for adoption but a large scope addition (delivery, notifications, moderation)
  relative to this app's current single-purpose focus.
- **Tournament mode** — a tournament-specific view (bracket, multi-day
  scheduling). Narrow use case relative to season-long training tracking.
- **Jump-load tracker** — cumulative jump-count/landing-load monitoring across
  a season, the kind of thing that feeds into overuse-injury prevention. Real
  sports-science value, but needs its own data model (per-session jump counts)
  that doesn't exist yet.
- **Testing combine** — a structured periodic testing day (vertical, agility,
  etc.) with historical comparison. Overlaps partly with the new performance
  profile and stats history, but a true combine flow is its own feature.
- **Position-specific scorecards** — scouting/evaluation scorecards by
  position. More of a coaching/recruiting tool than a training tracker; needs
  its own rubric design.
- **Weekly automated reports** — auto-generated weekly summaries (emailed or
  in-app) for coaches. Useful but needs a scheduling/notification
  infrastructure this app doesn't have yet.
- **Recruiting-profile export** — a shareable PDF/link version of an athlete's
  stats + performance profile for college recruiting. Clear value for
  athletes, but a distinct export/formatting feature on its own.
- **Smart pain-based workout auto-adjustment** — automatically swapping or
  scaling exercises based on logged knee/shoulder pain. High-value but
  higher-risk (auto-modifying a training plan based on self-reported pain
  data deserves its own careful design pass, not a quick addition).
- **Full daily-dashboard home-screen redesign** — rethinking the athlete's
  landing screen inside the app (today it's the existing `dashboard.css`
  screen, touched only for token consistency in this pass, Task 21). A full
  redesign is a bigger, separate design project.
```

- [ ] **Step 2: Build**

Run: `npm run build`
Expected: passes (Markdown file, no build impact — just confirming nothing else broke in the same commit).

- [ ] **Step 3: Commit**

```bash
git add SUGGESTIONS.md
git commit -m "docs: update SUGGESTIONS.md -- prune resolved items, add contact-email note and deferred-features backlog"
```

---

## Task 23: Final full verification pass

**Files:** none (verification only)

- [ ] **Step 1: Full typecheck and build**

Run: `npx tsc --noEmit`
Expected: no errors.
Run: `npm run build`
Expected: succeeds cleanly.

- [ ] **Step 2: Full Playwright walkthrough**

Reusing the Task 1 harness and accounts, write and run `scripts/playwright-verify/full-walkthrough.mjs` covering, in one script, the golden path end to end: sign in as `TEST_COACH_EMAIL` → view roster (with the new performance-profile column) → regenerate invite code → start and finish a workout (using the themed confirm modal, and skipping a rest timer along the way) → sign in as `TEST_ATHLETE_EMAIL` in a second context → fill out performance profile → view/search the exercise library across a couple of the new categories → confirm no console errors on any page visited (`page.on("console", msg => { if (msg.type() === "error") ... })`).

Run it and confirm every step passes with no console errors.

- [ ] **Step 3: Grep-based regression checks**

Run: `grep -rn "window.confirm" src/` — expected: no matches (both replaced in Tasks 3-4).
Run: `grep -rn "#0b0f14" src/styles/` — expected: only the `--surface-2` definition itself.
Run: `grep -rln "Volleyball Tracker" src/ README.md` — expected: no matches.
Run: `grep -rn "AI Coach" src/` — expected: no matches.

- [ ] **Step 4: Report cleanup limitations to the user**

Tell the user: two throwaway test accounts (`elevateos.verify.coach@gmail.com`, `elevateos.verify.athlete@gmail.com`) and their associated team/workout/profile data now exist in the real Supabase project — full deletion of the `auth.users` rows requires either a service-role key (not available in this environment) or manually removing them from the Supabase dashboard's Authentication > Users panel. Ask if they'd like those left in place (harmless test data) or want to remove them, and offer to delete whatever the RLS-permitted anon-key session can reach (e.g. disbanding the test team, clearing test workout sessions) if they'd rather not leave any residue.

Also ask whether to keep `@playwright/test` as a dev dependency (useful for any future manual verification) or remove it (`npm uninstall @playwright/test`) now that this pass is done — recommend keeping it since a `run`/verify project skill could be generated from this harness later (the `run` skill's own guidance suggested this).

- [ ] **Step 5: Final commit (if any cleanup changes were made)**

```bash
git add -A
git commit -m "chore: final verification pass for ElevateOS refresh"
```

(Skip this commit if Step 4's cleanup produced no file changes — don't create an empty commit.)
