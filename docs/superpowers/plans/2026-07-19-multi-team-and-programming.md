# Multi-Team-Per-Coach & Coach-Editable Programming Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let a coach manage more than one team (JV/Varsity, etc.), and build coach-editable programming — gated by a per-team `plan_tier` — as a real upgrade incentive from the free pilot to a paid plan.

**Architecture:** Multi-team-per-coach lands first: it replaces `useTeam`'s "one team" model with a "list of teams + one active team" model, which the programming-editor feature is then built directly against (avoiding a retrofit). Coach-editable programming has two tiers: free-tier teams get a per-exercise "team default" picker limited to each exercise's existing curated substitution list; paid-tier teams additionally get a full per-day editor (add/remove/reorder any catalog exercise). Resolution order for what an athlete actually sees: personal substitution → team's full day edit (paid only) → team's preset default (free tier only) → the plan's original exercise. This is implemented as one pure function (`resolveWorkoutDays`) applied at every place the app currently reads `getWorkoutDays(week)` directly, fed by one new batch of Supabase queries added to `TrackerContext`'s existing single-`useEffect` fetch pattern (this codebase's established idiom for per-user overlay data — no new async-loading states introduced).

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript, Supabase (Postgres + RLS).

## Global Constraints

- Schema files continue the existing sequential numbering: `schema_v25_removal_notices.sql` already exists (prior plan). This plan uses `schema_v26_multi_team_coach.sql`, `schema_v27_team_plan_tier.sql`, `schema_v28_team_exercise_defaults.sql`, `schema_v29_team_day_overrides.sql`, applied in that order.
- No Supabase CLI/service-role key exists in this environment — every migration file here is authored and committed, then applied manually by the project owner via the Supabase SQL Editor, same as every prior schema file.
- Athletes stay single-team always. Only coaches may hold more than one `team_members` row.
- `plan_tier` values are exactly `'pilot'` and `'paid'`. No billing integration in this plan — the column is flipped manually via SQL for now.
- Part 2 (team exercise defaults) is available on every team regardless of tier. Part 3 (full day editor) is gated to `plan_tier = 'paid'` at both the RLS layer and the UI layer.
- Verify each part live before moving to the next (this plan's tasks are ordered so each is independently testable): multi-team switching first, then plan_tier, then presets, then the full editor, then guardrails.
- Run `npx tsc --noEmit` and `npm run build` after every task.

---

## File Structure

**Create:**
- `supabase/schema_v26_multi_team_coach.sql`
- `supabase/schema_v27_team_plan_tier.sql`
- `supabase/schema_v28_team_exercise_defaults.sql`
- `supabase/schema_v29_team_day_overrides.sql`
- `src/lib/programResolution.ts` — `phaseSlug`, `TeamOverrideData` type, `resolveWorkoutDays`
- `src/components/coach/TeamSwitcher.tsx` — active-team dropdown + "New Team" inline form
- `src/components/coach/ProgramEditor.tsx` — the coach-facing Program tab (presets + full editor + guardrails + reset)
- `src/hooks/useTeamProgram.ts` — fetch/write `team_exercise_defaults` and `team_day_overrides` for the coach's active team

**Modify:**
- `src/hooks/useTeam.ts` — `teams[]` + `activeTeam` + `selectTeam` instead of a single `team`
- `src/app/(app)/coach/page.tsx` — pass the new shape through
- `src/components/coach/CoachDashboard.tsx` — team switcher, "+ New Team", Roster/Program tabs
- `src/data/workoutPlan.ts` — add `getWorkoutDaysForPhase`
- `src/context/TrackerContext.tsx` — fetch and expose `teamOverride: TeamOverrideData | null`
- `src/hooks/useWorkoutProgress.ts`, `src/components/workouts/WorkoutGrid.tsx`, `src/components/dashboard/DashboardCards.tsx`, `src/components/workout/StartWorkoutScreen.tsx`, `src/components/workout/ActiveWorkoutView.tsx`, `src/hooks/useActiveWorkoutSession.ts` — run `getWorkoutDays(week)` through `resolveWorkoutDays`
- `src/styles/coach.css` — switcher, tabs, program-editor styling

---

## Task 1: Multi-team-per-coach schema

**Files:**
- Create: `supabase/schema_v26_multi_team_coach.sql`

**Interfaces:**
- Produces: `team_members` allows multiple `role='coach'` rows per `user_id`, still exactly one `role='athlete'` row per `user_id`. `regenerate_invite_code(p_team_id uuid)` and `delete_team(p_team_id uuid)` replace the old zero-arg versions. `create_team` blocks only existing athletes, not existing coaches.

- [ ] **Step 1: Write the migration**

```sql
-- Volleyball Tracker V26 schema (multi-team-per-coach support)
-- Run this once in the Supabase SQL Editor, after schema_v25_removal_notices.sql.
-- Safe to re-run.

alter table public.team_members drop constraint if exists team_members_user_id_key;

create unique index if not exists team_members_one_team_per_athlete
  on public.team_members (user_id)
  where role = 'athlete';

alter table public.team_members drop constraint if exists team_members_team_id_user_id_key;
alter table public.team_members
  add constraint team_members_team_id_user_id_key unique (team_id, user_id);

-- regenerate_invite_code and delete_team used to look up "the" team via
-- `where user_id = auth.uid() and role = 'coach'` with no limit, assuming a
-- single match. Now that a coach can have multiple rows, both take an
-- explicit p_team_id and check ownership of that specific team.

drop function if exists public.regenerate_invite_code();
create or replace function public.regenerate_invite_code(p_team_id uuid)
returns table (invite_code text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_code text;
  v_attempts int := 0;
begin
  if not public.is_team_coach(p_team_id) then
    raise exception 'You are not a coach of this team.';
  end if;

  loop
    v_code := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6));
    exit when not exists (select 1 from public.teams t where t.invite_code = v_code);
    v_attempts := v_attempts + 1;
    if v_attempts > 10 then
      raise exception 'Could not generate a unique invite code. Try again.';
    end if;
  end loop;

  update public.teams set invite_code = v_code where id = p_team_id;

  return query select v_code;
end;
$$;

grant execute on function public.regenerate_invite_code(uuid) to authenticated;

drop function if exists public.delete_team();
create or replace function public.delete_team(p_team_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_team_coach(p_team_id) then
    raise exception 'You are not a coach of this team.';
  end if;

  delete from public.teams where id = p_team_id;
end;
$$;

grant execute on function public.delete_team(uuid) to authenticated;

-- create_team currently blocks creation if the caller has ANY existing
-- team_members row, coach or athlete -- that's what made a second team
-- impossible before this migration. Athletes must still stay single-team,
-- but a coach creating a second team is exactly this feature's point.
create or replace function public.create_team(p_name text)
returns table (id uuid, name text, invite_code text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_team_id uuid;
  v_code text;
  v_attempts int := 0;
begin
  if exists (select 1 from public.team_members where user_id = auth.uid() and role = 'athlete') then
    raise exception 'You are already on a team as an athlete.';
  end if;

  if coalesce(trim(p_name), '') = '' then
    raise exception 'Team name is required.';
  end if;

  loop
    v_code := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6));
    exit when not exists (select 1 from public.teams t where t.invite_code = v_code);
    v_attempts := v_attempts + 1;
    if v_attempts > 10 then
      raise exception 'Could not generate a unique invite code. Try again.';
    end if;
  end loop;

  insert into public.teams (coach_id, name, invite_code)
  values (auth.uid(), trim(p_name), v_code)
  returning teams.id into v_team_id;

  insert into public.team_members (team_id, user_id, role, display_name)
  values (v_team_id, auth.uid(), 'coach', auth.email());

  return query select v_team_id, trim(p_name), v_code;
end;
$$;

grant execute on function public.create_team(text) to authenticated;
```

- [ ] **Step 2: Note for the human**

This must be applied in the Supabase SQL Editor before Task 3 (UI) can be live-verified. Say so plainly in your report — do not attempt to run it.

- [ ] **Step 3: Commit**

```bash
git add supabase/schema_v26_multi_team_coach.sql
git commit -m "feat: allow coaches to manage multiple teams"
```

---

## Task 2: `useTeam` — from one team to a list

**Files:**
- Modify: `src/hooks/useTeam.ts`

**Interfaces:**
- Consumes: `team_members`/`teams` tables (now multi-row for coaches, per Task 1), `removal_notices` (existing, from the prior plan's Task 2 work — keep that logic intact).
- Produces: `useTeam()` now returns `{ loading, teams: Team[], activeTeam: Team | null, role, error, removalNotice, createTeam, joinTeam, regenerateInviteCode(teamId), selectTeam(teamId), refresh }`. `team` is removed — every caller must be updated (Task 3).

- [ ] **Step 1: Rewrite the hook**

Replace the entire contents of `src/hooks/useTeam.ts` with:

```ts
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { useTrackerContext } from "@/context/TrackerContext";
import { createClient } from "@/lib/supabase/client";
import { Team, TeamRole } from "@/types";

const ACTIVE_TEAM_KEY = "elevateos:activeTeamId";

export function useTeam() {
  const { userId } = useTrackerContext();
  const supabase = useMemo(() => createClient(), []);

  const [loading, setLoading] = useState(true);
  const [teams, setTeams] = useState<Team[]>([]);
  const [activeTeamId, setActiveTeamId] = useState<string | null>(null);
  const [role, setRole] = useState<TeamRole | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [removalNotice, setRemovalNotice] = useState<string | null>(null);

  const loadTeams = useCallback(async () => {
    setLoading(true);
    setError(null);

    const { data: memberRows, error: memberError } = await supabase
      .from("team_members")
      .select("team_id, role")
      .eq("user_id", userId);

    if (memberError) {
      console.error("Failed to load team membership", memberError);
      setError("Couldn't load your team. Try again.");
      setLoading(false);
      return;
    }

    if (!memberRows || memberRows.length === 0) {
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

      setTeams([]);
      setActiveTeamId(null);
      setRole(null);
      setLoading(false);
      return;
    }

    const teamIds = memberRows.map((row) => row.team_id);
    const { data: teamRows, error: teamsError } = await supabase
      .from("teams")
      .select("*")
      .in("id", teamIds)
      .order("created_at", { ascending: false });

    if (teamsError || !teamRows) {
      console.error("Failed to load teams", teamsError);
      setError("Couldn't load your team. Try again.");
      setLoading(false);
      return;
    }

    setTeams(teamRows as Team[]);
    setRole(memberRows[0].role as TeamRole);

    const stored = typeof window !== "undefined" ? window.localStorage.getItem(ACTIVE_TEAM_KEY) : null;
    const nextActiveId = teamRows.find((team) => team.id === stored)?.id ?? teamRows[0]?.id ?? null;
    setActiveTeamId(nextActiveId);
    setLoading(false);
  }, [supabase, userId]);

  useEffect(() => {
    loadTeams();
  }, [loadTeams]);

  function selectTeam(teamId: string) {
    setActiveTeamId(teamId);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(ACTIVE_TEAM_KEY, teamId);
    }
  }

  const activeTeam = teams.find((team) => team.id === activeTeamId) ?? null;

  async function createTeam(name: string) {
    setError(null);

    const { error: rpcError } = await supabase.rpc("create_team", { p_name: name });

    if (rpcError) {
      setError(rpcError.message || "Couldn't create the team.");
      return false;
    }

    await loadTeams();
    return true;
  }

  async function joinTeam(code: string) {
    setError(null);

    const { error: rpcError } = await supabase.rpc("join_team", {
      p_invite_code: code
    });

    if (rpcError) {
      setError(rpcError.message || "Couldn't join that team.");
      return false;
    }

    await loadTeams();
    return true;
  }

  async function regenerateInviteCode(teamId: string) {
    setError(null);

    const { error: rpcError } = await supabase.rpc("regenerate_invite_code", {
      p_team_id: teamId
    });

    if (rpcError) {
      setError(rpcError.message || "Couldn't regenerate the invite code.");
      return false;
    }

    await loadTeams();
    return true;
  }

  return {
    loading,
    teams,
    activeTeam,
    role,
    error,
    removalNotice,
    createTeam,
    joinTeam,
    regenerateInviteCode,
    selectTeam,
    refresh: loadTeams
  };
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: errors ONLY in files that still reference the old `team`/no-arg `regenerateInviteCode` shape (`coach/page.tsx`, `CoachDashboard.tsx`) — those are fixed in Task 3. If you see errors anywhere else, stop and report NEEDS_CONTEXT.

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useTeam.ts
git commit -m "feat: support multiple teams per coach in useTeam"
```

---

## Task 3: Team switcher UI + "New Team" + Roster/Program tabs

**Files:**
- Create: `src/components/coach/TeamSwitcher.tsx`
- Modify: `src/app/(app)/coach/page.tsx`
- Modify: `src/components/coach/CoachDashboard.tsx`
- Modify: `src/styles/coach.css`

**Interfaces:**
- Consumes: Task 2's `useTeam()` shape.
- Produces: `CoachDashboard` now takes `{ teams, activeTeam, onSelectTeam, onCreateTeam, regenerateInviteCode, onTeamChange }` instead of `{ team, onTeamChange }`. Adds a Roster/Program tab switch — the `ProgramEditor` (Task 8) plugs into the Program tab; until Task 8 lands, render a placeholder `<p className="muted">Program editor coming soon.</p>` in that tab so this task is independently testable.

- [ ] **Step 1: `TeamSwitcher` component**

```tsx
"use client";

import { Plus } from "lucide-react";
import { FormEvent, useState } from "react";

import { Team } from "@/types";

export function TeamSwitcher({
  teams,
  activeTeamId,
  onSelect,
  onCreateTeam
}: {
  teams: Team[];
  activeTeamId: string;
  onSelect: (teamId: string) => void;
  onCreateTeam: (name: string) => Promise<boolean>;
}) {
  const [showNewTeamForm, setShowNewTeamForm] = useState(false);
  const [newTeamName, setNewTeamName] = useState("");
  const [creating, setCreating] = useState(false);

  async function handleCreate(event: FormEvent) {
    event.preventDefault();
    if (!newTeamName.trim() || creating) return;

    setCreating(true);
    const ok = await onCreateTeam(newTeamName.trim());
    setCreating(false);

    if (ok) {
      setNewTeamName("");
      setShowNewTeamForm(false);
    }
  }

  return (
    <div className="team-switcher">
      {teams.length > 1 && (
        <select
          className="team-switcher-select"
          value={activeTeamId}
          onChange={(event) => onSelect(event.target.value)}
        >
          {teams.map((team) => (
            <option key={team.id} value={team.id}>
              {team.name}
            </option>
          ))}
        </select>
      )}

      <button
        type="button"
        className="ghost team-switcher-new"
        onClick={() => setShowNewTeamForm((current) => !current)}
      >
        <Plus size={14} /> New Team
      </button>

      {showNewTeamForm && (
        <form className="team-switcher-new-form" onSubmit={handleCreate}>
          <input
            value={newTeamName}
            onChange={(event) => setNewTeamName(event.target.value)}
            placeholder="Team name, ex: JV Girls"
            autoFocus
          />
          <button type="submit" disabled={!newTeamName.trim() || creating}>
            {creating ? "Creating…" : "Create"}
          </button>
        </form>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Wire `coach/page.tsx`**

Replace the file's contents with:

```tsx
"use client";

import { Users } from "lucide-react";

import { CoachDashboard } from "@/components/coach/CoachDashboard";
import { TeamSetup } from "@/components/coach/TeamSetup";
import { useTeam } from "@/hooks/useTeam";

import "@/styles/coach.css";

export default function CoachPage() {
  const {
    loading,
    teams,
    activeTeam,
    role,
    error,
    removalNotice,
    createTeam,
    joinTeam,
    regenerateInviteCode,
    selectTeam,
    refresh
  } = useTeam();

  if (loading) {
    return (
      <div className="panel">
        <p className="muted">Loading your team...</p>
      </div>
    );
  }

  if (teams.length === 0 || !activeTeam || !role) {
    return <TeamSetup onCreateTeam={createTeam} onJoinTeam={joinTeam} error={error} notice={removalNotice} />;
  }

  if (role === "coach") {
    return (
      <CoachDashboard
        teams={teams}
        activeTeam={activeTeam}
        onSelectTeam={selectTeam}
        onCreateTeam={createTeam}
        regenerateInviteCode={regenerateInviteCode}
        onTeamChange={refresh}
      />
    );
  }

  return (
    <div className="panel">
      <h2>
        <Users size={22} /> {activeTeam.name}
      </h2>
      <p className="muted">
        You&apos;re on this team as an athlete. Your coach can see your recovery stats and
        training history to check in on you -- your data stays read-only to them.
      </p>
    </div>
  );
}
```

- [ ] **Step 3: Wire `CoachDashboard.tsx`**

Change the component signature and remove its own internal `useTeam()` call (it previously called `useTeam()` a second time just for `regenerateInviteCode` — now that's passed in as a prop from the single call in `coach/page.tsx`):

Replace:

```tsx
import { useCoachRoster } from "@/hooks/useCoachRoster";
import { useTeam } from "@/hooks/useTeam";
import { formatLastActive } from "@/lib/time";
import { RosterAthlete, Team } from "@/types";
import { ConfirmModal } from "@/components/shared/ConfirmModal";

import { AthleteStatsModal } from "./AthleteStatsModal";

function recoverySlug(label: string) {
  return label.toLowerCase();
}

export function CoachDashboard({ team, onTeamChange }: { team: Team; onTeamChange?: () => void }) {
  const { loading, roster, flagged, error, removeAthlete, refresh } = useCoachRoster(team);
  const { regenerateInviteCode } = useTeam();
  const [copied, setCopied] = useState(false);
```

with:

```tsx
import { useState } from "react";

import { useCoachRoster } from "@/hooks/useCoachRoster";
import { formatLastActive } from "@/lib/time";
import { RosterAthlete, Team } from "@/types";
import { ConfirmModal } from "@/components/shared/ConfirmModal";

import { AthleteStatsModal } from "./AthleteStatsModal";
import { ProgramEditor } from "./ProgramEditor";
import { TeamSwitcher } from "./TeamSwitcher";

function recoverySlug(label: string) {
  return label.toLowerCase();
}

export function CoachDashboard({
  teams,
  activeTeam,
  onSelectTeam,
  onCreateTeam,
  regenerateInviteCode,
  onTeamChange
}: {
  teams: Team[];
  activeTeam: Team;
  onSelectTeam: (teamId: string) => void;
  onCreateTeam: (name: string) => Promise<boolean>;
  regenerateInviteCode: (teamId: string) => Promise<boolean>;
  onTeamChange?: () => void;
}) {
  const team = activeTeam;
  const { loading, roster, flagged, error, removeAthlete, refresh } = useCoachRoster(team);
  const [activeTab, setActiveTab] = useState<"roster" | "program">("roster");
  const [copied, setCopied] = useState(false);
```

(Note: `useState` was previously imported from `"react"` alongside other hooks — check the existing import line at the top of the file and merge rather than duplicate; if the file already has `import { useState } from "react";`, don't add a second one.)

Update `handleRegenerateCode` to pass the team id:

Replace:

```tsx
  async function handleRegenerateCode() {
    if (regenerating) return;
    setRegenerating(true);
    const ok = await regenerateInviteCode();
    setRegenerating(false);
```

with:

```tsx
  async function handleRegenerateCode() {
    if (regenerating) return;
    setRegenerating(true);
    const ok = await regenerateInviteCode(team.id);
    setRegenerating(false);
```

Add the switcher and tabs. Replace the opening of the returned JSX:

```tsx
  return (
    <div className="coach-dashboard">
      <div className="panel team-header">
        <div>
          <h2>
            <Users size={22} /> {team.name}
          </h2>
```

with:

```tsx
  return (
    <div className="coach-dashboard">
      <TeamSwitcher teams={teams} activeTeamId={team.id} onSelect={onSelectTeam} onCreateTeam={onCreateTeam} />

      <div className="tabs">
        <button
          type="button"
          className={activeTab === "roster" ? "" : "ghost"}
          onClick={() => setActiveTab("roster")}
        >
          Roster
        </button>
        <button
          type="button"
          className={activeTab === "program" ? "" : "ghost"}
          onClick={() => setActiveTab("program")}
        >
          Program
        </button>
      </div>

      {activeTab === "program" && <ProgramEditor team={team} />}

      {activeTab === "roster" && (
      <>
      <div className="panel team-header">
        <div>
          <h2>
            <Users size={22} /> {team.name}
          </h2>
```

And close the new conditional block right before the component's final closing tags. Find the end of the existing JSX:

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
    </div>
  );
}
```

and change it to:

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
      </>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Create a placeholder `ProgramEditor` so this task compiles and is independently testable**

```tsx
"use client";

import { Team } from "@/types";

export function ProgramEditor({ team }: { team: Team }) {
  return (
    <div className="panel">
      <p className="muted">Program editor for {team.name} coming soon.</p>
    </div>
  );
}
```

(Task 8 replaces this file's contents with the real editor. Committing a placeholder here keeps this task's diff reviewable on its own.)

- [ ] **Step 5: Styling**

In `src/styles/coach.css`, add:

```css
.team-switcher {
  display: flex;
  align-items: center;
  gap: var(--sp-3);
  margin-bottom: var(--sp-4);
  flex-wrap: wrap;
}

.team-switcher-select {
  min-width: 200px;
}

.team-switcher-new {
  font-size: var(--fs-sm);
  padding: 8px 14px;
  min-height: auto;
}

.team-switcher-new-form {
  display: flex;
  gap: var(--sp-2);
  align-items: center;
}

.team-switcher-new-form input {
  min-width: 200px;
}
```

- [ ] **Step 6: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 7: Verify live**

Apply Task 1's `schema_v26_multi_team_coach.sql` in the Supabase SQL Editor first (ask the human to confirm this is done before proceeding). Then, with `npm run dev` running and signed in as `TEST_COACH_EMAIL` (from `scripts/playwright-verify/env.mjs`):
1. Go to `/coach`. Confirm no switcher `<select>` appears (only one team) but the "+ New Team" button does.
2. Click "+ New Team", create a second team ("JV Verify Team"). Confirm the dashboard now shows a switcher `<select>` with both team names.
3. Switch between the two teams via the dropdown. Confirm the roster panel and invite code update to match the selected team.
4. Click the "Program" tab. Confirm the placeholder text renders without errors.
5. Sign in as `TEST_ATHLETE_EMAIL` in a separate context, confirm they still see exactly one team with no switcher.

- [ ] **Step 8: Commit**

```bash
git add src/components/coach/TeamSwitcher.tsx src/components/coach/ProgramEditor.tsx "src/app/(app)/coach/page.tsx" src/components/coach/CoachDashboard.tsx src/styles/coach.css
git commit -m "feat: add team switcher, new-team flow, and Roster/Program tabs to coach dashboard"
```

---

## Task 4: `plan_tier` column

**Files:**
- Create: `supabase/schema_v27_team_plan_tier.sql`

- [ ] **Step 1: Write the migration**

```sql
-- Volleyball Tracker V27 schema (team plan tier)
-- Run this once in the Supabase SQL Editor, after schema_v26_multi_team_coach.sql.
-- Safe to re-run.

alter table public.teams
  add column if not exists plan_tier text not null default 'pilot';

alter table public.teams
  drop constraint if exists teams_plan_tier_check;
alter table public.teams
  add constraint teams_plan_tier_check check (plan_tier in ('pilot', 'paid'));

-- No billing integration yet. To manually mark a team as paid (e.g. once a
-- coach converts during the pilot), run:
--   update public.teams set plan_tier = 'paid' where id = '<team-uuid>';
-- Find the team's id via: select id, name from public.teams where name = '<team name>';
```

- [ ] **Step 2: Verify live**

Note in your report that this must be run in the Supabase SQL Editor before Task 6 can be live-verified.

- [ ] **Step 3: Commit**

```bash
git add supabase/schema_v27_team_plan_tier.sql
git commit -m "feat: add plan_tier column to teams"
```

---

## Task 5: `team_exercise_defaults` schema

**Files:**
- Create: `supabase/schema_v28_team_exercise_defaults.sql`

- [ ] **Step 1: Write the migration**

```sql
-- Volleyball Tracker V28 schema (team-wide exercise defaults, free tier)
-- Run this once in the Supabase SQL Editor, after schema_v27_team_plan_tier.sql.
-- Safe to re-run.

create table if not exists public.team_exercise_defaults (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams (id) on delete cascade,
  original_exercise text not null,
  chosen_exercise text not null,
  updated_at timestamptz not null default now(),
  unique (team_id, original_exercise)
);

alter table public.team_exercise_defaults enable row level security;

drop policy if exists "team members can view team defaults" on public.team_exercise_defaults;
create policy "team members can view team defaults" on public.team_exercise_defaults
  for select using (
    exists (
      select 1 from public.team_members
      where team_members.team_id = team_exercise_defaults.team_id
        and team_members.user_id = auth.uid()
    )
  );

drop policy if exists "coach can manage team defaults" on public.team_exercise_defaults;
create policy "coach can manage team defaults" on public.team_exercise_defaults
  for all using (
    public.is_team_coach(team_exercise_defaults.team_id)
  ) with check (
    public.is_team_coach(team_exercise_defaults.team_id)
  );
```

- [ ] **Step 2: Commit**

```bash
git add supabase/schema_v28_team_exercise_defaults.sql
git commit -m "feat: add team_exercise_defaults table for free-tier preset exercises"
```

---

## Task 6: `team_day_overrides` schema (paid tier)

**Files:**
- Create: `supabase/schema_v29_team_day_overrides.sql`

- [ ] **Step 1: Write the migration**

```sql
-- Volleyball Tracker V29 schema (team full-day program overrides, paid tier)
-- Run this once in the Supabase SQL Editor, after schema_v28_team_exercise_defaults.sql.
-- Safe to re-run.

create table if not exists public.team_day_overrides (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams (id) on delete cascade,
  phase text not null check (phase in ('foundation', 'build', 'power', 'taper')),
  day text not null,
  exercises text[] not null,
  updated_at timestamptz not null default now(),
  unique (team_id, phase, day)
);

alter table public.team_day_overrides enable row level security;

drop policy if exists "team members can view day overrides" on public.team_day_overrides;
create policy "team members can view day overrides" on public.team_day_overrides
  for select using (
    exists (
      select 1 from public.team_members
      where team_members.team_id = team_day_overrides.team_id
        and team_members.user_id = auth.uid()
    )
  );

-- Gated to plan_tier = 'paid' at the RLS layer, not just hidden in the UI --
-- a free-tier coach's client can't write here even if they bypass the UI.
drop policy if exists "paid coach can manage day overrides" on public.team_day_overrides;
create policy "paid coach can manage day overrides" on public.team_day_overrides
  for all using (
    public.is_team_coach(team_day_overrides.team_id)
    and exists (
      select 1 from public.teams
      where teams.id = team_day_overrides.team_id and teams.plan_tier = 'paid'
    )
  ) with check (
    public.is_team_coach(team_day_overrides.team_id)
    and exists (
      select 1 from public.teams
      where teams.id = team_day_overrides.team_id and teams.plan_tier = 'paid'
    )
  );
```

- [ ] **Step 2: Commit**

```bash
git add supabase/schema_v29_team_day_overrides.sql
git commit -m "feat: add team_day_overrides table for paid-tier full program editing"
```

---

## Task 7: Resolution utility + `TrackerContext` wiring

**Files:**
- Create: `src/lib/programResolution.ts`
- Modify: `src/data/workoutPlan.ts`
- Modify: `src/context/TrackerContext.tsx`

**Interfaces:**
- Produces: `phaseSlug(week): "foundation"|"build"|"power"|"taper"`, `TeamOverrideData` type, `resolveWorkoutDays(days, week, team, substitutions): WorkoutDay[]`, `getWorkoutDaysForPhase(phase)`. `useTrackerContext()` gains `teamOverride: TeamOverrideData | null`.

- [ ] **Step 1: `programResolution.ts`**

```ts
import { WorkoutDay } from "@/types";

export type PhaseSlug = "foundation" | "build" | "power" | "taper";

export type TeamOverrideData = {
  planTier: "pilot" | "paid";
  exerciseDefaults: Record<string, string>;
  dayOverrides: Record<string, string[]>;
};

export function phaseSlug(week: number): PhaseSlug {
  if (week <= 4) return "foundation";
  if (week <= 8) return "build";
  if (week <= 16) return "power";
  return "taper";
}

export function dayOverrideKey(phase: PhaseSlug, day: string) {
  return `${phase}-${day}`;
}

/**
 * Resolution order: athlete's personal substitution -> team's full day edit
 * (paid tier only, if that day has one) -> team's per-exercise preset
 * default (pilot tier only, if set) -> the plan's original exercise.
 */
export function resolveWorkoutDays(
  days: WorkoutDay[],
  week: number,
  team: TeamOverrideData | null,
  substitutions: Record<string, string>
): WorkoutDay[] {
  if (!team) {
    return days.map((day) => ({
      ...day,
      exercises: day.exercises.map((exercise) => substitutions[exercise] ?? exercise)
    }));
  }

  const phase = phaseSlug(week);

  return days.map((day) => {
    const fullOverride =
      team.planTier === "paid" ? team.dayOverrides[dayOverrideKey(phase, day.day)] : undefined;

    const teamResolved =
      fullOverride ??
      day.exercises.map((exercise) =>
        team.planTier === "pilot" && team.exerciseDefaults[exercise]
          ? team.exerciseDefaults[exercise]
          : exercise
      );

    return {
      ...day,
      exercises: teamResolved.map((exercise) => substitutions[exercise] ?? exercise)
    };
  });
}
```

- [ ] **Step 2: `getWorkoutDaysForPhase` in `workoutPlan.ts`**

Add, right after the existing `getWorkoutDays` function:

```ts
const PHASE_REPRESENTATIVE_WEEK: Record<"foundation" | "build" | "power" | "taper", number> = {
  foundation: 1,
  build: 5,
  power: 9,
  taper: 17
};

export function getWorkoutDaysForPhase(phase: "foundation" | "build" | "power" | "taper"): WorkoutDay[] {
  return getWorkoutDays(PHASE_REPRESENTATIVE_WEEK[phase]);
}
```

- [ ] **Step 3: Extend `TrackerContext.tsx`**

Add the import at the top of the file:

```ts
import { TeamOverrideData } from "@/lib/programResolution";
```

Add to the `TrackerContextValue` type (right after the `clearSubstitution` line, around line 164):

```ts
  teamOverride: TeamOverrideData | null;
```

Add state (right after the existing `substitutions` state, around line 199):

```ts
  const [teamOverride, setTeamOverride] = useState<TeamOverrideData | null>(null);
```

Add `"team_members"` to the Promise.all destructure and query list. Replace:

```ts
      const [
        checksRes,
        logsRes,
        notesRes,
        latestRes,
        historyRes,
        calendarRes,
        prsRes,
        sessionsRes,
        substitutionsRes
      ] = await Promise.all([
```

with:

```ts
      const [
        checksRes,
        logsRes,
        notesRes,
        latestRes,
        historyRes,
        calendarRes,
        prsRes,
        sessionsRes,
        substitutionsRes,
        teamMemberRes
      ] = await Promise.all([
```

and add the new query as the last element of that `Promise.all` array, right after the existing `exercise_substitutions` query:

```ts
        supabase
          .from("exercise_substitutions")
          .select("original_exercise, chosen_exercise")
          .eq("user_id", userId),
        supabase.from("team_members").select("team_id").eq("user_id", userId).maybeSingle()
      ]);
```

After the existing `setSubstitutions(substitutionsMap);` line, add the second-stage team fetch (mirrors this file's existing pattern of a conditional follow-up fetch after the main `Promise.all`, used for calendar event defaults a few lines below):

```ts
      const teamId = teamMemberRes.data?.team_id ?? null;
      if (teamId) {
        const [teamRes, defaultsRes, overridesRes] = await Promise.all([
          supabase.from("teams").select("plan_tier").eq("id", teamId).maybeSingle(),
          supabase
            .from("team_exercise_defaults")
            .select("original_exercise, chosen_exercise")
            .eq("team_id", teamId),
          supabase.from("team_day_overrides").select("phase, day, exercises").eq("team_id", teamId)
        ]);

        if (!cancelled) {
          const exerciseDefaults: Record<string, string> = {};
          (defaultsRes.data ?? []).forEach((row) => {
            exerciseDefaults[row.original_exercise] = row.chosen_exercise;
          });

          const dayOverrides: Record<string, string[]> = {};
          (overridesRes.data ?? []).forEach((row) => {
            dayOverrides[`${row.phase}-${row.day}`] = row.exercises;
          });

          setTeamOverride({
            planTier: (teamRes.data?.plan_tier as "pilot" | "paid") ?? "pilot",
            exerciseDefaults,
            dayOverrides
          });
        }
      } else if (!cancelled) {
        setTeamOverride(null);
      }
```

Place this block right after `setSubstitutions(substitutionsMap);` and before the `const workoutDates = new Set(...)` block.

Finally, add `teamOverride` to the returned `value` object (right after `clearSubstitution,` in the object built near the bottom of `TrackerProvider`):

```ts
    clearSubstitution,
    teamOverride,
```

- [ ] **Step 4: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 5: Verify live**

Run `npm run dev`, sign in as `TEST_ATHLETE_EMAIL`, open the browser devtools Network tab, reload `/dashboard`. Confirm a `team_members` request fires (as part of the batch) and no console errors appear. `teamOverride` won't visibly change anything yet (no call sites use it until Task 8) — this step only confirms the fetch doesn't break the existing load.

- [ ] **Step 6: Commit**

```bash
git add src/lib/programResolution.ts src/data/workoutPlan.ts src/context/TrackerContext.tsx
git commit -m "feat: add team-override resolution utility and fetch it in TrackerContext"
```

---

## Task 8: Wire resolution into every workout-day call site

**Files:**
- Modify: `src/hooks/useWorkoutProgress.ts`
- Modify: `src/components/workouts/WorkoutGrid.tsx`
- Modify: `src/components/dashboard/DashboardCards.tsx`
- Modify: `src/components/workout/StartWorkoutScreen.tsx`
- Modify: `src/components/workout/ActiveWorkoutView.tsx`
- Modify: `src/hooks/useActiveWorkoutSession.ts`

**Interfaces:**
- Consumes: `resolveWorkoutDays` and `teamOverride` from Task 7.
- Does NOT touch: `src/components/workouts/DayCard.tsx` or the existing `resolveExercise`/`useExerciseSubstitutions` calls in `ActiveWorkoutView.tsx`/`useActiveWorkoutSession.ts`. Those apply personal substitution as a pure lookup keyed by the *original* exercise name; running an already team-resolved name back through them is a harmless no-op (the map won't have an entry for the already-substituted name), so leaving them in place is correct and lower-risk than removing them.

- [ ] **Step 1: `useWorkoutProgress.ts`**

Replace:

```ts
import { useMemo } from "react";

import { getWorkoutDays } from "@/data/workoutPlan";
import { useTrackerContext } from "@/context/TrackerContext";

export function useWorkoutProgress() {
  const { week, setWeek, checked, toggleExercise } = useTrackerContext();

  const workoutDays = useMemo(() => getWorkoutDays(week), [week]);
```

with:

```ts
import { useMemo } from "react";

import { getWorkoutDays } from "@/data/workoutPlan";
import { resolveWorkoutDays } from "@/lib/programResolution";
import { useTrackerContext } from "@/context/TrackerContext";

export function useWorkoutProgress() {
  const { week, setWeek, checked, toggleExercise, teamOverride, substitutions } = useTrackerContext();

  const workoutDays = useMemo(
    () => resolveWorkoutDays(getWorkoutDays(week), week, teamOverride, substitutions),
    [week, teamOverride, substitutions]
  );
```

- [ ] **Step 2: `WorkoutGrid.tsx`**

Replace:

```tsx
import { getWorkoutDays } from "@/data/workoutPlan";
import { useWorkoutProgress } from "@/hooks/useWorkoutProgress";
import { todayName } from "@/lib/storage";

import { DayCard } from "./DayCard";

export function WorkoutGrid() {
  const today = todayName();
  const { week } = useWorkoutProgress();
  const workoutDays = getWorkoutDays(week);
```

with:

```tsx
import { useWorkoutProgress } from "@/hooks/useWorkoutProgress";
import { todayName } from "@/lib/storage";

import { DayCard } from "./DayCard";

export function WorkoutGrid() {
  const today = todayName();
  const { workoutDays } = useWorkoutProgress();
```

(`useWorkoutProgress` already computes the resolved days from Step 1 — `WorkoutGrid` no longer needs its own `getWorkoutDays` import or a separate `week` variable.)

- [ ] **Step 3: `DashboardCards.tsx`**

Replace:

```tsx
import { useTrackerContext } from "@/context/TrackerContext";
import { getWorkoutDays } from "@/data/workoutPlan";
import { useRecoveryStats } from "@/hooks/useRecoveryStats";
import { usePRs } from "@/hooks/usePRs";
import { useWorkoutProgress } from "@/hooks/useWorkoutProgress";
import { todayName } from "@/lib/storage";
```

with:

```tsx
import { useTrackerContext } from "@/context/TrackerContext";
import { resolveWorkoutDays } from "@/lib/programResolution";
import { getWorkoutDays } from "@/data/workoutPlan";
import { useRecoveryStats } from "@/hooks/useRecoveryStats";
import { usePRs } from "@/hooks/usePRs";
import { useWorkoutProgress } from "@/hooks/useWorkoutProgress";
import { todayName } from "@/lib/storage";
```

Replace:

```tsx
  const { workoutStreak } = useTrackerContext();

  const { recovery, status, hasLoggedStats } = useRecoveryStats();
  const { week, completedExercises, totalExercises, progress } = useWorkoutProgress();
  const { latestPR } = usePRs();

  const todayWorkout = getWorkoutDays(week).find((day) => day.day === today);
```

with:

```tsx
  const { workoutStreak, teamOverride, substitutions } = useTrackerContext();

  const { recovery, status, hasLoggedStats } = useRecoveryStats();
  const { week, completedExercises, totalExercises, progress } = useWorkoutProgress();
  const { latestPR } = usePRs();

  const todayWorkout = resolveWorkoutDays(getWorkoutDays(week), week, teamOverride, substitutions).find(
    (day) => day.day === today
  );
```

- [ ] **Step 4: `StartWorkoutScreen.tsx`**

Replace:

```tsx
import { getPrescription, getWorkoutDays } from "@/data/workoutPlan";
import { useStartWorkout } from "@/hooks/useStartWorkout";
import { useTrackerContext } from "@/context/TrackerContext";
import { todayName } from "@/lib/storage";

export function StartWorkoutScreen() {
  const { week } = useTrackerContext();
  const { loading, starting, openSession, startWorkout, resumeWorkout } = useStartWorkout();
  const [selectedDay, setSelectedDay] = useState(todayName());

  const workoutDays = getWorkoutDays(week);
```

with:

```tsx
import { getPrescription, getWorkoutDays } from "@/data/workoutPlan";
import { resolveWorkoutDays } from "@/lib/programResolution";
import { useStartWorkout } from "@/hooks/useStartWorkout";
import { useTrackerContext } from "@/context/TrackerContext";
import { todayName } from "@/lib/storage";

export function StartWorkoutScreen() {
  const { week, teamOverride, substitutions } = useTrackerContext();
  const { loading, starting, openSession, startWorkout, resumeWorkout } = useStartWorkout();
  const [selectedDay, setSelectedDay] = useState(todayName());

  const workoutDays = resolveWorkoutDays(getWorkoutDays(week), week, teamOverride, substitutions);
```

- [ ] **Step 5: `ActiveWorkoutView.tsx`**

Add the import:

```tsx
import { resolveWorkoutDays } from "@/lib/programResolution";
import { useTrackerContext } from "@/context/TrackerContext";
```

(add both to the existing import block near the top of the file, alongside `getPrescription, getWorkoutDays` from `@/data/workoutPlan`).

Inside the component, find where `resolveExercise` is obtained (`const { resolveExercise } = useExerciseSubstitutions();`) and add, right after it:

```tsx
  const { teamOverride, substitutions } = useTrackerContext();
```

Replace:

```tsx
  const day = useMemo(
    () => (session ? getWorkoutDays(session.week).find((d) => d.day === session.day) : undefined),
    [session]
  );
```

with:

```tsx
  const day = useMemo(
    () =>
      session
        ? resolveWorkoutDays(getWorkoutDays(session.week), session.week, teamOverride, substitutions).find(
            (d) => d.day === session.day
          )
        : undefined,
    [session, teamOverride, substitutions]
  );
```

- [ ] **Step 6: `useActiveWorkoutSession.ts`**

Add the import:

```ts
import { resolveWorkoutDays } from "@/lib/programResolution";
```

Replace:

```ts
  const { userId, setExerciseChecked, addPR, reportSyncError } = useTrackerContext();
```

with:

```ts
  const { userId, setExerciseChecked, addPR, reportSyncError, teamOverride, substitutions } = useTrackerContext();
```

Replace:

```ts
    let cancelled = false;
    const day = getWorkoutDays(session.week).find((d) => d.day === session.day);
    if (!day) return;
```

with:

```ts
    let cancelled = false;
    const day = resolveWorkoutDays(getWorkoutDays(session.week), session.week, teamOverride, substitutions).find(
      (d) => d.day === session.day
    );
    if (!day) return;
```

Check the `useEffect`'s dependency array right below this block (a few lines down, at `}, [supabase, ...]);` for this specific effect) and add `teamOverride, substitutions` to it if `session` is already listed there — match the existing dependency-array style in this file rather than guessing at exact placement.

- [ ] **Step 7: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 8: Verify live**

Run `npm run dev`, sign in as `TEST_ATHLETE_EMAIL`. Visit `/dashboard`, `/workouts`, and start/view an active workout session. Confirm exercise names render exactly as before (no team overrides exist yet, so behavior must be unchanged byte-for-byte from before this task).

- [ ] **Step 9: Commit**

```bash
git add src/hooks/useWorkoutProgress.ts src/components/workouts/WorkoutGrid.tsx src/components/dashboard/DashboardCards.tsx src/components/workout/StartWorkoutScreen.tsx src/components/workout/ActiveWorkoutView.tsx src/hooks/useActiveWorkoutSession.ts
git commit -m "feat: layer team program overrides into every workout-day call site"
```

---

## Task 9: `useTeamProgram` hook (coach-side data access)

**Files:**
- Create: `src/hooks/useTeamProgram.ts`

**Interfaces:**
- Consumes: `team_exercise_defaults`, `team_day_overrides` tables.
- Produces: `useTeamProgram(team: Team)` returning `{ loading, exerciseDefaults, dayOverrides, setExerciseDefault(original, chosen), clearExerciseDefault(original), setDayOverride(phase, day, exercises), resetDayOverride(phase, day) }` — this is the coach-authoring counterpart to the athlete-side `teamOverride` read in `TrackerContext`; it lives separately because only the `ProgramEditor` (coach UI) needs write access, and coupling it into `TrackerContext` would fetch/write coach-only data for every athlete session.

- [ ] **Step 1: Write the hook**

```ts
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { createClient } from "@/lib/supabase/client";
import { PhaseSlug } from "@/lib/programResolution";
import { Team } from "@/types";

export function useTeamProgram(team: Team) {
  const supabase = useMemo(() => createClient(), []);

  const [loading, setLoading] = useState(true);
  const [exerciseDefaults, setExerciseDefaults] = useState<Record<string, string>>({});
  const [dayOverrides, setDayOverrides] = useState<Record<string, string[]>>({});
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    const [defaultsRes, overridesRes] = await Promise.all([
      supabase
        .from("team_exercise_defaults")
        .select("original_exercise, chosen_exercise")
        .eq("team_id", team.id),
      supabase.from("team_day_overrides").select("phase, day, exercises").eq("team_id", team.id)
    ]);

    if (defaultsRes.error || overridesRes.error) {
      console.error("Failed to load team program", defaultsRes.error ?? overridesRes.error);
      setError("Couldn't load this team's program. Try again.");
      setLoading(false);
      return;
    }

    const nextDefaults: Record<string, string> = {};
    (defaultsRes.data ?? []).forEach((row) => {
      nextDefaults[row.original_exercise] = row.chosen_exercise;
    });
    setExerciseDefaults(nextDefaults);

    const nextOverrides: Record<string, string[]> = {};
    (overridesRes.data ?? []).forEach((row) => {
      nextOverrides[`${row.phase}-${row.day}`] = row.exercises;
    });
    setDayOverrides(nextOverrides);

    setLoading(false);
  }, [supabase, team.id]);

  useEffect(() => {
    load();
  }, [load]);

  async function setExerciseDefault(original: string, chosen: string) {
    setError(null);
    const { error: upsertError } = await supabase
      .from("team_exercise_defaults")
      .upsert(
        { team_id: team.id, original_exercise: original, chosen_exercise: chosen },
        { onConflict: "team_id,original_exercise" }
      );

    if (upsertError) {
      setError("Couldn't save that default. Try again.");
      return false;
    }

    await load();
    return true;
  }

  async function clearExerciseDefault(original: string) {
    setError(null);
    const { error: deleteError } = await supabase
      .from("team_exercise_defaults")
      .delete()
      .eq("team_id", team.id)
      .eq("original_exercise", original);

    if (deleteError) {
      setError("Couldn't clear that default. Try again.");
      return false;
    }

    await load();
    return true;
  }

  async function setDayOverride(phase: PhaseSlug, day: string, exercises: string[]) {
    setError(null);
    const { error: upsertError } = await supabase
      .from("team_day_overrides")
      .upsert(
        { team_id: team.id, phase, day, exercises },
        { onConflict: "team_id,phase,day" }
      );

    if (upsertError) {
      setError("Couldn't save this day's program. Try again.");
      return false;
    }

    await load();
    return true;
  }

  async function resetDayOverride(phase: PhaseSlug, day: string) {
    setError(null);
    const { error: deleteError } = await supabase
      .from("team_day_overrides")
      .delete()
      .eq("team_id", team.id)
      .eq("phase", phase)
      .eq("day", day);

    if (deleteError) {
      setError("Couldn't reset this day. Try again.");
      return false;
    }

    await load();
    return true;
  }

  return {
    loading,
    error,
    exerciseDefaults,
    dayOverrides,
    setExerciseDefault,
    clearExerciseDefault,
    setDayOverride,
    resetDayOverride
  };
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: no errors (this hook has no callers yet until Task 10 — that's expected, an unused export is not a compile error).

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useTeamProgram.ts
git commit -m "feat: add useTeamProgram hook for coach-side program data access"
```

---

## Task 10: Program editor — Part 2 (free-tier preset picker)

**Files:**
- Modify: `src/components/coach/ProgramEditor.tsx` (replaces the Task 3 placeholder)
- Modify: `src/styles/coach.css`

**Interfaces:**
- Consumes: `useTeamProgram` (Task 9), `getWorkoutDaysForPhase` (Task 7), `getSubstitutionCandidates` (existing, from `src/hooks/useExerciseSubstitutions.ts` — reused unmodified, per the source spec's explicit instruction to limit the preset picker to each exercise's existing curated substitution list).

- [ ] **Step 1: Replace the placeholder**

```tsx
"use client";

import { useState } from "react";

import { getWorkoutDaysForPhase } from "@/data/workoutPlan";
import { getSubstitutionCandidates } from "@/hooks/useExerciseSubstitutions";
import { useTeamProgram } from "@/hooks/useTeamProgram";
import { PhaseSlug } from "@/lib/programResolution";
import { Team } from "@/types";

const PHASES: { slug: PhaseSlug; label: string }[] = [
  { slug: "foundation", label: "Foundation" },
  { slug: "build", label: "Build" },
  { slug: "power", label: "Power" },
  { slug: "taper", label: "Taper" }
];

export function ProgramEditor({ team }: { team: Team }) {
  const { loading, error, exerciseDefaults, setExerciseDefault, clearExerciseDefault } = useTeamProgram(team);
  const [activePhase, setActivePhase] = useState<PhaseSlug>("foundation");

  if (loading) {
    return (
      <div className="panel">
        <p className="muted">Loading program...</p>
      </div>
    );
  }

  const days = getWorkoutDaysForPhase(activePhase).filter((day) => !day.rest);

  return (
    <div className="program-editor">
      <div className="tabs program-phase-tabs">
        {PHASES.map((phase) => (
          <button
            key={phase.slug}
            type="button"
            className={activePhase === phase.slug ? "" : "ghost"}
            onClick={() => setActivePhase(phase.slug)}
          >
            {phase.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="empty-state">
          <p className="muted">{error}</p>
        </div>
      )}

      {days.map((day) => (
        <div className="panel program-day-card" key={day.day}>
          <h3>{day.day} -- {day.title}</h3>

          <div className="program-exercise-list">
            {day.exercises.map((exercise) => {
              const current = exerciseDefaults[exercise] ?? exercise;
              const candidates = getSubstitutionCandidates(exercise);

              return (
                <div className="program-exercise-row" key={exercise}>
                  <span className="program-exercise-original muted">{exercise}</span>
                  <select
                    value={current}
                    onChange={(event) => {
                      const chosen = event.target.value;
                      if (chosen === exercise) {
                        clearExerciseDefault(exercise);
                      } else {
                        setExerciseDefault(exercise, chosen);
                      }
                    }}
                  >
                    <option value={exercise}>{exercise} (original)</option>
                    {candidates.map((candidate) => (
                      <option key={candidate.name} value={candidate.name}>
                        {candidate.name}
                      </option>
                    ))}
                  </select>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Add `getSubstitutionCandidates` export check**

Confirm `getSubstitutionCandidates` is already exported from `src/hooks/useExerciseSubstitutions.ts` (it is, per the existing file: `export function getSubstitutionCandidates(...)`). No change needed there.

- [ ] **Step 3: Styling**

In `src/styles/coach.css`, add:

```css
.program-editor {
  display: grid;
  gap: var(--sp-4);
}

.program-phase-tabs {
  margin: 0 0 var(--sp-2);
}

.program-day-card h3 {
  font-size: var(--fs-lg);
  margin: 0 0 var(--sp-3);
}

.program-exercise-list {
  display: grid;
  gap: var(--sp-2);
}

.program-exercise-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--sp-3);
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: var(--sp-2) var(--sp-3);
}

.program-exercise-original {
  flex: 1 1 auto;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.program-exercise-row select {
  flex: 0 0 auto;
  min-width: 200px;
}
```

- [ ] **Step 4: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 5: Verify live**

Apply Task 4/5's SQL first. With `npm run dev` running, sign in as `TEST_COACH_EMAIL`, go to `/coach` → Program tab. Confirm all 4 phases are browsable, each showing non-rest days with a dropdown per exercise. Pick a substitution for one exercise, confirm it persists across a page reload. Then sign in as `TEST_ATHLETE_EMAIL` on that team, visit `/workouts`, and confirm the substituted exercise now appears there instead of the original (this is the first real end-to-end proof the resolution pipeline from Task 8 works).

- [ ] **Step 6: Commit**

```bash
git add src/components/coach/ProgramEditor.tsx src/styles/coach.css
git commit -m "feat: add free-tier team exercise preset picker to Program tab"
```

---

## Task 11: Program editor — Part 3 (paid-tier full day editor)

**Files:**
- Modify: `src/components/coach/ProgramEditor.tsx`
- Modify: `src/styles/coach.css`

**Interfaces:**
- Consumes: `team.plan_tier`, `useTeamProgram`'s `dayOverrides`/`setDayOverride`, the full `exercises` catalog (`src/data/exercises.ts`) for the "add any exercise" picker.

- [ ] **Step 1: Add the full editor, gated by `plan_tier`**

Add the import:

```tsx
import { exercises as exerciseCatalog } from "@/data/exercises";
```

Add `dayOverrides` and `setDayOverride` to the `useTeamProgram` destructure:

```tsx
  const { loading, error, exerciseDefaults, setExerciseDefault, clearExerciseDefault, dayOverrides, setDayOverride } =
    useTeamProgram(team);
```

Add a small editable-list component in the same file, above `ProgramEditor`:

```tsx
function DayFullEditor({
  phase,
  day,
  baseExercises,
  currentExercises,
  onSave
}: {
  phase: PhaseSlug;
  day: string;
  baseExercises: string[];
  currentExercises: string[];
  onSave: (exercises: string[]) => void;
}) {
  const [draft, setDraft] = useState<string[]>(currentExercises);
  const [addChoice, setAddChoice] = useState("");
  const isEdited = JSON.stringify(currentExercises) !== JSON.stringify(baseExercises);

  function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= draft.length) return;
    const next = [...draft];
    [next[index], next[target]] = [next[target], next[index]];
    setDraft(next);
  }

  function remove(index: number) {
    setDraft(draft.filter((_, i) => i !== index));
  }

  function addExercise() {
    if (!addChoice || draft.includes(addChoice)) return;
    setDraft([...draft, addChoice]);
    setAddChoice("");
  }

  return (
    <div className="program-full-editor">
      <ul className="program-full-editor-list">
        {draft.map((exercise, index) => (
          <li key={exercise}>
            <span>{exercise}</span>
            <div className="program-full-editor-controls">
              <button type="button" className="ghost" onClick={() => move(index, -1)} disabled={index === 0}>
                Up
              </button>
              <button
                type="button"
                className="ghost"
                onClick={() => move(index, 1)}
                disabled={index === draft.length - 1}
              >
                Down
              </button>
              <button type="button" className="ghost danger-button" onClick={() => remove(index)}>
                Remove
              </button>
            </div>
          </li>
        ))}
      </ul>

      <div className="program-full-editor-add">
        <select value={addChoice} onChange={(event) => setAddChoice(event.target.value)}>
          <option value="">Add an exercise...</option>
          {exerciseCatalog
            .filter((exercise) => !draft.includes(exercise.name))
            .map((exercise) => (
              <option key={exercise.name} value={exercise.name}>
                {exercise.name}
              </option>
            ))}
        </select>
        <button type="button" className="ghost" onClick={addExercise} disabled={!addChoice}>
          Add
        </button>
      </div>

      <div className="program-full-editor-actions">
        <button type="button" onClick={() => onSave(draft)} disabled={draft.length === 0}>
          Save {day}
        </button>
        {isEdited && (
          <button type="button" className="ghost" onClick={() => onSave(baseExercises)}>
            Reset {day} to default
          </button>
        )}
      </div>
    </div>
  );
}
```

Replace the `days.map((day) => ...)` block inside `ProgramEditor`'s return with a version that branches on `team.plan_tier`:

```tsx
      {days.map((day) => {
        const overrideKey = `${activePhase}-${day.day}`;
        const currentExercises = dayOverrides[overrideKey] ?? day.exercises;

        return (
          <div className="panel program-day-card" key={day.day}>
            <h3>{day.day} -- {day.title}</h3>

            {team.plan_tier === "paid" ? (
              <DayFullEditor
                phase={activePhase}
                day={day.day}
                baseExercises={day.exercises}
                currentExercises={currentExercises}
                onSave={(exercises) => setDayOverride(activePhase, day.day, exercises)}
              />
            ) : (
              <>
                <p className="muted program-paid-gate">
                  Full day editing (add, remove, and reorder any exercise) is a paid-plan feature.
                  The preset picker below is available on every plan.
                </p>
                <div className="program-exercise-list">
                  {day.exercises.map((exercise) => {
                    const current = exerciseDefaults[exercise] ?? exercise;
                    const candidates = getSubstitutionCandidates(exercise);

                    return (
                      <div className="program-exercise-row" key={exercise}>
                        <span className="program-exercise-original muted">{exercise}</span>
                        <select
                          value={current}
                          onChange={(event) => {
                            const chosen = event.target.value;
                            if (chosen === exercise) {
                              clearExerciseDefault(exercise);
                            } else {
                              setExerciseDefault(exercise, chosen);
                            }
                          }}
                        >
                          <option value={exercise}>{exercise} (original)</option>
                          {candidates.map((candidate) => (
                            <option key={candidate.name} value={candidate.name}>
                              {candidate.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        );
      })}
```

- [ ] **Step 2: Styling**

In `src/styles/coach.css`, add:

```css
.program-paid-gate {
  margin: 0 0 var(--sp-3);
  font-size: var(--fs-sm);
}

.program-full-editor-list {
  list-style: none;
  margin: 0 0 var(--sp-3);
  padding: 0;
  display: grid;
  gap: var(--sp-2);
}

.program-full-editor-list li {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--sp-3);
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: var(--sp-2) var(--sp-3);
}

.program-full-editor-controls {
  display: flex;
  gap: var(--sp-2);
}

.program-full-editor-controls button {
  font-size: var(--fs-xs);
  padding: 6px 10px;
  min-height: auto;
}

.program-full-editor-add {
  display: flex;
  gap: var(--sp-2);
  margin-bottom: var(--sp-3);
}

.program-full-editor-actions {
  display: flex;
  gap: var(--sp-3);
}
```

- [ ] **Step 3: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Verify live**

With the free-tier team from Task 10 still on `plan_tier = 'pilot'`, confirm the Program tab still shows the paid-gate message + preset picker (unchanged from Task 10). Then, in the Supabase SQL Editor, run `update public.teams set plan_tier = 'paid' where id = '<that team's id>';`. Reload `/coach` → Program tab as the coach. Confirm the full editor now renders instead of the gated message: remove an exercise, reorder two, add one from the catalog, save. Sign in as the athlete on that team and confirm `/workouts` shows exactly that edited list for the corresponding day.

- [ ] **Step 5: Commit**

```bash
git add src/components/coach/ProgramEditor.tsx src/styles/coach.css
git commit -m "feat: add paid-tier full day program editor"
```

---

## Task 12: Guardrails — category-coverage warning + reset action

**Files:**
- Modify: `src/components/coach/ProgramEditor.tsx`
- Modify: `src/styles/coach.css`

**Interfaces:**
- Consumes: `exercises` catalog (`src/data/exercises.ts`) for each exercise's `category`.

- [ ] **Step 1: Add a pure category-coverage check**

Add near the top of `ProgramEditor.tsx`, above the component:

```tsx
const PROTECTIVE_CATEGORIES: Exercise["category"][] = ["Shoulder Health", "Landing Mechanics", "Knee Strength"];

function missingProtectiveCategories(baseExercises: string[], currentExercises: string[]): string[] {
  const categoryOf = new Map(exerciseCatalog.map((exercise) => [exercise.name, exercise.category]));

  const baseCategories = new Set(baseExercises.map((name) => categoryOf.get(name)).filter(Boolean));
  const currentCategories = new Set(currentExercises.map((name) => categoryOf.get(name)).filter(Boolean));

  return PROTECTIVE_CATEGORIES.filter(
    (category) => baseCategories.has(category) && !currentCategories.has(category)
  );
}
```

Add the `Exercise` type import:

```tsx
import { Exercise } from "@/types";
```

- [ ] **Step 2: Surface the warning in `DayFullEditor`**

Add a prop and render it. Update `DayFullEditor`'s props and body:

```tsx
function DayFullEditor({
  phase,
  day,
  baseExercises,
  currentExercises,
  onSave
}: {
  phase: PhaseSlug;
  day: string;
  baseExercises: string[];
  currentExercises: string[];
  onSave: (exercises: string[]) => void;
}) {
  const [draft, setDraft] = useState<string[]>(currentExercises);
  const [addChoice, setAddChoice] = useState("");
  const isEdited = JSON.stringify(currentExercises) !== JSON.stringify(baseExercises);
  const missingCategories = missingProtectiveCategories(baseExercises, draft);
```

Add, right before the `.program-full-editor-actions` div (after the "Add an exercise" section):

```tsx
      {missingCategories.length > 0 && (
        <p className="program-guardrail-warning">
          Heads up: this day no longer has any {missingCategories.join(" or ")} exercise
          {missingCategories.length > 1 ? "s" : ""}, which the original plan included here. This
          isn&apos;t blocked -- just worth a second look before saving.
        </p>
      )}
```

- [ ] **Step 3: The reset action already exists from Task 11**

Task 11's `DayFullEditor` already renders a "Reset {day} to default" button when `isEdited` is true, calling `onSave(baseExercises)` which (via `ProgramEditor`'s `onSave={(exercises) => setDayOverride(...)}`) writes the base exercises back as the override. Change this to actually delete the override row instead of writing a duplicate of the base plan, so `resolveWorkoutDays` falls back to the plan cleanly rather than carrying a redundant override forever.

Add `resetDayOverride` to the `useTeamProgram` destructure in `ProgramEditor`:

```tsx
  const {
    loading,
    error,
    exerciseDefaults,
    setExerciseDefault,
    clearExerciseDefault,
    dayOverrides,
    setDayOverride,
    resetDayOverride
  } = useTeamProgram(team);
```

Add an `onReset` prop to `DayFullEditor` and use it instead of `onSave(baseExercises)`:

```tsx
function DayFullEditor({
  phase,
  day,
  baseExercises,
  currentExercises,
  onSave,
  onReset
}: {
  phase: PhaseSlug;
  day: string;
  baseExercises: string[];
  currentExercises: string[];
  onSave: (exercises: string[]) => void;
  onReset: () => void;
}) {
```

Replace:

```tsx
        {isEdited && (
          <button type="button" className="ghost" onClick={() => onSave(baseExercises)}>
            Reset {day} to default
          </button>
        )}
```

with:

```tsx
        {isEdited && (
          <button type="button" className="ghost" onClick={onReset}>
            Reset {day} to default
          </button>
        )}
```

And update the call site in `ProgramEditor`:

```tsx
              <DayFullEditor
                phase={activePhase}
                day={day.day}
                baseExercises={day.exercises}
                currentExercises={currentExercises}
                onSave={(exercises) => setDayOverride(activePhase, day.day, exercises)}
                onReset={() => resetDayOverride(activePhase, day.day)}
              />
```

- [ ] **Step 4: Styling**

In `src/styles/coach.css`, add:

```css
.program-guardrail-warning {
  margin: 0 0 var(--sp-3);
  padding: var(--sp-2) var(--sp-3);
  border: 1px solid rgba(255, 196, 0, 0.35);
  background: rgba(255, 196, 0, 0.06);
  border-radius: var(--radius-md);
  color: var(--gold);
  font-size: var(--fs-sm);
}
```

- [ ] **Step 5: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 6: Verify live**

As the paid-tier coach from Task 11, remove every Shoulder Health exercise from a day that originally had one (e.g. Wednesday's "Upper Body Foundation + Core" in Foundation phase, which includes "Face Pulls" and "Y-T-W Raises", both Shoulder Health). Confirm the warning banner appears listing "Shoulder Health" and does NOT block the Save button. Save, reload, confirm the warning re-derives correctly from the saved state. Click "Reset to default" and confirm the day reverts and the warning disappears.

- [ ] **Step 7: Commit**

```bash
git add src/components/coach/ProgramEditor.tsx src/styles/coach.css
git commit -m "feat: add injury-prevention category guardrail and clean reset-to-default"
```

---

## Task 13: Full live verification (both features together)

**Files:** none (verification only)

- [ ] **Step 1: Static checks**

```bash
npx tsc --noEmit
npm run build
```

Expected: both exit 0.

- [ ] **Step 2: End-to-end resolution-order check**

With `npm run dev` running:
1. As a coach on a `plan_tier = 'pilot'` team, set a preset default for one exercise (Part 2).
2. As an athlete on that team with NO personal substitution set, confirm `/workouts` shows the team's preset.
3. As that same athlete, set a personal substitution for that same exercise (via the existing substitution picker in `DayCard`/`ActiveWorkoutView`).
4. Confirm `/workouts` now shows the athlete's PERSONAL choice, not the team preset -- proving "most specific wins."
5. Upgrade that team to `plan_tier = 'paid'` via SQL, and as the coach, fully edit that same day (Part 3) to remove the exercise entirely.
6. Confirm the athlete now sees the coach's full-edit day layout, EXCEPT wherever their personal substitution still applies to an exercise that remains in the edited list.

- [ ] **Step 3: Multi-team isolation check**

As the coach with two teams (from the earlier multi-team task), set different presets on each team. Confirm switching the active team in the dashboard shows each team's own preset picker state, and that athletes on Team A never see Team B's overrides.

- [ ] **Step 4: Report results**

Summarize pass/fail for each check above. If anything fails, do not mark this task complete -- report BLOCKED with specifics.

- [ ] **Step 5: No commit for this task** (verification only; if any bugs were found and fixed along the way, those fixes should already be committed as part of whichever task they belonged to).

---

## Self-Review Notes

- **Spec coverage:** multi-team schema + RPCs (Task 1), useTeam list model (Task 2), switcher/new-team/tabs UI (Task 3), plan_tier (Task 4), team_exercise_defaults (Task 5), team_day_overrides (Task 6), resolution utility + context wiring (Task 7), all 6 real call sites (Task 8), coach-side data hook (Task 9), Part 2 preset UI (Task 10), Part 3 full editor + paid gate (Task 11), guardrail warning + clean reset (Task 12), end-to-end verification (Task 13) — all covered.
- **Explicit exclusion, and why:** `src/hooks/useAthleteAdherence.ts`'s `countPlannedExercises()` (a season-wide exercise-count denominator for a coach-facing adherence percentage) is deliberately left untouched. It was flagged in research as a 7th `getWorkoutDays` call site, but it's a coach-side aggregate stat, not "the athlete's current workout day" that the source spec asked to be layered -- team overrides changing this denominator slightly is an acceptable, out-of-scope approximation, not a bug this plan introduces.
- **`create_team`'s existing-membership check was corrected, not left as the source spec described it:** the spec said "no change needed to the function logic itself," but the actual SQL blocks creation on ANY existing `team_members` row regardless of role, which would make multi-team-per-coach impossible to use. Task 1 narrows that check to athletes only. This is flagged here for visibility, not silently changed.
- **Order matters:** Task 1 before Task 2 (schema before hook). Task 2 before Task 3 (hook before UI). Tasks 4-6 (schema) can run in any relative order to each other but must all land before Task 7 (context wiring queries all three new tables). Task 7 before Task 8 (utility must exist before call sites use it). Task 9 before Task 10 (data hook before the UI that calls it). Task 10 before Task 11 (placeholder-free editor before the paid branch is added to it). Task 11 before Task 12 (the reset button Task 12 modifies must already exist).
