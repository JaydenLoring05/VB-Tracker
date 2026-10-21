import { NextResponse, type NextRequest } from "next/server";

import { checkoutFields, readBillingConfig, stripeForm } from "@/lib/billing";
import { SITE_URL } from "@/lib/site";
import { createClient } from "@/lib/supabase/server";

// Starts Stripe Checkout for the athlete plan (F-37): $14.99/month after a
// 7-day free trial. Off (503) until STRIPE_SECRET_KEY, STRIPE_PRICE_ID,
// STRIPE_WEBHOOK_SECRET and BILLING_SECRET are all set in Vercel.

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

  const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.stripeSecretKey}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: stripeForm(checkoutFields({ priceId: config.priceId, userId: user.id, email: user.email, siteUrl: SITE_URL }))
  });

  const session = (await response.json().catch(() => null)) as { url?: string; error?: { message?: string } } | null;
  if (!response.ok || !session?.url) {
    console.error("billing: checkout session failed", session?.error?.message ?? response.status);
    return json({ ok: false, error: "checkout_failed" }, 502);
  }

  return json({ ok: true, url: session.url });
}
