import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";

import { billingUpdateFromEvent, readBillingConfig, verifyStripeSignature } from "@/lib/billing";

// Stripe webhook (F-37). Verifies the signature on the raw body, then records
// the athlete's plan status through apply_billing_update (schema_v57), which
// only runs with BILLING_SECRET. Point Stripe at /api/billing/webhook with:
// checkout.session.completed, customer.subscription.created/updated/deleted.

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function json(body: Record<string, unknown>, status = 200) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: NextRequest) {
  const config = readBillingConfig(process.env);
  if (!config) return json({ ok: true, skipped: true });

  const payload = await request.text();
  const valid = verifyStripeSignature(
    payload,
    request.headers.get("stripe-signature"),
    config.webhookSecret,
    Math.floor(Date.now() / 1000)
  );
  if (!valid) return json({ ok: false, error: "bad_signature" }, 400);

  let event: Parameters<typeof billingUpdateFromEvent>[0];
  try {
    event = JSON.parse(payload);
  } catch {
    return json({ ok: false, error: "bad_payload" }, 400);
  }

  const update = billingUpdateFromEvent(event);
  if (!update) return json({ ok: true, ignored: true });

  const supabase = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
  const { error } = await supabase.rpc("apply_billing_update", {
    p_secret: config.billingSecret,
    p_user_id: update.userId,
    p_customer_id: update.customerId,
    p_subscription_id: update.subscriptionId,
    p_status: update.status,
    p_trial_ends_at: update.trialEndsAt,
    p_current_period_end: update.currentPeriodEnd
  });

  if (error) {
    // 500 makes Stripe retry later, which is what we want if the database blipped.
    console.error("billing: could not record the update", error.message);
    return json({ ok: false, error: "save_failed" }, 500);
  }

  return json({ ok: true });
}
