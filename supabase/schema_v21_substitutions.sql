create table if not exists public.exercise_substitutions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  original_exercise text not null,
  chosen_exercise text not null,
  updated_at timestamptz not null default now(),
  unique (user_id, original_exercise)
);

alter table public.exercise_substitutions enable row level security;

drop policy if exists "own rows" on public.exercise_substitutions;
create policy "own rows" on public.exercise_substitutions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
