-- NextRep V65 schema (monthly or annual athlete plan, P-02)
-- Run this once in the Supabase SQL Editor, after schema_v64_referrals.sql
-- (it changes apply_billing_update from schema_v57). Safe to re-run.
--
-- 1. athlete_billing.plan: 'monthly' or 'annual', from the Stripe
--    subscription's price interval. Null for rows from before this file and
--    until Stripe sends a subscription event.
-- 2. apply_billing_update gains p_plan (default null, so a null keeps the
--    stored plan). The old 7-argument version is dropped so there is one.
--    Until this runs, /api/billing/webhook falls back to the old call and
--    only the plan goes unrecorded.

alter table public.athlete_billing
  add column if not exists plan text;

alter table public.athlete_billing drop constraint if exists athlete_billing_plan_check;
alter table public.athlete_billing add constraint athlete_billing_plan_check
  check (plan is null or plan in ('monthly', 'annual'));

drop function if exists public.apply_billing_update(text, uuid, text, text, text, timestamptz, timestamptz);

create or replace function public.apply_billing_update(
  p_secret text,
  p_user_id uuid,
  p_customer_id text,
  p_subscription_id text,
  p_status text,
  p_trial_ends_at timestamptz,
  p_current_period_end timestamptz,
  p_plan text default null
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
    (user_id, stripe_customer_id, stripe_subscription_id, status, trial_ends_at, current_period_end, plan, updated_at)
  values
    (p_user_id, p_customer_id, p_subscription_id, coalesce(p_status, 'none'), p_trial_ends_at, p_current_period_end, p_plan, now())
  on conflict (user_id) do update set
    stripe_customer_id = coalesce(excluded.stripe_customer_id, b.stripe_customer_id),
    stripe_subscription_id = coalesce(excluded.stripe_subscription_id, b.stripe_subscription_id),
    status = excluded.status,
    trial_ends_at = coalesce(excluded.trial_ends_at, b.trial_ends_at),
    current_period_end = coalesce(excluded.current_period_end, b.current_period_end),
    plan = coalesce(excluded.plan, b.plan),
    updated_at = now();
end;
$$;

revoke all on function public.apply_billing_update(text, uuid, text, text, text, timestamptz, timestamptz, text) from public;
grant execute on function public.apply_billing_update(text, uuid, text, text, text, timestamptz, timestamptz, text) to anon, authenticated;

-- Check: should return 1.
-- select count(*) from information_schema.columns
-- where table_schema = 'public' and table_name = 'athlete_billing' and column_name = 'plan';
