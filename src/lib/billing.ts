import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Athlete plan payments (F-37). Stripe Checkout through its REST API (no SDK),
 * and the webhook signature check. Everything stays off until the keys are
 * set in Vercel; see readBillingConfig.
 */

export const ATHLETE_PLAN = { name: "NextRep Athlete", priceLabel: "$14.99/month", trialDays: 7 } as const;

export type BillingConfig = {
  stripeSecretKey: string;
  priceId: string;
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
  return { stripeSecretKey, priceId, webhookSecret, billingSecret };
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
}): Record<string, string | number> {
  const fields: Record<string, string | number> = {
    mode: "subscription",
    "line_items[0][price]": input.priceId,
    "line_items[0][quantity]": 1,
    "subscription_data[trial_period_days]": ATHLETE_PLAN.trialDays,
    "subscription_data[metadata][user_id]": input.userId,
    client_reference_id: input.userId,
    "metadata[user_id]": input.userId,
    allow_promotion_codes: "true",
    success_url: `${input.siteUrl}/settings?billing=success`,
    cancel_url: `${input.siteUrl}/settings?billing=canceled`
  };
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
      currentPeriodEnd: null
    };
  }

  if (
    event.type === "customer.subscription.created" ||
    event.type === "customer.subscription.updated" ||
    event.type === "customer.subscription.deleted"
  ) {
    const userId = object.metadata?.user_id ?? null;
    if (!userId) return null;
    const firstItem = (object.items as { data?: { current_period_end?: number }[] } | undefined)?.data?.[0];
    return {
      userId,
      customerId: str(object.customer),
      subscriptionId: str(object.id),
      status: event.type === "customer.subscription.deleted" ? "canceled" : mapSubscriptionStatus(str(object.status) ?? undefined),
      trialEndsAt: toISO(object.trial_end),
      currentPeriodEnd: toISO(object.current_period_end ?? firstItem?.current_period_end)
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
