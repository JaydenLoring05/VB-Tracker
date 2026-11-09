# Athlete plan billing (Stripe)

NextRep sells one athlete plan, either monthly or annual, both with a 7-day free trial:

| Plan | Price | Shown as |
| --- | --- | --- |
| Monthly | $29.95/month | "Less than $1 a day" |
| Annual | $179.70/year | ~~$359.40~~, "That's $14.98/month", "Save 50%" |

Athletes who sign up with a friend's referral code get 14 trial days instead of 7 (RF-01). Coach team billing is separate (see `BILLING.md`).

The prices shown in the app live in `src/lib/billing.ts` (`MONTHLY_PRICE_CENTS`, `ANNUAL_PRICE_CENTS`). **Stripe charges whatever its own Price objects say**, so if you change one, change the other to match.

Billing stays off (Settings says "Payments open soon") until the four required variables below are set.

## Checklist

Do every step in **test mode** first (the toggle at the top of the Stripe dashboard). Repeat it in live mode once a test checkout works end to end.

1. **Create the account.** Sign up at stripe.com, then fill in the business details and the bank account for payouts. Live mode unlocks once Stripe verifies them; test mode works right away.
2. **Create the product.** Go to Product catalog → Add product → name it "NextRep Athlete", then add two prices:
   - Recurring, **$29.95 USD every month**. Copy its ID (`price_…`): this is `STRIPE_PRICE_ID`.
   - Recurring, **$179.70 USD every year**. Copy its ID: this is `STRIPE_ANNUAL_PRICE_ID`.

   Don't set a trial on the prices; the app adds the trial at checkout.
3. **Get the API key.** Go to Developers → API keys → Secret key (`sk_test_…` in test mode). This is `STRIPE_SECRET_KEY`.
4. **Add the webhook.** Go to Developers → Webhooks → Add endpoint.
   - URL: `https://joinnextrep.com/api/billing/webhook`
   - Events: `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`
   - Copy the signing secret (`whsec_…`). This is `STRIPE_WEBHOOK_SECRET`.
5. **Turn on the Customer Portal.** Go to Settings → Billing → Customer portal and turn it on. Allow:
   - canceling;
   - updating the payment method;
   - **switching plans between the two prices**, so athletes can move between monthly and annual from "Manage plan".
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
   | `STRIPE_ANNUAL_PRICE_ID` | for annual | step 2, the annual price. Without it, only monthly is sold |
   | `STRIPE_WEBHOOK_SECRET` | yes | step 4 |
   | `BILLING_SECRET` | yes | step 6 |

8. **Test it.**
   - Settings → pick Annual → Start 7-day free trial.
   - Pay with the test card `4242 4242 4242 4242`, any future date and any CVC.
   - Back in Settings, the status should read "Free trial · Annual · trial ends …".
   - In Supabase, check the athlete's row:

     ```sql
     select status, plan, trial_ends_at from public.athlete_billing order by updated_at desc limit 5;
     ```

9. **Go live.** Switch Stripe to live mode, repeat steps 2–5 there (live IDs and secrets are different), and replace the Vercel variables with the live values.

## Changing the price later

New checkouts use whatever `STRIPE_PRICE_ID` / `STRIPE_ANNUAL_PRICE_ID` point to. People who already subscribed **stay on the price they signed up at**, because Stripe doesn't move existing subscriptions. Move them in the Stripe dashboard if you want to.

## Database

- `athlete_billing`: one row per athlete. Created in `schema_v57_athlete_billing.sql`; the `plan` column was added in `schema_v65_billing_plan.sql`.
- Rows change only through `apply_billing_update`, which the webhook calls with `BILLING_SECRET`.
