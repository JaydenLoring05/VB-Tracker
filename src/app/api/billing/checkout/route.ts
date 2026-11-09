import { NextResponse, type NextRequest } from "next/server";

import { checkoutFields, parsePlanInterval, priceIdFor, readBillingConfig, stripeForm } from "@/lib/billing";
import { SITE_URL } from "@/lib/site";
import { createClient } from "@/lib/supabase/server";

// Starts Stripe Checkout for the athlete plan (F-37, P-02): monthly or annual
// (body {"plan": "monthly" | "annual"}, monthly if missing) after a 7-day free
// trial, or 14 days for an athlete who signed up with a friend's referral code
// (RF-01). Off (503) until STRIPE_SECRET_KEY, STRIPE_PRICE_ID,
// STRIPE_WEBHOOK_SECRET and BILLING_SECRET are all set in Vercel. Annual also
// needs STRIPE_ANNUAL_PRICE_ID; without it an annual request gets 409.

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function json(body: Record<string, unknown>, status = 200) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (origin && new URL(origin).host !== request.headers.get("host")) return json({ ok: false, error: "forbidden" }, 403);

  const config = readBillingConfig(process.env);
  if (!config) return json({ ok: false, error: "billing_off" }, 503);

  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return json({ ok: false, error: "signed_out" }, 401);

  const body = (await request.json().catch(() => null)) as { plan?: unknown } | null;
  const priceId = priceIdFor(config, parsePlanInterval(body?.plan));
  if (!priceId) return json({ ok: false, error: "plan_unavailable" }, 409);

  // RLS lets the athlete read their own referral row. Any error (no row, or
  // schema_v64 not run yet) means the normal trial.
  const { data: referral } = await supabase.from("referrals").select("id").eq("referred_id", user.id).maybeSingle();

  const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.stripeSecretKey}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: stripeForm(checkoutFields({
      priceId,
      userId: user.id,
      email: user.email,
      siteUrl: SITE_URL,
      referred: Boolean(referral)
    }))
  });

  const session = (await response.json().catch(() => null)) as { url?: string; error?: { message?: string } } | null;
  if (!response.ok || !session?.url) {
    console.error("billing: checkout session failed", session?.error?.message ?? response.status);
    return json({ ok: false, error: "checkout_failed" }, 502);
  }

  return json({ ok: true, url: session.url });
}
