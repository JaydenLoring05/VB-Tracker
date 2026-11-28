-- NextRep V67 schema (read-only parent and coach viewer links, P-06)
-- Run this once in the Supabase SQL Editor, after schema_v65_billing_plan.sql.
-- (Two open branches each add a schema_v66 file: P-03's onboarding quiz and
-- G-07's challenge time zone. This file doesn't depend on either.)
-- Needs the pgcrypto extension in the `extensions` schema (Supabase has it on
-- by default; schema_v47 already uses extensions.digest). Safe to re-run.
--
-- An athlete makes a private link for a parent or an outside coach. Whoever
-- opens the link sees a short read-only summary (first name, finished
-- workouts, check-in days, best jumps) with no account and no sign-in.
--  * The link carries a random 48-character token. Only its SHA-256 hash is
--    stored, so the database never holds a working link. The athlete copies
--    the link once, when it is made.
--  * The athlete can stop sharing at any time; the link stops working at once.
--  * Free for everyone: nothing here checks billing.
--  * viewer_summary() returns only what the page shows. It never returns
--    pain, sleep, soreness, weight, notes, email, or anything about the team.
--
-- Access: the athlete reads their own links. Links are only made and revoked
-- through the functions below, so a client can't pick its own token.

create table if not exists public.viewer_links (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid not null references auth.users (id) on delete cascade,
  role text not null check (role in ('parent', 'coach')),
  label text check (label is null or char_length(label) between 1 and 60),
  token_hash text not null unique,
  created_at timestamptz not null default now(),
  last_viewed_at timestamptz,
  revoked_at timestamptz
);

create index if not exists viewer_links_athlete_idx on public.viewer_links (athlete_id, created_at desc);

alter table public.viewer_links enable row level security;

drop policy if exists "own links" on public.viewer_links;
create policy "own links" on public.viewer_links
  for select using (auth.uid() = athlete_id);

-- No insert, update or delete policies: the functions below do that.
revoke insert, update, delete on public.viewer_links from anon, authenticated;

-- Make a link. Returns the raw token once; only its hash is kept.
-- At most 10 links that still work per athlete.
create or replace function public.create_viewer_link(p_role text, p_label text default null)
returns text
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_uid uuid := auth.uid();
  v_label text := nullif(btrim(coalesce(p_label, '')), '');
  v_token text;
begin
  if v_uid is null then
    raise exception 'Sign in to share your training.';
  end if;
  if p_role is null or p_role not in ('parent', 'coach') then
    raise exception 'Pick parent or coach.';
  end if;
  if v_label is not null and char_length(v_label) > 60 then
    raise exception 'Keep the name under 60 characters.';
  end if;
  if (select count(*) from public.viewer_links where athlete_id = v_uid and revoked_at is null) >= 10 then
    raise exception 'You already share with 10 people. Stop sharing with someone first.';
  end if;

  v_token := encode(extensions.gen_random_bytes(24), 'hex');
  insert into public.viewer_links (athlete_id, role, label, token_hash)
  values (v_uid, p_role, v_label, encode(extensions.digest(v_token, 'sha256'), 'hex'));
  return v_token;
end;
$$;

revoke all on function public.create_viewer_link(text, text) from public;
grant execute on function public.create_viewer_link(text, text) to authenticated;

-- Stop sharing. Only the athlete who made the link can revoke it.
create or replace function public.revoke_viewer_link(p_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count int;
begin
  update public.viewer_links
  set revoked_at = now()
  where id = p_id and athlete_id = auth.uid() and revoked_at is null;
  get diagnostics v_count = row_count;
  return v_count > 0;
end;
$$;

revoke all on function public.revoke_viewer_link(uuid) from public;
grant execute on function public.revoke_viewer_link(uuid) to authenticated;

-- What the viewer page shows. Knowing the token is the proof. Returns null
-- for an unknown or revoked link, so a wrong token learns nothing.
create or replace function public.viewer_summary(p_token text)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_link public.viewer_links%rowtype;
  v_name text;
begin
  if p_token is null or p_token !~ '^[0-9a-f]{48}$' then
    return null;
  end if;

  select * into v_link
  from public.viewer_links
  where token_hash = encode(extensions.digest(p_token, 'sha256'), 'hex')
    and revoked_at is null;
  if not found then
    return null;
  end if;

  update public.viewer_links set last_viewed_at = now() where id = v_link.id;

  -- First name only.
  select nullif(split_part(btrim(coalesce(p.display_name, '')), ' ', 1), '')
  into v_name
  from public.profiles p
  where p.user_id = v_link.athlete_id;

  return jsonb_build_object(
    'role', v_link.role,
    'name', v_name,
    -- Finished workouts in the last 35 days, newest first.
    'workouts', coalesce((
      select jsonb_agg(jsonb_build_object(
        'ended_at', w.ended_at,
        'duration_seconds', w.duration_seconds
      ) order by w.ended_at desc)
      from (
        select ws.ended_at, ws.duration_seconds
        from public.workout_sessions ws
        where ws.user_id = v_link.athlete_id
          and ws.ended_at is not null
          and ws.ended_at > now() - interval '35 days'
        order by ws.ended_at desc
        limit 60
      ) w
    ), '[]'::jsonb),
    -- When they checked in during the last 14 days (times only, no answers).
    -- A row with no sleep answer is a test-day save, not a check-in (B-09).
    'check_ins', coalesce((
      select jsonb_agg(c.created_at order by c.created_at desc)
      from (
        select sh.created_at
        from public.stats_history sh
        where sh.user_id = v_link.athlete_id
          and sh.sleep is not null
          and sh.created_at > now() - interval '14 days'
        order by sh.created_at desc
        limit 30
      ) c
    ), '[]'::jsonb),
    -- Best jumps in inches: logged jumps (v62) and older stats-form values.
    'best_vertical', (
      select max(v) from (
        select max(value_in) as v from public.jump_tests where user_id = v_link.athlete_id and kind = 'vertical'
        union all
        select max(vertical) from public.stats_history where user_id = v_link.athlete_id and vertical > 0
      ) j
    ),
    'best_approach', (
      select max(v) from (
        select max(value_in) as v from public.jump_tests where user_id = v_link.athlete_id and kind = 'approach'
        union all
        select max(approach) from public.stats_history where user_id = v_link.athlete_id and approach > 0
      ) j
    )
  );
end;
$$;

revoke all on function public.viewer_summary(text) from public;
grant execute on function public.viewer_summary(text) to anon, authenticated;

-- Check (should return true):
-- select to_regclass('public.viewer_links') is not null;
