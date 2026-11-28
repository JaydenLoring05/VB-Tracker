-- Volleyball Tracker V57 schema (athlete plan payments, F-37)
-- Run this once in the Supabase SQL Editor, after schema_v47_daily_coach_summary.sql
-- (it reuses private.cron_secrets from there). Safe to re-run.
--
-- 1. public.athlete_billing: one row per athlete who started checkout. The
--    athlete can read their own row; nobody can write it through the API.
-- 2. public.apply_billing_update(...): the only way rows change. Called by
--    /api/billing/webhook after it has verified Stripe's signature. It runs as
--    the owner and refuses to do anything unless p_secret hashes to the
--    'billing' entry in private.cron_secrets (same pattern as the daily
--    summary). No service-role key is involved.
--
-- After running this file, store the hash of your BILLING_SECRET:
--   insert into private.cron_secrets (name, secret_hash)
--   values ('billing', encode(extensions.digest('<your BILLING_SECRET>', 'sha256'), 'hex'))
--   on conflict (name) do update set secret_hash = excluded.secret_hash;

create extension if not exists pgcrypto with schema extensions;

create table if not exists public.athlete_billing (
  user_id uuid primary key references auth.users (id) on delete cascade,
  stripe_customer_id text,
  stripe_subscription_id text,
  status text not null default 'none'
    check (status in ('none', 'trialing', 'active', 'past_due', 'canceled', 'incomplete')),
  trial_ends_at timestamptz,
  current_period_end timestamptz,
  updated_at timestamptz not null default now()
);

alter table public.athlete_billing enable row level security;

drop policy if exists "own billing" on public.athlete_billing;
create policy "own billing" on public.athlete_billing
  for select using (auth.uid() = user_id);
-- No insert/update/delete policies: only apply_billing_update writes.

create or replace function public.apply_billing_update(
  p_secret text,
  p_user_id uuid,
  p_customer_id text,
  p_subscription_id text,
  p_status text,
  p_trial_ends_at timestamptz,
  p_current_period_end timestamptz
)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_hash text;
begin
  select secret_hash into v_hash from private.cron_secrets where name = 'billing';
  if v_hash is null or p_secret is null
     or encode(extensions.digest(p_secret, 'sha256'), 'hex') <> v_hash then
    raise exception 'not authorized';
  end if;

  insert into public.athlete_billing as b
    (user_id, stripe_customer_id, stripe_subscription_id, status, trial_ends_at, current_period_end, updated_at)
  values
    (p_user_id, p_customer_id, p_subscription_id, coalesce(p_status, 'none'), p_trial_ends_at, p_current_period_end, now())
  on conflict (user_id) do update set
    stripe_customer_id = coalesce(excluded.stripe_customer_id, b.stripe_customer_id),
    stripe_subscription_id = coalesce(excluded.stripe_subscription_id, b.stripe_subscription_id),
    status = excluded.status,
    trial_ends_at = coalesce(excluded.trial_ends_at, b.trial_ends_at),
    current_period_end = coalesce(excluded.current_period_end, b.current_period_end),
    updated_at = now();
end;
$$;

revoke all on function public.apply_billing_update(text, uuid, text, text, text, timestamptz, timestamptz) from public;
grant execute on function public.apply_billing_update(text, uuid, text, text, text, timestamptz, timestamptz) to anon, authenticated;
