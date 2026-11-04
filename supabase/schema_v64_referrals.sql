-- NextRep V64 schema (referral codes, RF-01)
-- Run this once in the Supabase SQL Editor, after schema_v63_weekly_challenge.sql.
-- Safe to re-run.
--
-- Every athlete and coach gets a 6-character code (no 0/O/1/I/L). A new
-- account that signs up through joinnextrep.com/join?ref=CODE is linked to
-- the code's owner in `referrals`:
--   - the new athlete gets 14 days of free trial instead of 7 at checkout
--     (src/app/api/billing/checkout reads their own referrals row);
--   - the owner gets XP and the Recruiter badge.
-- Codes are created and redeemed only through the functions below, so a
-- client can't invent a referral. Accounts older than 14 days can't redeem
-- one (no extra trial for existing users), and nobody can refer themselves.
--
-- Sign-ups per code, for Jayden:
--   select c.code, count(r.id) as signups
--   from public.referral_codes c left join public.referrals r on r.referrer_id = c.user_id
--   group by c.code order by signups desc;

create table if not exists public.referral_codes (
  user_id uuid primary key references auth.users (id) on delete cascade,
  code text not null unique check (code ~ '^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{6}$'),
  created_at timestamptz not null default now()
);

create table if not exists public.referrals (
  id uuid primary key default gen_random_uuid(),
  referrer_id uuid not null references auth.users (id) on delete cascade,
  referred_id uuid not null unique references auth.users (id) on delete cascade,
  code text not null,
  created_at timestamptz not null default now(),
  check (referrer_id <> referred_id)
);

create index if not exists referrals_referrer_idx on public.referrals (referrer_id);

alter table public.referral_codes enable row level security;
alter table public.referrals enable row level security;

-- Read-only for clients; writes only through the functions.
drop policy if exists "own code" on public.referral_codes;
create policy "own code" on public.referral_codes
  for select using (auth.uid() = user_id);

drop policy if exists "own referrals" on public.referrals;
create policy "own referrals" on public.referrals
  for select using (auth.uid() = referrer_id or auth.uid() = referred_id);

-- The caller's code, made on first use.
create or replace function public.my_referral_code()
returns text
language plpgsql
security definer
volatile
set search_path = public
as $$
declare
  v_code text;
  v_alphabet constant text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  v_try int := 0;
begin
  if auth.uid() is null then
    raise exception 'not signed in';
  end if;

  select code into v_code from public.referral_codes where user_id = auth.uid();
  if v_code is not null then
    return v_code;
  end if;

  loop
    v_try := v_try + 1;
    v_code := '';
    for i in 1..6 loop
      v_code := v_code || substr(v_alphabet, 1 + floor(random() * length(v_alphabet))::int, 1);
    end loop;
    begin
      insert into public.referral_codes (user_id, code) values (auth.uid(), v_code);
      return v_code;
    exception when unique_violation then
      -- Either this user got a code in a parallel call, or the code is taken.
      select code into v_code from public.referral_codes where user_id = auth.uid();
      if v_code is not null then
        return v_code;
      end if;
      if v_try >= 10 then
        raise exception 'could not make a referral code';
      end if;
    end;
  end loop;
end;
$$;

-- The caller's code and how many people signed up with it.
create or replace function public.my_referral_stats()
returns table (code text, signups int)
language plpgsql
security definer
volatile
set search_path = public
as $$
begin
  return query
  select public.my_referral_code(), (select count(*)::int from public.referrals r where r.referrer_id = auth.uid());
end;
$$;

-- Links the caller's new account to a code's owner.
-- Returns 'ok', 'invalid', 'self', 'already' or 'too_old'.
create or replace function public.redeem_referral(p_code text)
returns text
language plpgsql
security definer
volatile
set search_path = public
as $$
declare
  v_code text := upper(regexp_replace(coalesce(p_code, ''), '\s', '', 'g'));
  v_referrer uuid;
  v_created timestamptz;
begin
  if auth.uid() is null then
    raise exception 'not signed in';
  end if;

  select user_id into v_referrer from public.referral_codes where code = v_code;
  if v_referrer is null then
    return 'invalid';
  end if;
  if v_referrer = auth.uid() then
    return 'self';
  end if;
  if exists (select 1 from public.referrals where referred_id = auth.uid()) then
    return 'already';
  end if;

  select created_at into v_created from auth.users where id = auth.uid();
  if v_created is null or v_created < now() - interval '14 days' then
    return 'too_old';
  end if;

  insert into public.referrals (referrer_id, referred_id, code)
  values (v_referrer, auth.uid(), v_code)
  on conflict (referred_id) do nothing;
  return 'ok';
end;
$$;

revoke all on function public.my_referral_code() from public, anon;
revoke all on function public.my_referral_stats() from public, anon;
revoke all on function public.redeem_referral(text) from public, anon;
grant execute on function public.my_referral_code() to authenticated;
grant execute on function public.my_referral_stats() to authenticated;
grant execute on function public.redeem_referral(text) to authenticated;

-- Check (should return true, true, true):
-- select to_regclass('public.referral_codes') is not null,
--        to_regclass('public.referrals') is not null,
--        to_regprocedure('public.redeem_referral(text)') is not null;
