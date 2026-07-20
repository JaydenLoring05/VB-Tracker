# Pre-Launch Pass Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the pre-launch punch list for ElevateOS's first real pilot team: fix the three known bugs (dead contact email, missing "removed from team" notice, exercise-substitution gaps), add launch-essential trust/legal pages, replace ambiguous pricing/testimonial/founder copy, and extend `SUGGESTIONS.md` with everything from the product review that is explicitly out of scope for this pass.

**Architecture:** No new subsystems. This is a copy pass plus one small real feature (athlete removal notice), implemented the same way every other feature in this repo is: a Supabase migration file for schema changes, a React hook for data access, plain components for UI, and a `scripts/playwright-verify/*.mjs` script exercising the live flow in a browser. No test framework exists in this repo (no jest/vitest) — verification is done live via Playwright scripts, matching the existing `scripts/playwright-verify/` convention, not unit-test TDD.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript, Supabase (Postgres + RLS), Playwright for live verification.

## Global Constraints

- Contact email for all landing/legal/pilot copy: `jaydenloring05@gmail.com` (user-confirmed; `hello@elevateos.com` is dead — that domain isn't owned).
- Google sign-in stays OUT of this pass (user-confirmed). Add a `SUGGESTIONS.md` note that it was deliberately deferred, not forgotten.
- Do not build anything from the "Launch-essential additions... product review" backlog list in Task 9's source list beyond what's explicitly required — those become `SUGGESTIONS.md` entries only.
- Plain-language legal copy only — no attempt at exhaustive legal coverage, per explicit user instruction ("I'm not a lawyer and neither are you").
- Every task must end with a live-verified deliverable (dev server + Playwright or manual browser check), not just `tsc`/`build` passing.
- New pricing copy (verbatim): "Your first 90-day pilot is free, no card required. Afterward, plans start at $29/month for teams up to 16 athletes, $49/month for 17+, paused automatically during the off-season."
- New founder bio copy (verbatim): "I'm Jayden Loring, a collegiate volleyball player, former team captain, and Computer Science student. I built this because I lived the problem — training plans, soreness updates, and player progress scattered across group chats, notebooks, and memory. This is the system I wish my own teams had."
- New headline (verbatim): "Know who's ready. Know who needs attention." with supporting text "Helps volleyball coaches monitor training, recovery, soreness, and athlete progress from one team dashboard."

---

## File Structure

**Create:**
- `supabase/schema_v25_removal_notices.sql` — removal-notice table, trigger, RLS
- `src/lib/contact.ts` — single source of truth for the contact email
- `src/app/privacy/page.tsx` — Privacy Policy page
- `src/app/terms/page.tsx` — Terms of Service page
- `src/styles/legal.css` — shared readable-prose styling for the two legal pages
- `scripts/playwright-verify/prelaunch-copy-legal.mjs` — verifies headline/pricing/pilot/footer/legal-page copy live
- `scripts/playwright-verify/prelaunch-core-flow.mjs` — verifies signup → team → join → workout → roster → removal-notice → back button, live

**Modify:**
- `src/hooks/useTeam.ts` — fetch + surface a one-shot removal notice when the caller isn't on a team
- `src/components/coach/TeamSetup.tsx` — render the removal-notice banner
- `src/app/(app)/coach/page.tsx` — pass the notice through
- `src/app/page.tsx` — headline, founder bio, testimonials→pilot section, contact email, footer links
- `src/components/landing/PricingSection.tsx` — new unambiguous pricing copy
- `src/app/login/page.tsx` — back-to-landing link, ToS/Privacy links + health disclaimer on sign-up
- `src/styles/landing.css` — hero subhead, footer links, pilot section styles
- `src/styles/auth.css` — back-link and legal-text styles
- `src/styles/coach.css` — removal-notice banner styling (reuses `.empty-state`)
- `src/data/exercises.ts` — 10 new catalog entries
- `SUGGESTIONS.md` — remove/update resolved items, add backlog entries from the product review

---

## Task 1: Removal-notice database layer

**Files:**
- Create: `supabase/schema_v25_removal_notices.sql`

**Interfaces:**
- Produces: table `public.removal_notices(id, user_id, team_name, removed_at)`, readable/deletable only by its own `user_id` via RLS. Populated automatically by an `AFTER DELETE` trigger on `public.team_members` whenever a coach (not the athlete themselves) removes an athlete row.

- [ ] **Step 1: Write the migration**

```sql
-- Volleyball Tracker V25 schema (athlete removal notices)
-- Run this once in the Supabase SQL Editor, after schema_v24_performance_profiles.sql.
-- Safe to re-run.

create table if not exists public.removal_notices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  team_name text not null,
  removed_at timestamptz not null default now()
);

alter table public.removal_notices enable row level security;

drop policy if exists "own removal notices select" on public.removal_notices;
create policy "own removal notices select" on public.removal_notices
  for select using (auth.uid() = user_id);

drop policy if exists "own removal notices delete" on public.removal_notices;
create policy "own removal notices delete" on public.removal_notices
  for delete using (auth.uid() = user_id);

-- No insert policy: rows are only ever created by the trigger below, which
-- runs as the migration-owning role and so bypasses RLS -- same pattern as
-- create_team()/join_team() in schema_v20 not needing an insert policy on
-- team_members.

create or replace function public.notify_athlete_removal()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_team_name text;
begin
  -- Only notify when someone else removed the athlete -- a self-service
  -- "leave team" delete (auth.uid() = OLD.user_id) should stay silent.
  if OLD.role = 'athlete' and auth.uid() is distinct from OLD.user_id then
    select name into v_team_name from public.teams where id = OLD.team_id;

    insert into public.removal_notices (user_id, team_name)
    values (OLD.user_id, coalesce(v_team_name, 'your team'));
  end if;

  return OLD;
end;
$$;

drop trigger if exists trg_notify_athlete_removal on public.team_members;
create trigger trg_notify_athlete_removal
  after delete on public.team_members
  for each row execute function public.notify_athlete_removal();
```

- [ ] **Step 2: Run it in the Supabase SQL Editor against the project's database**

There's no local Postgres/CLI in this repo (every prior schema file was applied the same way — check `supabase/schema_v24_performance_profiles.sql` git history if unsure). Paste the file into the Supabase SQL Editor and run it.

- [ ] **Step 3: Verify live**

In the Supabase SQL Editor:
```sql
select * from public.removal_notices limit 1;
```
Expected: empty result, no error (confirms table + RLS exist and the query role can at least attempt a select).

- [ ] **Step 4: Commit**

```bash
git add supabase/schema_v25_removal_notices.sql
git commit -m "feat: add removal-notice table and trigger for removed athletes"
```

---

## Task 2: Surface the removal notice in `useTeam`

**Files:**
- Modify: `src/hooks/useTeam.ts`

**Interfaces:**
- Consumes: Supabase table `removal_notices` from Task 1.
- Produces: `useTeam()` now also returns `removalNotice: string | null` — a ready-to-render sentence, already fetched and dismissed (row deleted) by the time it's returned.

- [ ] **Step 1: Add state and fetch-and-dismiss logic**

In `src/hooks/useTeam.ts`, add a new piece of state and populate it inside `loadTeam` when the caller has no team:

```ts
const [removalNotice, setRemovalNotice] = useState<string | null>(null);
```

Replace the existing `if (!memberRow) { ... }` block with:

```ts
    if (!memberRow) {
      const { data: notice } = await supabase
        .from("removal_notices")
        .select("id, team_name")
        .eq("user_id", userId)
        .order("removed_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (notice) {
        await supabase.from("removal_notices").delete().eq("id", notice.id);
        setRemovalNotice(`You were removed from ${notice.team_name}.`);
      } else {
        setRemovalNotice(null);
      }

      setTeam(null);
      setRole(null);
      setLoading(false);
      return;
    }
```

And add `removalNotice` to the returned object at the bottom of the hook:

```ts
  return {
    loading,
    team,
    role,
    error,
    removalNotice,
    createTeam,
    joinTeam,
    regenerateInviteCode,
    refresh: loadTeam
  };
```

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: no new errors from `src/hooks/useTeam.ts`.

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useTeam.ts
git commit -m "feat: fetch and surface one-shot removal notice in useTeam"
```

---

## Task 3: Show the removal-notice banner

**Files:**
- Modify: `src/components/coach/TeamSetup.tsx`
- Modify: `src/app/(app)/coach/page.tsx`
- Modify: `src/styles/coach.css`

**Interfaces:**
- Consumes: `removalNotice: string | null` from Task 2's `useTeam()`.

- [ ] **Step 1: Accept and render the notice in `TeamSetup`**

In `src/components/coach/TeamSetup.tsx`, add `notice` to the props type and render it above the two panels:

```tsx
export function TeamSetup({
  onCreateTeam,
  onJoinTeam,
  error,
  notice
}: {
  onCreateTeam: (name: string) => Promise<boolean>;
  onJoinTeam: (code: string) => Promise<boolean>;
  error: string | null;
  notice?: string | null;
}) {
```

Inside the returned JSX, right after `<div className="team-setup lower-grid">`, add:

```tsx
      {notice && (
        <div className="empty-state team-setup-notice">
          <p className="muted">{notice}</p>
        </div>
      )}
```

- [ ] **Step 2: Wire it through `coach/page.tsx`**

In `src/app/(app)/coach/page.tsx`, destructure `removalNotice` and pass it down:

```tsx
  const { loading, team, role, error, removalNotice, createTeam, joinTeam, refresh } = useTeam();
```

```tsx
  if (!team || !role) {
    return <TeamSetup onCreateTeam={createTeam} onJoinTeam={joinTeam} error={error} notice={removalNotice} />;
  }
```

- [ ] **Step 3: Add the banner's grid placement**

In `src/styles/coach.css`, add (right after `.team-setup-error`, mirroring its `grid-column` pattern):

```css
.team-setup-notice {
  grid-column: 1 / -1;
}
```

- [ ] **Step 4: Verify live**

Run: `npm run dev`, then, using the two seeded test accounts from `scripts/playwright-verify/env.mjs`:
1. Sign in as `TEST_COACH_EMAIL`, go to `/coach`, create a team if none exists, note the invite code.
2. Sign in as `TEST_ATHLETE_EMAIL` (separate browser/incognito), go to `/coach`, join with the invite code.
3. Back as the coach, remove that athlete from the roster.
4. As the athlete, reload `/coach`.

Expected: the athlete sees a banner reading "You were removed from [team name]." above the Create/Join panels, and reloading again does not show it a second time.

- [ ] **Step 5: Commit**

```bash
git add src/components/coach/TeamSetup.tsx "src/app/(app)/coach/page.tsx" src/styles/coach.css
git commit -m "feat: show removed-athlete notice on the team setup screen"
```

---

## Task 4: Fix contact email + centralize it

**Files:**
- Create: `src/lib/contact.ts`
- Modify: `src/app/page.tsx`

**Interfaces:**
- Produces: `CONTACT_EMAIL` constant, imported by `src/app/page.tsx` (Task 5) and `src/app/privacy/page.tsx` / `src/app/terms/page.tsx` (Task 6).

- [ ] **Step 1: Add the constant**

```ts
export const CONTACT_EMAIL = "jaydenloring05@gmail.com";
```

- [ ] **Step 2: Fix the existing "Questions before you start?" section**

In `src/app/page.tsx`, add the import:

```ts
import { CONTACT_EMAIL } from "@/lib/contact";
```

Replace:

```tsx
          <a href="mailto:hello@elevateos.com">
            <button type="button">Email hello@elevateos.com</button>
          </a>
```

with:

```tsx
          <a href={`mailto:${CONTACT_EMAIL}`}>
            <button type="button">Email {CONTACT_EMAIL}</button>
          </a>
```

- [ ] **Step 3: Verify live**

Run: `npm run dev`, open `/`, scroll to "Questions before you start?", confirm the button reads `Email jaydenloring05@gmail.com` and its `href` is `mailto:jaydenloring05@gmail.com`.

- [ ] **Step 4: Commit**

```bash
git add src/lib/contact.ts src/app/page.tsx
git commit -m "fix: replace dead hello@elevateos.com contact email"
```

---

## Task 5: Landing page copy — headline, founder bio, pilot section, footer

**Files:**
- Modify: `src/app/page.tsx`
- Modify: `src/styles/landing.css`

- [ ] **Step 1: Tighten the hero headline**

Replace:

```tsx
          <h1>
            A dashboard that helps volleyball coaches keep every athlete&apos;s training and
            recovery on track — so nobody falls through the cracks before playoffs.
          </h1>
```

with:

```tsx
          <h1>Know who&apos;s ready. Know who needs attention.</h1>
          <p className="landing-hero-sub muted">
            Helps volleyball coaches monitor training, recovery, soreness, and athlete progress
            from one team dashboard.
          </p>
```

In `src/styles/landing.css`, change the existing `.landing-hero h1` margin and add a new rule right after it:

```css
.landing-hero h1 {
  font-size: var(--fs-display);
  line-height: 1.2;
  margin: 0 0 var(--sp-3);
}

.landing-hero-sub {
  font-size: var(--fs-lg);
  max-width: 560px;
  margin: 0 auto var(--sp-6);
}
```

- [ ] **Step 2: Tighten the founder bio**

Replace the `<p>` inside `.landing-about` (keep `.landing-about-facts` untouched):

```tsx
            <p>
              I&apos;m Jayden Loring, a collegiate volleyball player, former team captain, and
              Computer Science student. I built this because I lived the problem — training
              plans, soreness updates, and player progress scattered across group chats,
              notebooks, and memory. This is the system I wish my own teams had.
            </p>
```

- [ ] **Step 3: Replace "testimonials coming soon" with a Founding Team Pilot section**

Add a data array near the top of the file, alongside `PROBLEMS`/`STEPS`:

```tsx
const PILOT_POINTS = [
  {
    icon: Trophy,
    title: "What your team gets",
    body: "A full 90-day pilot season at no cost, direct access to me while I build, and priority say in what gets built next."
  },
  {
    icon: Users,
    title: "What we ask in return",
    body: "Honest feedback as your team uses it week to week, and a short case study or quote once the pilot season wraps."
  }
];
```

Replace the testimonials section:

```tsx
      <section className="landing-section">
        <div className="landing-section-inner">
          <h2 className="landing-section-title">What coaches are saying</h2>
          <div className="empty-state landing-testimonial-placeholder">
            <p className="muted">Coach testimonials coming soon — check back after the pilot season.</p>
          </div>
        </div>
      </section>
```

with:

```tsx
      <section className="landing-section">
        <div className="landing-section-inner">
          <h2 className="landing-section-title">Founding Team Pilot</h2>
          <p className="landing-section-lead">
            Looking for a handful of teams to run the first full season on ElevateOS.
          </p>

          <div className="landing-problem-grid landing-pilot-grid">
            {PILOT_POINTS.map((item) => {
              const Icon = item.icon;
              return (
                <div className="panel landing-problem-card" key={item.title}>
                  <Icon size={22} />
                  <h3>{item.title}</h3>
                  <p className="muted">{item.body}</p>
                </div>
              );
            })}
          </div>

          <div className="landing-pilot-cta">
            <a href={`mailto:${CONTACT_EMAIL}?subject=Founding Team Pilot`}>
              <button type="button">Apply for the Pilot</button>
            </a>
          </div>
        </div>
      </section>
```

In `src/styles/landing.css`, add:

```css
.landing-pilot-grid {
  grid-template-columns: repeat(2, 1fr);
  max-width: 760px;
  margin-left: auto;
  margin-right: auto;
}

.landing-pilot-cta {
  text-align: center;
  margin-top: var(--sp-6);
}

@media (max-width: 800px) {
  .landing-pilot-grid {
    grid-template-columns: 1fr;
  }
}
```

- [ ] **Step 4: Add Privacy/Terms links to the footer**

Replace:

```tsx
      <footer className="landing-footer">
        <p className="muted">🏐 ElevateOS</p>
      </footer>
```

with:

```tsx
      <footer className="landing-footer">
        <p className="muted">🏐 ElevateOS</p>
        <nav className="landing-footer-links">
          <Link href="/privacy">Privacy Policy</Link>
          <Link href="/terms">Terms of Service</Link>
        </nav>
      </footer>
```

In `src/styles/landing.css`, add:

```css
.landing-footer-links {
  display: flex;
  justify-content: center;
  gap: var(--sp-4);
  margin-top: var(--sp-3);
  font-size: var(--fs-sm);
}

.landing-footer-links a {
  color: var(--muted);
}

.landing-footer-links a:hover {
  color: var(--gold);
}
```

- [ ] **Step 5: Verify live**

Run: `npm run dev`, open `/`. Confirm: new headline + subhead render, founder bio reads the tightened copy with the facts list intact, "Founding Team Pilot" section replaces the old placeholder with a working `mailto:` CTA, and the footer shows working Privacy Policy / Terms of Service links (they'll 404 until Task 6 — that's expected at this point).

- [ ] **Step 6: Commit**

```bash
git add src/app/page.tsx src/styles/landing.css
git commit -m "content: tighten headline/founder bio, replace testimonials with pilot section, add footer legal links"
```

---

## Task 6: Pricing copy

**Files:**
- Modify: `src/components/landing/PricingSection.tsx`

- [ ] **Step 1: Replace the ambiguous billing copy with one clear sentence**

Replace:

```tsx
        <p className="landing-section-lead">
          Billed only during active-season months — no charge in the off-season.
        </p>
```

with:

```tsx
        <p className="landing-section-lead">
          Your first 90-day pilot is free, no card required. Afterward, plans start at
          $29/month for teams up to 16 athletes, $49/month for 17+, paused automatically
          during the off-season.
        </p>
```

- [ ] **Step 2: Remove the now-redundant bottom note**

Delete:

```tsx
        <p className="pricing-pilot-note muted">
          Your first team's first season is free — no card required to try it with your roster.
        </p>
```

(The `.pricing-pilot-note` CSS rule in `landing.css` can stay unused — it's a generic rule other sections might reuse later; removing unused CSS is out of scope for this pass.)

- [ ] **Step 3: Verify live**

Run: `npm run dev`, open `/#pricing`. Confirm only one pricing-clarity sentence appears, and it matches the copy above exactly.

- [ ] **Step 4: Commit**

```bash
git add src/components/landing/PricingSection.tsx
git commit -m "content: replace ambiguous pricing copy with unambiguous pilot terms"
```

---

## Task 7: Privacy Policy and Terms of Service pages

**Files:**
- Create: `src/app/privacy/page.tsx`
- Create: `src/app/terms/page.tsx`
- Create: `src/styles/legal.css`

**Interfaces:**
- Consumes: `CONTACT_EMAIL` from `src/lib/contact.ts` (Task 4), `LandingHeader` from `src/components/landing/LandingHeader.tsx`.

- [ ] **Step 1: Add shared legal-page styling**

```css
.legal-page {
  min-height: 100vh;
}

.legal-content {
  max-width: 760px;
  margin: 0 auto;
  padding: var(--sp-8) var(--sp-6);
}

.legal-content h1 {
  margin: 0 0 var(--sp-2);
}

.legal-content .muted {
  margin: 0 0 var(--sp-6);
}

.legal-content h2 {
  font-size: var(--fs-xl);
  margin: var(--sp-6) 0 var(--sp-2);
}

.legal-content p,
.legal-content li {
  line-height: 1.7;
  color: var(--text);
}

.legal-content ul {
  margin: 0 0 var(--sp-4);
  padding-left: 20px;
}

@media (max-width: 800px) {
  .legal-content {
    padding: var(--sp-6) var(--sp-4);
  }
}
```

- [ ] **Step 2: Write the Privacy Policy page**

```tsx
import { LandingHeader } from "@/components/landing/LandingHeader";
import { CONTACT_EMAIL } from "@/lib/contact";

import "@/styles/landing.css";
import "@/styles/legal.css";

export default function PrivacyPage() {
  return (
    <div className="legal-page">
      <LandingHeader />

      <div className="legal-content">
        <h1>Privacy Policy</h1>
        <p className="muted">Last updated July 19, 2026.</p>

        <p>
          ElevateOS is a training and recovery tracker for volleyball teams. This page explains
          what we collect, who can see it, and how it&apos;s used — in plain language, because
          you shouldn&apos;t need a lawyer to understand it.
        </p>

        <h2>What we collect</h2>
        <p>
          When you use ElevateOS we store the account info you sign up with (email), the team
          you create or join, and the training data you choose to log: workouts, sets and reps,
          soreness and pain ratings, sleep and energy check-ins, personal records, and calendar
          entries.
        </p>

        <h2>Who can see your data</h2>
        <ul>
          <li>
            <strong>Athletes</strong> own their own data. You can always see everything you&apos;ve
            logged.
          </li>
          <li>
            <strong>Coaches</strong> can see read-only recovery and training data for athletes on
            their own roster — never any other team&apos;s. Coaches cannot edit or delete an
            athlete&apos;s logged data.
          </li>
          <li>We don&apos;t sell or share your data with any third party.</li>
        </ul>

        <h2>Health disclaimer</h2>
        <p>
          ElevateOS is a training-and-recovery tracking tool. It does not diagnose injuries,
          provide medical advice, or replace a doctor, athletic trainer, or physical therapist.
          If you&apos;re dealing with pain or a possible injury, talk to a medical professional —
          don&apos;t rely on this app for that decision.
        </p>

        <h2>Athletes under 18</h2>
        <p>
          If you&apos;re a minor using ElevateOS as part of a team, a parent or guardian should be
          aware that you&apos;re logging training and recovery data (including soreness and pain
          check-ins) that your coach can view.
        </p>

        <h2>Questions</h2>
        <p>
          Reach out any time at{" "}
          <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
        </p>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Write the Terms of Service page**

```tsx
import { LandingHeader } from "@/components/landing/LandingHeader";
import { CONTACT_EMAIL } from "@/lib/contact";

import "@/styles/landing.css";
import "@/styles/legal.css";

export default function TermsPage() {
  return (
    <div className="legal-page">
      <LandingHeader />

      <div className="legal-content">
        <h1>Terms of Service</h1>
        <p className="muted">Last updated July 19, 2026.</p>

        <p>
          These are the plain-language terms for using ElevateOS during its pilot phase. By
          creating an account, you&apos;re agreeing to them.
        </p>

        <h2>Your account</h2>
        <p>
          You&apos;re responsible for the accuracy of what you log and for keeping your account
          credentials to yourself. Coaches are responsible for the teams they create and the
          invite codes they share.
        </p>

        <h2>Pricing</h2>
        <p>
          Your first 90-day pilot is free, no card required. After that, plans start at
          $29/month for teams up to 16 athletes and $49/month for 17+ athletes, paused
          automatically during the off-season.
        </p>

        <h2>Not medical advice</h2>
        <p>
          ElevateOS tracks training and recovery data. It does not diagnose injuries or provide
          medical advice, and it isn&apos;t a substitute for a doctor, athletic trainer, or
          physical therapist.
        </p>

        <h2>Acceptable use</h2>
        <p>
          Use ElevateOS for its intended purpose — tracking your own or your team&apos;s training
          and recovery. Don&apos;t try to access another team&apos;s data, share invite codes
          outside your own roster, or use the service in a way that disrupts it for other teams.
        </p>

        <h2>No warranty</h2>
        <p>
          ElevateOS is provided as-is during this pilot phase. We work to keep it reliable, but
          we don&apos;t guarantee uninterrupted or error-free service.
        </p>

        <h2>Changes</h2>
        <p>
          We may update these terms as the product evolves, especially during the pilot. We&apos;ll
          post changes here.
        </p>

        <h2>Questions</h2>
        <p>
          Reach out any time at{" "}
          <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
        </p>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Verify live**

Run: `npm run dev`, open `/privacy` and `/terms` directly. Confirm both render with the shared header, readable typography, and a working `mailto:` link. Go back to `/` and confirm the footer links (added in Task 5) now resolve instead of 404ing.

- [ ] **Step 5: Commit**

```bash
git add src/app/privacy/page.tsx src/app/terms/page.tsx src/styles/legal.css
git commit -m "feat: add Privacy Policy and Terms of Service pages"
```

---

## Task 8: Auth screen — back button, legal links, health disclaimer

**Files:**
- Modify: `src/app/login/page.tsx`
- Modify: `src/styles/auth.css`

- [ ] **Step 1: Add a back-to-landing link**

In `src/app/login/page.tsx`, add the import:

```tsx
import Link from "next/link";
```

Add the link just inside `.auth-shell`, before `.auth-card`:

```tsx
    <div className="auth-shell">
      <Link href="/" className="auth-back-link">
        ← Back to ElevateOS
      </Link>

      <div className="panel auth-card">
```

- [ ] **Step 2: Add legal links + health disclaimer, shown only during sign-up**

Right after the closing `</form>` and before `<div className="auth-switch">`, add:

```tsx
        {mode !== "sign-in" && (
          <div className="auth-legal">
            <p className="muted">
              By creating an account you agree to our{" "}
              <Link href="/terms">Terms of Service</Link> and{" "}
              <Link href="/privacy">Privacy Policy</Link>.
            </p>
            <p className="muted">
              ElevateOS doesn&apos;t diagnose injuries or provide medical advice — always
              consult a medical professional for pain or injury concerns. Athletes under 18
              should have a parent or guardian aware of their use of the app.
            </p>
          </div>
        )}
```

- [ ] **Step 3: Style the new elements**

In `src/styles/auth.css`, add:

```css
.auth-back-link {
  display: block;
  max-width: 380px;
  width: 100%;
  margin: 0 auto 16px;
  color: var(--muted);
  font-size: 13px;
  font-weight: 600;
}

.auth-back-link:hover {
  color: var(--gold);
}

.auth-legal {
  margin-top: 16px;
  display: grid;
  gap: 8px;
}

.auth-legal p {
  font-size: 12px;
  line-height: 1.6;
  margin: 0;
}

.auth-legal a {
  color: var(--gold);
  font-weight: 700;
}

.auth-legal a:hover {
  text-decoration: underline;
}
```

`.auth-shell` is a `display: grid; place-items: center` container, so the back link needs to sit above the centered card rather than be centered as a sibling grid item. Change `.auth-shell` in `src/styles/auth.css` from `display: grid; place-items: center;` to a flex column so both elements stack and center:

```css
.auth-shell {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 24px;
}
```

- [ ] **Step 4: Verify live**

Run: `npm run dev`, open `/login`. Confirm: a "← Back to ElevateOS" link sits above the card and navigates to `/` when clicked. Switch to "Sign up" — confirm the Terms/Privacy links and health disclaimer appear below the form, and disappear when switching back to "Sign in".

- [ ] **Step 5: Commit**

```bash
git add src/app/login/page.tsx src/styles/auth.css
git commit -m "feat: add back-to-landing link and legal/health disclaimer to sign-up"
```

---

## Task 9: Exercise catalog — resolve the 10 most-referenced substitution gaps

**Files:**
- Modify: `src/data/exercises.ts`

**Interfaces:**
- Consumes: the `ex(...)` helper already defined at the top of the file.
- Produces: 10 new `Exercise` entries so `getSubstitutionCandidates` (in `src/hooks/useExerciseSubstitutions.ts`) resolves these names to curated entries instead of falling back to "same category."

- [ ] **Step 1: Append the 10 entries**

Add these as new elements at the end of the `exercises` array (right after the "Glute Bridge" entry, before the closing `];`), each preceded by a blank line for readability:

```ts
  ex(
    "Split Squat",
    "Jump Development",
    "Beginner",
    "🦿",
    "Builds single-leg strength and balance from a stationary stance -- the base progression before adding a Bulgarian split squat's elevated rear foot.",
    ["Feet split front-to-back, torso tall.", "Lower straight down, not forward.", "Front knee tracks over the toes.", "Push evenly through the whole front foot."],
    ["Leaning too far forward.", "Letting the front knee cave inward.", "Taking a stance too narrow to balance."],
    ["Bulgarian Split Squat", "Reverse Lunges", "Step-Ups"]
  ),
  ex(
    "Single-Leg Hip Thrust",
    "Jump Development",
    "Intermediate",
    "🍑",
    "Builds single-leg glute strength and hip stability beyond what the two-leg hip thrust demands.",
    ["Shoulders on a bench, one foot planted.", "Free leg stays relaxed, not driving the rep.", "Drive through the planted heel.", "Squeeze the glute hard at the top."],
    ["Rotating the hips to help the working side.", "Overarching the lower back at the top.", "Rushing through reps."],
    ["Hip Thrust", "Glute Bridge", "Cable Pull-Through"]
  ),
  ex(
    "Cable Pull-Through",
    "Jump Development",
    "Beginner",
    "🏋️",
    "Builds hip-hinge strength and glute drive with constant cable tension and less spinal load than a barbell hinge.",
    ["Hinge at the hips, not the knees.", "Keep the cable close to your body.", "Drive hips forward to finish.", "Squeeze glutes at the top."],
    ["Squatting the weight instead of hinging.", "Rounding the lower back.", "Using the arms to pull."],
    ["Hip Thrust", "RDL", "Single-Leg Hip Thrust"]
  ),
  ex(
    "Goblet Squat",
    "Jump Development",
    "Beginner",
    "🏆",
    "Builds quad and core strength with a front-loaded hold that keeps the torso upright through the squat.",
    ["Hold the weight close to your chest.", "Elbows brush inside the knees at the bottom.", "Keep your torso tall.", "Drive through the whole foot to stand."],
    ["Letting the chest fall forward.", "Knees caving inward.", "Cutting depth short."],
    ["Heel-Elevated Goblet Squat", "Front Squat", "Split Squat"]
  ),
  ex(
    "Seated Calf Raise",
    "Jump Development",
    "Beginner",
    "🦶",
    "Isolates the soleus with the knee bent -- a key lower-leg muscle for jumping and landing that standing calf work doesn't fully reach.",
    ["Knees bent at roughly 90 degrees.", "Raise the heels as high as possible.", "Pause at the top.", "Lower under control for a full stretch."],
    ["Bouncing through the bottom.", "Using a tiny range of motion.", "Rushing the tempo."],
    ["Calf Raises", "Soleus Raises", "Single-Leg Calf Raise"]
  ),
  ex(
    "Box Step-Offs",
    "Landing Mechanics",
    "Beginner",
    "⬇️",
    "Teaches a soft, controlled landing by stepping off a low box instead of jumping -- the entry point before adding depth drops or jump volume.",
    ["Step off, don't jump off.", "Land on both feet, hips back, knees soft.", "Land as quietly as possible.", "Stick the landing for a full second before resetting."],
    ["Landing stiff-legged.", "Knees caving in on contact.", "Using too high of a box too soon."],
    ["Landing Mechanics Drill", "Depth Drops", "Drop Squat"]
  ),
  ex(
    "Drop Squat",
    "Landing Mechanics",
    "Beginner",
    "🎯",
    "Trains the body to absorb force fast by dropping quickly into a stable squat position -- builds the landing reflex jumping and cutting rely on.",
    ["Start standing tall.", "Drop quickly into a quarter-to-half squat.", "Land quiet with hips back and knees soft.", "Freeze in the landing position for two seconds."],
    ["Landing with straight legs.", "Knees collapsing inward.", "Wobbling instead of sticking the landing."],
    ["Landing Mechanics Drill", "Box Step-Offs", "Depth Drops"]
  ),
  ex(
    "Line Hops",
    "Jump Development",
    "Beginner",
    "🦘",
    "Builds ankle stiffness, rhythm, and reactive bounce using nothing but a line on the floor.",
    ["Stay light on the balls of your feet.", "Hop side to side over the line.", "Keep ground contact time short.", "Keep knees soft, not locked."],
    ["Jumping too high instead of quick.", "Landing heavy.", "Losing rhythm between hops."],
    ["Pogo Hops", "Jump Rope", "Lateral Bounds"]
  ),
  ex(
    "Easy Bike",
    "Recovery",
    "Beginner",
    "🚴",
    "Low-impact cardio that raises blood flow for recovery without adding joint stress on rest or light days.",
    ["Keep the resistance light.", "Hold an easy, conversational pace.", "Relax your shoulders and grip.", "Stop before you feel fatigued, not after."],
    ["Turning it into a hard workout.", "Gripping the bars too tight.", "Skipping it because it feels too easy -- that's the point."],
    ["Walk 20-30 minutes", "Light Swim", "Incline Walk"]
  ),
  ex(
    "Band Rotations",
    "Rotational Core",
    "Beginner",
    "🎗️",
    "Builds rotational core strength with a resistance band -- an accessible entry point before loading a cable or landmine rotation.",
    ["Anchor the band at chest height to your side.", "Rotate through the hips and ribs together.", "Keep arms long, don't just pull with the hands.", "Control the return, don't let the band snap you back."],
    ["Only rotating the arms, not the torso.", "Using too much band tension.", "Rushing the return."],
    ["Med Ball Rotational Throws", "Cable Woodchoppers", "Landmine Rotations"]
  )
```

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: no new errors.

- [ ] **Step 3: Verify live**

Run: `npm run dev`, open `/library`, search for "Split Squat" (and a couple others from the list) and confirm each now shows as a full catalog entry with cues/mistakes/video instead of being absent. Then open the workout flow, pick an exercise whose substitutions include one of the 10 (e.g. "Hip Thrust" → substitution picker should now offer "Single-Leg Hip Thrust" and "Cable Pull-Through" as curated options).

- [ ] **Step 4: Commit**

```bash
git add src/data/exercises.ts
git commit -m "feat: add 10 most-referenced missing exercise catalog entries"
```

---

## Task 10: Update `SUGGESTIONS.md`

**Files:**
- Modify: `SUGGESTIONS.md`

- [ ] **Step 1: Update the resolved "Data / content" bullet**

Replace:

```markdown
- **A handful of substitution hints in `src/data/exercises.ts` still don't
  resolve to a catalog entry** (e.g. "Lat Pulldown", "Romanian Deadlift",
  "Glute Bridge" variants). Most-referenced typos were fixed already;
  writing full catalog entries for the remaining recurring names would let
  the curated-substitution picker surface curated options instead of
  falling back to "same category" every time.
```

with:

```markdown
- **A long tail of substitution hints in `src/data/exercises.ts` still don't
  resolve to a catalog entry** (e.g. "Kettlebell Deadlift", "Wall Sit",
  "Bear Crawl", "Rear Delt Fly" — over 100 remain out of ~160 total
  substitution references). The 10 most-referenced names were fixed in the
  2026-07-19 pre-launch pass (Split Squat, Single-Leg Hip Thrust, Cable
  Pull-Through, Goblet Squat, Seated Calf Raise, Box Step-Offs, Drop Squat,
  Line Hops, Easy Bike, Band Rotations). The rest are low-frequency
  (referenced once or twice each) and are only worth full catalog entries
  as they come up as commonly-picked substitutions in practice.
```

- [ ] **Step 2: Add new sections from the product review**

Append to the end of the file (after the existing "Reliability" section):

```markdown

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
  for now — a multi-sport brand hierarchy (e.g. "ElevateOS Volleyball /
  Basketball / Football") was suggested in a product review but is
  deliberately deferred. Expanding brand scope before volleyball has proven
  out with a real paying client would dilute focus at exactly the wrong
  time.
```

- [ ] **Step 3: Verify**

Read the file back and confirm it's still valid Markdown with no duplicate headers, and that the "Reliability" section (untouched, still has the `useCoachRoster` pagination item) is unchanged.

- [ ] **Step 4: Commit**

```bash
git add SUGGESTIONS.md
git commit -m "docs: update SUGGESTIONS.md with pre-launch pass results and product-review backlog"
```

---

## Task 11: Full live verification pass

**Files:**
- Create: `scripts/playwright-verify/prelaunch-copy-legal.mjs`
- Create: `scripts/playwright-verify/prelaunch-core-flow.mjs`

**Interfaces:**
- Consumes: `BASE_URL`, `TEST_COACH_EMAIL`, `TEST_COACH_PASSWORD`, `TEST_ATHLETE_EMAIL`, `TEST_ATHLETE_PASSWORD` from `scripts/playwright-verify/env.mjs`; `signUpOrSignIn` from `scripts/playwright-verify/auth.mjs`.

- [ ] **Step 1: Write the copy/legal verification script**

```js
import { chromium } from "@playwright/test";
import { BASE_URL } from "./env.mjs";

const browser = await chromium.launch();
const page = await browser.newPage();

const consoleErrors = [];
page.on("console", (msg) => {
  if (msg.type() === "error") consoleErrors.push(msg.text());
});

await page.goto(BASE_URL);

const headline = await page.locator("h1").first().textContent();
console.log("Hero headline:", headline?.trim());
if (!headline?.includes("Know who's ready")) {
  throw new Error("Hero headline did not update as expected");
}

const pricingLead = await page.locator(".pricing-toggle").locator("..").locator(".landing-section-lead").textContent();
console.log("Pricing lead:", pricingLead?.trim());
if (!pricingLead?.includes("90-day pilot")) {
  throw new Error("Pricing copy did not update as expected");
}

const pilotSection = await page.locator("text=Founding Team Pilot").count();
if (pilotSection === 0) throw new Error("Founding Team Pilot section not found");

const contactHref = await page.locator('a[href^="mailto:jaydenloring05@gmail.com"]').count();
if (contactHref === 0) throw new Error("No mailto link to the new contact email found");

await page.locator('footer a[href="/privacy"]').click();
await page.waitForURL("**/privacy");
console.log("Privacy page title:", await page.locator("h1").first().textContent());

await page.goto(`${BASE_URL}/terms`);
console.log("Terms page title:", await page.locator("h1").first().textContent());

await page.goto(`${BASE_URL}/login`);
await page.locator(".auth-back-link").click();
await page.waitForURL(BASE_URL + "/");
console.log("Back-to-landing link works.");

await page.screenshot({ path: "scripts/playwright-verify/screenshots/prelaunch-copy-legal.png", fullPage: true });

console.log("Console errors observed:", consoleErrors.length === 0 ? "none" : consoleErrors);
if (consoleErrors.length > 0) throw new Error("Console errors observed during copy/legal verification");

await browser.close();
console.log("prelaunch-copy-legal: PASS");
```

- [ ] **Step 2: Run it**

Prereq: `npm run dev` running in another terminal.
Run: `node scripts/playwright-verify/prelaunch-copy-legal.mjs`
Expected: `prelaunch-copy-legal: PASS` with no thrown errors.

- [ ] **Step 3: Write the core-flow + removal-notice verification script**

```js
import { chromium } from "@playwright/test";
import {
  BASE_URL,
  TEST_COACH_EMAIL,
  TEST_COACH_PASSWORD,
  TEST_ATHLETE_EMAIL,
  TEST_ATHLETE_PASSWORD
} from "./env.mjs";
import { signUpOrSignIn } from "./auth.mjs";

const browser = await chromium.launch();
const coachPage = await (await browser.newContext()).newPage();
const athletePage = await (await browser.newContext()).newPage();

// 1. Coach: sign in, ensure a team exists, grab the invite code.
await signUpOrSignIn(coachPage, TEST_COACH_EMAIL, TEST_COACH_PASSWORD);
await coachPage.goto(`${BASE_URL}/coach`);
await coachPage.waitForTimeout(1000);

if (await coachPage.locator("text=Create a Team").count()) {
  await coachPage.fill('input[placeholder*="Team name"]', "Prelaunch Verify Team");
  await coachPage.click('button:has-text("Create Team")');
  await coachPage.waitForTimeout(1000);
}

const inviteCode = (await coachPage.locator(".invite-code-button").textContent())
  ?.replace("Invite code:", "")
  .trim();
console.log("Invite code:", inviteCode);
if (!inviteCode) throw new Error("Could not read invite code from coach dashboard");

// 2. Athlete: sign in, join the team.
await signUpOrSignIn(athletePage, TEST_ATHLETE_EMAIL, TEST_ATHLETE_PASSWORD);
await athletePage.goto(`${BASE_URL}/coach`);
await athletePage.waitForTimeout(1000);

if (await athletePage.locator("text=Join a Team").count()) {
  await athletePage.fill('input[placeholder="Invite code"]', inviteCode);
  await athletePage.click('button:has-text("Join Team")');
  await athletePage.waitForTimeout(1000);
}
console.log("Athlete joined team:", await athletePage.locator(".panel h2").first().textContent());

// 3. Athlete: log a workout (smoke check the flow is reachable, not a full session).
await athletePage.goto(`${BASE_URL}/workout`);
await athletePage.waitForTimeout(1000);
console.log("Workout page reachable, console-clean load.");

// 4. Coach: view roster, remove the athlete.
await coachPage.goto(`${BASE_URL}/coach`);
await coachPage.waitForTimeout(1000);
const rosterRow = coachPage.locator(".roster-row").first();
if ((await rosterRow.count()) === 0) throw new Error("Athlete not visible on coach roster");

await rosterRow.locator("button", { hasText: "Remove" }).click();
await coachPage.locator("button", { hasText: "Remove" }).last().click(); // confirm in ConfirmModal
await coachPage.waitForTimeout(1000);
console.log("Athlete removed from roster.");

// 5. Athlete: reload /coach, expect the removal notice.
await athletePage.goto(`${BASE_URL}/coach`);
await athletePage.waitForTimeout(1000);
const notice = await athletePage.locator(".team-setup-notice").textContent();
console.log("Removal notice text:", notice?.trim());
if (!notice?.includes("removed from")) {
  throw new Error("Removal notice did not appear for the removed athlete");
}

// 6. Reload again -- notice must not reappear (one-shot).
await athletePage.reload();
await athletePage.waitForTimeout(1000);
const noticeAgain = await athletePage.locator(".team-setup-notice").count();
if (noticeAgain !== 0) throw new Error("Removal notice reappeared after being read once");

await coachPage.screenshot({ path: "scripts/playwright-verify/screenshots/prelaunch-coach-roster.png" });
await athletePage.screenshot({ path: "scripts/playwright-verify/screenshots/prelaunch-removal-notice.png" });

await browser.close();
console.log("prelaunch-core-flow: PASS");
```

- [ ] **Step 4: Run it**

Prereq: `npm run dev` running.
Run: `node scripts/playwright-verify/prelaunch-core-flow.mjs`
Expected: `prelaunch-core-flow: PASS`, with the removal-notice screenshot showing the banner text.

- [ ] **Step 5: Run the full static verification**

```bash
npx tsc --noEmit
npm run build
```
Expected: both exit 0 with no errors.

- [ ] **Step 6: Commit**

```bash
git add scripts/playwright-verify/prelaunch-copy-legal.mjs scripts/playwright-verify/prelaunch-core-flow.mjs
git commit -m "test: add live verification scripts for pre-launch pass"
```

---

## Self-Review Notes

- **Spec coverage:** contact email (Task 4), Google sign-in decision recorded (Task 10), removal notice (Tasks 1–3), substitution gaps (Task 9), Privacy/ToS/health-disclaimer/minors (Tasks 7–8), pricing copy (Task 6), pilot section (Task 5), founder bio (Task 5), headline (Task 5), back button (Task 8), SUGGESTIONS.md backlog additions (Task 10), live verification (Task 11) — all covered.
- **Cross-references the user asked for** ("weekly automated coach reports", "tournament mode", "position-specific scorecards" as *existing* entries to cross-reference): none of these exist in the current `SUGGESTIONS.md` or its git history — confirmed via `git log --all -p -- SUGGESTIONS.md`. They were likely part of the batch of suggestions already implemented and pruned before this pass. Task 10 adds the new items as standalone entries with self-contained distinguishing language instead of a broken cross-reference.
- **Order matters:** Task 4 (contact constant) must land before Tasks 5 and 7, which import it. Task 1 must land before Task 2, which queries the table it creates.
