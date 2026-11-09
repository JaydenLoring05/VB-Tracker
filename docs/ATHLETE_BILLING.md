# Athlete plan billing (Stripe)

NextRep sells one athlete plan at **$14.99/month** with a 7-day free trial (card up front). After the trial, the app is locked for athletes who aren't on a team until they subscribe.

An **annual plan is built but switched off** (`ANNUAL_PLAN_ON = false` in `src/lib/billing.ts`). Jayden is keeping $14.99/month for now and raising the price later. To change the price or turn annual on, see "Changing the price later" below.

Athletes who sign up with a friend's referral code get 14 trial days instead of 7 (RF-01). Coach team billing is separate (see `BILLING.md`).

The prices shown in the app live in `src/lib/billing.ts` (`MONTHLY_PRICE_CENTS`, `ANNUAL_PRICE_CENTS`). **Stripe charges whatever its own Price objects say**, so if you change one, change the other to match.

Billing stays off (Settings says "Payments open soon") until the four required variables below are set.

## Checklist

Do every step in **test mode** first (the toggle at the top of the Stripe dashboard). Repeat it in live mode once a test checkout works end to end.

1. **Create the account.** Sign up at stripe.com, then fill in the business details and the bank account for payouts. Live mode unlocks once Stripe verifies them; test mode works right away.
2. **Create the product.** If you already have the $14.99 price, skip this step. Otherwise go to Product catalog → Add product → name it "NextRep Athlete", then add a recurring price of **$14.99 USD every month**. Copy its ID (`price_…`): this is `STRIPE_PRICE_ID`.

   Don't set a trial on the price; the app adds the trial at checkout.
3. **Get the API key.** Go to Developers → API keys → Secret key (`sk_test_…` in test mode). This is `STRIPE_SECRET_KEY`.
4. **Add the webhook.** Go to Developers → Webhooks → Add endpoint.
   - URL: `https://joinnextrep.com/api/billing/webhook`
   - Events: `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`
   - Copy the signing secret (`whsec_…`). This is `STRIPE_WEBHOOK_SECRET`.
5. **Turn on the Customer Portal.** Go to Settings → Billing → Customer portal and turn it on. Allow:
   - canceling;
   - updating the payment method;
   - once annual is on: switching plans between the two prices, so athletes can move between monthly and annual from "Manage plan".
6. **Make a billing secret.** Make up a long random string, for example from `openssl rand -hex 32`. This is `BILLING_SECRET`. In the Supabase SQL Editor, store its hash (the webhook only writes to the database when it knows the secret):

   ```sql
   insert into private.cron_secrets (name, secret_hash)
   values ('billing', encode(extensions.digest('<your BILLING_SECRET>', 'sha256'), 'hex'))
   on conflict (name) do update set secret_hash = excluded.secret_hash;
   ```

7. **Add the variables in Vercel.** Go to Settings → Environment Variables and add all five, then redeploy:

   | Variable | Required | From |
   | --- | --- | --- |
   | `STRIPE_SECRET_KEY` | yes | step 3 |
   | `STRIPE_PRICE_ID` | yes | step 2, the monthly price |
   | `STRIPE_ANNUAL_PRICE_ID` | not yet | only once annual is switched on (see below) |
   | `STRIPE_WEBHOOK_SECRET` | yes | step 4 |
   | `BILLING_SECRET` | yes | step 6 |

8. **Test it.**
   - Sign in as an athlete who isn't on a team. Today should show "Start your free trial".
   - Start 7-day free trial.
   - Pay with the test card `4242 4242 4242 4242`, any future date and any CVC.
   - Back in Settings, the status should read "Free trial · Monthly · trial ends …", and Today should open normally.
   - In Supabase, check the athlete's row:

     ```sql
     select status, plan, trial_ends_at from public.athlete_billing order by updated_at desc limit 5;
     ```

9. **Go live.** Switch Stripe to live mode, repeat steps 2–5 there (live IDs and secrets are different), and replace the Vercel variables with the live values.

## Changing the price later

To raise the monthly price (for example to $29.95):
1. In Stripe, add a new monthly price on the same product.
2. In Vercel, point `STRIPE_PRICE_ID` at it.
3. In `src/lib/billing.ts`, set `MONTHLY_PRICE_CENTS` to match (`2995`). The landing page, Settings and the tests read from there.

To turn on the annual plan:
1. In `src/lib/billing.ts`, set `ANNUAL_PLAN_ON = true` and `ANNUAL_PRICE_CENTS` to the yearly price. It defaults to six months' worth, which is "save 50%".
2. Create that yearly price in Stripe and add `STRIPE_ANNUAL_PRICE_ID` in Vercel.
3. In the Customer Portal settings, allow switching between the two prices.

The landing page then shows both cards (annual first, with the struck-through yearly total and "Save 50%"), and Settings shows the Annual / Monthly choice.

New checkouts use whatever `STRIPE_PRICE_ID` / `STRIPE_ANNUAL_PRICE_ID` point to. People who already subscribed **stay on the price they signed up at**, because Stripe doesn't move existing subscriptions. Move them in the Stripe dashboard if you want to.

## Database

- `athlete_billing`: one row per athlete. Created in `schema_v57_athlete_billing.sql`; the `plan` column was added in `schema_v65_billing_plan.sql`.
- Rows change only through `apply_billing_update`, which the webhook calls with `BILLING_SECRET`.
