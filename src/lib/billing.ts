import { createHmac, timingSafeEqual } from "node:crypto";

import { REFERRAL_TRIAL_BONUS_DAYS } from "@/lib/referral";

/**
 * Athlete plan payments (F-37). Stripe Checkout through its REST API (no SDK),
 * and the webhook signature check. Everything stays off until the keys are
 * set in Vercel; see readBillingConfig.
 */

export type PlanInterval = "monthly" | "annual";

/** Prices in cents (P-02). Stripe charges whatever its price IDs say, so these must match them. */
export const MONTHLY_PRICE_CENTS = 1499;

/**
 * The annual plan is built but switched off: Jayden is keeping $14.99/month
 * for now and raising it later (2026-11-09). To turn annual on, set this to
 * true, set ANNUAL_PRICE_CENTS to the yearly price, create that price in
 * Stripe and add STRIPE_ANNUAL_PRICE_ID in Vercel. While it's off, the
 * landing page and Settings show monthly only and checkout refuses annual.
 */
export const ANNUAL_PLAN_ON = false;
/** Half of twelve months, the coach's "save 50%" rule; only shown once ANNUAL_PLAN_ON is true. */
export const ANNUAL_PRICE_CENTS = MONTHLY_PRICE_CENTS * 6;

const dollars = (cents: number) => `$${(cents / 100).toFixed(2)}`;

export const PLAN_OPTIONS: Record<
  PlanInterval,
  { interval: PlanInterval; name: string; amount: string; period: "month" | "year"; priceLabel: string }
> = {
  monthly: {
    interval: "monthly",
    name: "Monthly",
    amount: dollars(MONTHLY_PRICE_CENTS),
    period: "month",
    priceLabel: `${dollars(MONTHLY_PRICE_CENTS)}/month`
  },
  annual: {
    interval: "annual",
    name: "Annual",
    amount: dollars(ANNUAL_PRICE_CENTS),
    period: "year",
    priceLabel: `${dollars(ANNUAL_PRICE_CENTS)}/year`
  }
};

/** A year of monthly, the annual plan per month, and the saving, all derived so they can't drift. */
export const ANNUAL_COMPARE_AT = dollars(MONTHLY_PRICE_CENTS * 12);
export const ANNUAL_PER_MONTH = dollars(Math.round(ANNUAL_PRICE_CENTS / 12));
export const ANNUAL_SAVE_PERCENT = Math.round((1 - ANNUAL_PRICE_CENTS / (MONTHLY_PRICE_CENTS * 12)) * 100);
/** True while monthly costs under $1 a day over a 30-day month, so the copy may say so. */
export const MONTHLY_UNDER_A_DOLLAR_A_DAY = MONTHLY_PRICE_CENTS / 30 < 100;

export const ATHLETE_PLAN = {
  name: "NextRep Athlete",
  priceLabel: PLAN_OPTIONS.monthly.priceLabel,
  trialDays: 7
} as const;

export function parsePlanInterval(value: unknown): PlanInterval {
  return value === "annual" ? "annual" : "monthly";
}

/** The plans on sale, in the order they're shown (best value first). */
export function plansOnSale(annualOn: boolean = ANNUAL_PLAN_ON): PlanInterval[] {
  return annualOn ? ["annual", "monthly"] : ["monthly"];
}

export type BillingConfig = {
  stripeSecretKey: string;
  /** The monthly price. */
  priceId: string;
  /** The annual price; null until STRIPE_ANNUAL_PRICE_ID is set, and until then only monthly is sold. */
  annualPriceId: string | null;
  webhookSecret: string;
  billingSecret: string;
};

export type BillingStatus = "none" | "trialing" | "active" | "past_due" | "canceled" | "incomplete";

/** Null unless every key is set: checkout and the webhook do nothing until then. */
export function readBillingConfig(env: Record<string, string | undefined>): BillingConfig | null {
  const stripeSecretKey = env.STRIPE_SECRET_KEY?.trim();
  const priceId = env.STRIPE_PRICE_ID?.trim();
  const webhookSecret = env.STRIPE_WEBHOOK_SECRET?.trim();
  const billingSecret = env.BILLING_SECRET?.trim();
  if (!stripeSecretKey || !priceId || !webhookSecret || !billingSecret) return null;
  const annualPriceId = env.STRIPE_ANNUAL_PRICE_ID?.trim() || null;
  return { stripeSecretKey, priceId, annualPriceId, webhookSecret, billingSecret };
}

/** The Stripe price for a plan, or null when that plan isn't on sale or set up. */
export function priceIdFor(config: BillingConfig, plan: PlanInterval, annualOn: boolean = ANNUAL_PLAN_ON): string | null {
  if (plan === "annual") return annualOn ? config.annualPriceId : null;
  return config.priceId;
}

/** Stripe's API takes form encoding with bracketed keys. */
export function stripeForm(fields: Record<string, string | number>): string {
  return Object.entries(fields)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
    .join("&");
}

