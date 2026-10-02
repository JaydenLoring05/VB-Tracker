# Billing (manual, for the pilot)

NextRep has no in-app billing. A team starts on the free 30-day **pilot**
(`teams.plan_tier = 'pilot'`). From day 25 the coach sees a dismissible banner
with the pilot's end date and, if you've set a payment link, a
**"Continue for $29/month"** button. After the coach pays, you move the team
to **paid** by hand with the SQL below. Nothing is ever blocked automatically:
after day 30 the banner says the pilot has ended, and everything keeps working.

The pilot covers up to 16 athletes. Past that, the coach sees a soft warning
on the dashboard; nobody is blocked.

## 1. Set up the payment link (once)

1. In Stripe (or any provider with hosted payment links), create a **$29/month
   subscription** product and a **Payment Link** for it. In Stripe:
   Product catalog → Add product → recurring, $29/month → Create payment link.
2. In Vercel → Settings → Environment Variables, set
   `NEXT_PUBLIC_PAYMENT_LINK` to that link (it must start with `https://`) and
   redeploy. Without it, the banner shows but the button is hidden.

When someone pays, Stripe emails you with the payer's email. Match it to the
coach's team below.

## 2. Move a team to paid

Run these in the Supabase SQL Editor.

Find the team (newest first):

```sql
select t.id, t.name, t.invite_code, t.plan_tier, t.created_at, u.email as coach_email
from public.teams t
join auth.users u on u.id = t.coach_id
order by t.created_at desc;
```

Move it to paid (replace the id):

```sql
update public.teams
set plan_tier = 'paid'
where id = '00000000-0000-0000-0000-000000000000';
```

Confirm:

```sql
select name, plan_tier from public.teams where id = '00000000-0000-0000-0000-000000000000';
```

The coach's banner disappears on their next page load. Paid teams also get
full day edits in the program editor (pilot teams can only swap exercises).

## Undo

```sql
update public.teams set plan_tier = 'pilot' where id = '00000000-0000-0000-0000-000000000000';
```

A team moved back to pilot sees the banner again (based on the team's
creation date), so only do this to fix a mistake.
