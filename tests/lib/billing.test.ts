import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";

import {
  ANNUAL_COMPARE_AT,
  ANNUAL_PER_MONTH,
  ANNUAL_SAVE_PERCENT,
  ATHLETE_PLAN,
  billingUpdateFromEvent,
  checkoutFields,
  hasPaidAccess,
  mapSubscriptionStatus,
  MONTHLY_UNDER_A_DOLLAR_A_DAY,
  parsePlanInterval,
  PLAN_OPTIONS,
  priceIdFor,
  readBillingConfig,
  stripeForm,
  verifyStripeSignature
} from "@/lib/billing";

describe("plan prices (P-02)", () => {
  it("sells $29.95/month and $179.70/year after a 7-day trial", () => {
    expect(PLAN_OPTIONS.monthly.priceLabel).toBe("$29.95/month");
    expect(PLAN_OPTIONS.annual.priceLabel).toBe("$179.70/year");
    expect(ATHLETE_PLAN.priceLabel).toBe("$29.95/month");
    expect(ATHLETE_PLAN.trialDays).toBe(7);
  });

  it("derives the annual comparison the landing page shows", () => {
    expect(ANNUAL_COMPARE_AT).toBe("$359.40");
    expect(ANNUAL_PER_MONTH).toBe("$14.98");
    expect(ANNUAL_SAVE_PERCENT).toBe(50);
    expect(MONTHLY_UNDER_A_DOLLAR_A_DAY).toBe(true);
  });

  it("treats anything but 'annual' as monthly", () => {
    expect(parsePlanInterval("annual")).toBe("annual");
    expect(parsePlanInterval("monthly")).toBe("monthly");
    expect(parsePlanInterval(undefined)).toBe("monthly");
    expect(parsePlanInterval("yearly")).toBe("monthly");
  });
});

const sign = (payload: string, secret: string, t: number) =>
  `t=${t},v1=${createHmac("sha256", secret).update(`${t}.${payload}`).digest("hex")}`;

describe("readBillingConfig", () => {
  it("stays off until every key is set", () => {
    expect(readBillingConfig({})).toBeNull();
    expect(readBillingConfig({ STRIPE_SECRET_KEY: "sk", STRIPE_PRICE_ID: "price" })).toBeNull();
    expect(
      readBillingConfig({ STRIPE_SECRET_KEY: "sk", STRIPE_PRICE_ID: "p", STRIPE_WEBHOOK_SECRET: "w", BILLING_SECRET: "b" })
    ).toEqual({ stripeSecretKey: "sk", priceId: "p", annualPriceId: null, webhookSecret: "w", billingSecret: "b" });
  });

  it("sells annual only once its price is set", () => {
    const keys = { STRIPE_SECRET_KEY: "sk", STRIPE_PRICE_ID: "p_month", STRIPE_WEBHOOK_SECRET: "w", BILLING_SECRET: "b" };
    const monthlyOnly = readBillingConfig(keys)!;
    expect(priceIdFor(monthlyOnly, "monthly")).toBe("p_month");
    expect(priceIdFor(monthlyOnly, "annual")).toBeNull();

    const both = readBillingConfig({ ...keys, STRIPE_ANNUAL_PRICE_ID: " p_year " })!;
    expect(priceIdFor(both, "annual")).toBe("p_year");
    expect(priceIdFor(both, "monthly")).toBe("p_month");
  });
});

describe("checkout", () => {
  it("asks Stripe for a subscription with a 7-day trial tied to the athlete", () => {
    const fields = checkoutFields({ priceId: "price_1", userId: "u1", email: "a@b.co", siteUrl: "https://x.app" });
    expect(fields).toMatchObject({
      mode: "subscription",
      "line_items[0][price]": "price_1",
      "subscription_data[trial_period_days]": 7,
      "subscription_data[metadata][user_id]": "u1",
      client_reference_id: "u1",
      customer_email: "a@b.co",
      success_url: "https://x.app/settings?billing=success"
    });
    expect(stripeForm({ "a[b]": "c d" })).toBe("a%5Bb%5D=c%20d");
  });

  it("gives a referred athlete one extra free week (RF-01), and only them", () => {
    const base = { priceId: "price_1", userId: "u1", email: "a@b.co", siteUrl: "https://x.app" };
    expect(checkoutFields({ ...base, referred: true })["subscription_data[trial_period_days]"]).toBe(14);
    expect(checkoutFields({ ...base, referred: false })["subscription_data[trial_period_days]"]).toBe(7);
  });
});