export function checkoutFields(input: {
  priceId: string;
  userId: string;
  email: string | null | undefined;
  siteUrl: string;
  /** Signed up with a friend's referral code (RF-01): one extra free week. */
  referred?: boolean;
  /** Already had a subscription (P-02): no second free trial, billing starts now. */
  hadPlan?: boolean;
}): Record<string, string | number> {
  const fields: Record<string, string | number> = {
    mode: "subscription",
    "line_items[0][price]": input.priceId,
    "line_items[0][quantity]": 1,
    "subscription_data[metadata][user_id]": input.userId,
    client_reference_id: input.userId,
    "metadata[user_id]": input.userId,
    allow_promotion_codes: "true",
    success_url: `${input.siteUrl}/settings?billing=success`,
    cancel_url: `${input.siteUrl}/settings?billing=canceled`
  };
  if (!input.hadPlan) {
    fields["subscription_data[trial_period_days]"] = ATHLETE_PLAN.trialDays + (input.referred ? REFERRAL_TRIAL_BONUS_DAYS : 0);
  }
  if (input.email) fields.customer_email = input.email;
  return fields;
}

/**
 * Verifies a Stripe-Signature header ("t=...,v1=...") against the raw body.
 * Rejects anything older than the tolerance to stop replays.
 */
export function verifyStripeSignature(
  payload: string,
  header: string | null,
  secret: string,
  nowSeconds: number,
  toleranceSeconds = 300
): boolean {
  if (!header) return false;
  const parts = header.split(",").map((part) => part.split("="));
  const timestamp = Number(parts.find(([key]) => key === "t")?.[1]);
  const signatures = parts.filter(([key]) => key === "v1").map(([, value]) => value);
  if (!Number.isFinite(timestamp) || signatures.length === 0) return false;
  if (Math.abs(nowSeconds - timestamp) > toleranceSeconds) return false;

  const expected = createHmac("sha256", secret).update(`${timestamp}.${payload}`).digest("hex");
  const expectedBuffer = Buffer.from(expected, "hex");
  return signatures.some((signature) => {
    const given = Buffer.from(signature, "hex");
    return given.length === expectedBuffer.length && timingSafeEqual(given, expectedBuffer);
  });
}

export function mapSubscriptionStatus(status: string | undefined): BillingStatus {
  switch (status) {
    case "trialing":
    case "active":
    case "past_due":
    case "canceled":
    case "incomplete":
      return status;
    case "unpaid":
      return "past_due";
    case "incomplete_expired":
      return "canceled";
    default:
      return "none";
  }
}

export type BillingUpdate = {
  userId: string;
  customerId: string | null;
  subscriptionId: string | null;
  status: BillingStatus;
  trialEndsAt: string | null;
  currentPeriodEnd: string | null;
  /** Monthly or annual, from the subscription's price; null when the event doesn't say. */
  plan: PlanInterval | null;
};

type StripeObject = Record<string, unknown> & { metadata?: Record<string, string> };

const toISO = (seconds: unknown) => (typeof seconds === "number" ? new Date(seconds * 1000).toISOString() : null);
const str = (value: unknown) => (typeof value === "string" ? value : null);

/** Turns a webhook event into the row change, or null for events we ignore. */
export function billingUpdateFromEvent(event: { type?: string; data?: { object?: StripeObject } }): BillingUpdate | null {
  const object = event.data?.object;
  if (!object) return null;

  if (event.type === "checkout.session.completed") {
    const userId = str(object.client_reference_id) ?? object.metadata?.user_id ?? null;
    if (!userId) return null;
    return {
      userId,
      customerId: str(object.customer),
      subscriptionId: str(object.subscription),
      status: "trialing",
      trialEndsAt: null,
      currentPeriodEnd: null,
      plan: null
    };
  }

  if (
    event.type === "customer.subscription.created" ||
    event.type === "customer.subscription.updated" ||
    event.type === "customer.subscription.deleted"
  ) {
    const userId = object.metadata?.user_id ?? null;
    if (!userId) return null;
    type Item = { current_period_end?: number; price?: { recurring?: { interval?: string } | null } };
    const firstItem = (object.items as { data?: Item[] } | undefined)?.data?.[0];
    const interval = firstItem?.price?.recurring?.interval;
    return {
      userId,
      customerId: str(object.customer),
      subscriptionId: str(object.id),
      status: event.type === "customer.subscription.deleted" ? "canceled" : mapSubscriptionStatus(str(object.status) ?? undefined),
      trialEndsAt: toISO(object.trial_end),
      currentPeriodEnd: toISO(object.current_period_end ?? firstItem?.current_period_end),
      plan: interval === "year" ? "annual" : interval === "month" ? "monthly" : null
    };
  }

  return null;
}

/** What the plan card says for a status. */
export function billingStatusLabel(status: BillingStatus | null | undefined): string {
  switch (status) {
    case "trialing":
      return "Free trial";
    case "active":
      return "Active";
    case "past_due":
      return "Payment failed: update your card";
    case "canceled":
      return "Canceled";
    case "incomplete":
      return "Checkout not finished";
    default:
      return "Not started";
  }
}

export function hasPaidAccess(status: BillingStatus | null | undefined): boolean {
  return status === "trialing" || status === "active";
}
