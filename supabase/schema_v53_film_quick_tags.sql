-- Volleyball Tracker V53 schema (film made simple: three-tap tags)
-- Run this once in the Supabase SQL Editor, after schema_v52_guardian_info.sql.
-- Safe to re-run.
--
-- The three-tap flow saves athlete + skill + result. The skill goes in the
-- existing `tag` column, which needs two new values ('serve', 'attack'),
-- and the result goes in a new `result` column. Pass ratings and block
-- outcomes are still written to pass_rating / block_outcome too, so older
-- screens and film stats (F-01) read them the same way.

alter table public.film_tags
  add column if not exists result text;

alter table public.film_tags drop constraint if exists film_tags_result_check;
alter table public.film_tags add constraint film_tags_result_check
  check (result is null or result in (
    'ace', 'in', 'error',
    '3', '2', '1', '0',
    'good', 'ok',
    'kill', 'in_play',
    'stuff', 'touch',
    'up'
  ));

-- Replace the V36 tag check so it also allows 'serve' and 'attack'. All 9
-- earlier values are kept.
alter table public.film_tags drop constraint if exists film_tags_tag_check;
alter table public.film_tags add constraint film_tags_tag_check
  check (tag in ('kill', 'error', 'block', 'dig', 'ace', 'serve_error', 'set', 'note', 'pass', 'serve', 'attack'));

-- "My clips": an athlete loads every tag about them across the team's film.
-- film_tags_team_athlete_idx from V36 already covers (team_id, athlete_id).

-- RLS is unchanged: team members can read, only the team's coach can write.
