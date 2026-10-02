-- Volleyball Tracker V47 schema (daily coach summary email)
-- Run this once in the Supabase SQL Editor, after schema_v46_delete_my_account.sql.
-- Safe to re-run.
--
-- 1. profiles.daily_summary_opt_in: a coach turns the morning email on from
--    their dashboard. Off by default; nobody is emailed without opting in.
-- 2. private.cron_secrets: the SHA-256 hash of the cron secret. The schema is
--    not exposed through the API and no role but the owner can read it.
-- 3. public.daily_summary_data(p_secret, p_today): returns, for every coach
--    who opted in, their team's roster numbers. It runs as the function owner
--    (it has to read across every opted-in team, which no single user's RLS
--    allows), so it refuses to return anything unless p_secret hashes to the
--    stored value. The /api/daily-summary route passes CRON_SECRET, which only
--    Vercel Cron and you know. No service-role key is involved.
--
-- After running this file, store the hash of your CRON_SECRET (see the PR):
--   insert into private.cron_secrets (name, secret_hash)
--   values ('daily_summary', encode(extensions.digest('<your CRON_SECRET>', 'sha256'), 'hex'))
--   on conflict (name) do update set secret_hash = excluded.secret_hash;

create extension if not exists pgcrypto with schema extensions;

alter table public.profiles
  add column if not exists daily_summary_opt_in boolean not null default false;

create schema if not exists private;
revoke all on schema private from public;
revoke all on schema private from anon, authenticated;

create table if not exists private.cron_secrets (
  name text primary key,
  secret_hash text not null,
  updated_at timestamptz not null default now()
);
revoke all on private.cron_secrets from public;
revoke all on private.cron_secrets from anon, authenticated;

create or replace function public.daily_summary_data(p_secret text, p_today date)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_hash text;
begin
  select secret_hash into v_hash from private.cron_secrets where name = 'daily_summary';
  if v_hash is null or p_secret is null
     or encode(extensions.digest(p_secret, 'sha256'), 'hex') <> v_hash then
    raise exception 'not authorized';
  end if;

  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'team_id', t.id,
      'team_name', t.name,
      'coach_email', u.email,
      'coach_name', p.display_name,
      'team_program_days', (
        select tp.days
        from public.team_program_assignments a
        join public.team_programs tp on tp.id = a.program_id
        where a.team_id = t.id and a.scope = 'team'
        limit 1
      ),
      'today_events', coalesce((
        select jsonb_agg(jsonb_build_object('type', e.type, 'title', e.title) order by e.title)
        from public.team_calendar_events e
        where e.team_id = t.id and e.date = p_today
      ), '[]'::jsonb),
      'athletes', coalesce((
        select jsonb_agg(jsonb_build_object(
          'user_id', m.user_id,
          'display_name', m.display_name,
          'latest_stats', (select to_jsonb(ls) from public.latest_stats ls where ls.user_id = m.user_id),
          'stats_history', coalesce((
            select jsonb_agg(to_jsonb(sh) order by sh.created_at)
            from public.stats_history sh
            where sh.user_id = m.user_id and sh.created_at >= now() - interval '15 days'
          ), '[]'::jsonb),
          'completed_last7', (
            select count(*) from public.workout_sessions ws
            where ws.user_id = m.user_id and ws.ended_at >= now() - interval '7 days'
          ),
          'recent_prs', coalesce((
            select jsonb_agg(jsonb_build_object('exercise', pr.exercise, 'date', pr.created_at))
            from public.prs pr
            where pr.user_id = m.user_id and pr.created_at >= now() - interval '7 days'
          ), '[]'::jsonb)
        ))
        from public.team_members m
        where m.team_id = t.id and m.role = 'athlete'
      ), '[]'::jsonb)
    ))
    from public.teams t
    join public.profiles p on p.user_id = t.coach_id
    join auth.users u on u.id = t.coach_id
    where p.daily_summary_opt_in and u.email is not null
  ), '[]'::jsonb);
end;
$$;

revoke all on function public.daily_summary_data(text, date) from public;
grant execute on function public.daily_summary_data(text, date) to anon, authenticated;
