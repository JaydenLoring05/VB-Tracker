-- Volleyball Tracker V36 schema (film tag details: who made the play and how good it was)
-- Run this once in the Supabase SQL Editor, after schema_v35_team_film.sql.
-- Safe to re-run.

alter table public.film_tags
  add column if not exists athlete_id uuid references auth.users (id) on delete set null,
  add column if not exists pass_rating smallint,
  add column if not exists set_zone text,
  add column if not exists set_type text,
  add column if not exists block_outcome text,
  add column if not exists attack_direction text;

-- Detail value checks. Dropped first so re-running stays idempotent.
alter table public.film_tags drop constraint if exists film_tags_pass_rating_check;
alter table public.film_tags add constraint film_tags_pass_rating_check
  check (pass_rating is null or pass_rating between 0 and 3);

alter table public.film_tags drop constraint if exists film_tags_set_zone_check;
alter table public.film_tags add constraint film_tags_set_zone_check
  check (set_zone is null or set_zone in ('1', '2', '3', '4', '5', '6'));

alter table public.film_tags drop constraint if exists film_tags_set_type_check;
alter table public.film_tags add constraint film_tags_set_type_check
  check (set_type is null or set_type in ('4', '5', 'slide', 'pipe', 'back_row', 'quick', 'dump'));

alter table public.film_tags drop constraint if exists film_tags_block_outcome_check;
alter table public.film_tags add constraint film_tags_block_outcome_check
  check (block_outcome is null or block_outcome in ('stuff', 'touch', 'tooled', 'missed'));

alter table public.film_tags drop constraint if exists film_tags_attack_direction_check;
alter table public.film_tags add constraint film_tags_attack_direction_check
  check (attack_direction is null or attack_direction in ('line', 'cross', 'seam', 'tip', 'roll'));

-- Replace the V35 inline tag check (auto-named film_tags_tag_check) so it
-- also allows 'pass'. All 8 original values are kept.
alter table public.film_tags drop constraint if exists film_tags_tag_check;
alter table public.film_tags add constraint film_tags_tag_check
  check (tag in ('kill', 'error', 'block', 'dig', 'ace', 'serve_error', 'set', 'note', 'pass'));

-- A CHECK constraint can't look at another table, so team membership of
-- the tagged athlete is enforced with a trigger. security definer lets it
-- read team_members regardless of the caller's RLS view.
create or replace function public.film_tags_check_athlete_member()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.athlete_id is not null and not exists (
    select 1 from public.team_members
    where team_members.team_id = new.team_id
      and team_members.user_id = new.athlete_id
  ) then
    raise exception 'athlete % is not a member of team %', new.athlete_id, new.team_id
      using errcode = '23514';
  end if;
  return new;
end;
$$;

drop trigger if exists film_tags_check_athlete_member on public.film_tags;
create trigger film_tags_check_athlete_member
  before insert or update of athlete_id, team_id on public.film_tags
  for each row execute function public.film_tags_check_athlete_member();

create index if not exists film_tags_team_athlete_idx on public.film_tags (team_id, athlete_id);

-- RLS is unchanged: the V35 policies already gate every write on
-- is_team_coach(film_tags.team_id), so athletes stay read-only.
