import { NextResponse, type NextRequest } from "next/server";

import { readBillingConfig, stripeForm } from "@/lib/billing";
import { SITE_URL } from "@/lib/site";
import { createClient } from "@/lib/supabase/server";

// Opens Stripe's customer portal so an athlete can update their card or
// cancel (F-37). Reads their own stripe_customer_id through RLS.

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

  const { data } = await supabase
    .from("athlete_billing")
    .select("stripe_customer_id")
    .eq("user_id", user.id)
    .maybeSingle();
  const customerId = (data as { stripe_customer_id?: string | null } | null)?.stripe_customer_id;
  if (!customerId) return json({ ok: false, error: "no_customer" }, 404);

  const response = await fetch("https://api.stripe.com/v1/billing_portal/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.stripeSecretKey}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: stripeForm({ customer: customerId, return_url: `${SITE_URL}/settings` })
  });
  const session = (await response.json().catch(() => null)) as { url?: string } | null;
  if (!response.ok || !session?.url) return json({ ok: false, error: "portal_failed" }, 502);

  return json({ ok: true, url: session.url });
}
