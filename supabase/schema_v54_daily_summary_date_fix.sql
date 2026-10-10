-- Volleyball Tracker V54 schema (daily coach summary: fix the date comparison)
-- Run this once in the Supabase SQL Editor, after schema_v53_film_quick_tags.sql.
-- Safe to re-run.
--
-- Fixes "operator does not exist: text = date" from /api/daily-summary.
--
-- public.daily_summary_data() (schema_v47) looked up today's team events with
--   e.date = p_today
-- but team_calendar_events.date is a text column holding "YYYY-MM-DD"
-- (schema_v33) and p_today is a date. Postgres has no operator that compares
-- text with date, so every call failed and no summary email was sent.
--
-- This replaces the function with the same body and one changed line: p_today
-- is written out as "YYYY-MM-DD" text before the comparison. to_char is used
-- (not a plain cast) so the result does not depend on the DateStyle setting.
-- Nothing else changes: same arguments, same secret check, same result, and
-- no table is altered. The stored cron secret hash is left as it is.

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
        where e.team_id = t.id and e.date = to_char(p_today, 'YYYY-MM-DD')
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