describe("verifyStripeSignature", () => {
  const payload = '{"id":"evt_1"}';
  it("accepts a fresh, correct signature", () => {
    expect(verifyStripeSignature(payload, sign(payload, "whsec", 1000), "whsec", 1010)).toBe(true);
  });
  it("rejects wrong secrets, edited bodies, old timestamps and missing headers", () => {
    expect(verifyStripeSignature(payload, sign(payload, "other", 1000), "whsec", 1010)).toBe(false);
    expect(verifyStripeSignature('{"id":"evt_2"}', sign(payload, "whsec", 1000), "whsec", 1010)).toBe(false);
    expect(verifyStripeSignature(payload, sign(payload, "whsec", 1000), "whsec", 2000)).toBe(false);
    expect(verifyStripeSignature(payload, null, "whsec", 1000)).toBe(false);
    expect(verifyStripeSignature(payload, "t=1000", "whsec", 1000)).toBe(false);
  });
});

describe("billingUpdateFromEvent", () => {
  it("starts the trial when checkout completes", () => {
    expect(
      billingUpdateFromEvent({
        type: "checkout.session.completed",
        data: { object: { client_reference_id: "u1", customer: "cus_1", subscription: "sub_1" } }
      })
    ).toMatchObject({ userId: "u1", customerId: "cus_1", subscriptionId: "sub_1", status: "trialing" });
  });

  it("tracks subscription changes and cancellations", () => {
    const update = billingUpdateFromEvent({
      type: "customer.subscription.updated",
      data: {
        object: { id: "sub_1", customer: "cus_1", status: "active", metadata: { user_id: "u1" }, current_period_end: 1_800_000_000 }
      }
    });
    expect(update).toMatchObject({ status: "active", currentPeriodEnd: new Date(1_800_000_000_000).toISOString() });
    expect(
      billingUpdateFromEvent({
        type: "customer.subscription.deleted",
        data: { object: { id: "sub_1", status: "active", metadata: { user_id: "u1" } } }
      })?.status
    ).toBe("canceled");
  });

  it("reads monthly or annual from the subscription's price interval (P-02)", () => {
    const withInterval = (interval?: string) =>
      billingUpdateFromEvent({
        type: "customer.subscription.created",
        data: {
          object: {
            id: "sub_1",
            status: "trialing",
            metadata: { user_id: "u1" },
            items: { data: [{ price: interval ? { recurring: { interval } } : {} }] }
          }
        }
      })?.plan;
    expect(withInterval("year")).toBe("annual");
    expect(withInterval("month")).toBe("monthly");
    expect(withInterval()).toBeNull();
    expect(
      billingUpdateFromEvent({
        type: "checkout.session.completed",
        data: { object: { client_reference_id: "u1" } }
      })?.plan
    ).toBeNull();
  });

  it("ignores other events and events with no athlete", () => {
    expect(billingUpdateFromEvent({ type: "invoice.paid", data: { object: {} } })).toBeNull();
    expect(billingUpdateFromEvent({ type: "customer.subscription.updated", data: { object: { status: "active" } } })).toBeNull();
  });
});

describe("status helpers", () => {
  it("maps Stripe statuses and paid access", () => {
    expect(mapSubscriptionStatus("unpaid")).toBe("past_due");
    expect(mapSubscriptionStatus("incomplete_expired")).toBe("canceled");
    expect(mapSubscriptionStatus("weird")).toBe("none");
    expect(hasPaidAccess("trialing")).toBe(true);
    expect(hasPaidAccess("past_due")).toBe(false);
  });
});
