"use client";

import { useEffect, useMemo, useState } from "react";

import { useTrackerContext } from "@/context/TrackerContext";
import {
  ANNUAL_PER_MONTH,
  ANNUAL_SAVE_PERCENT,
  ATHLETE_PLAN,
  billingStatusLabel,
  BillingStatus,
  hasPaidAccess,
  PLAN_OPTIONS,
  PlanInterval
} from "@/lib/billing";
import { createClient } from "@/lib/supabase/client";

type BillingRow = {
  status: BillingStatus;
  trial_ends_at: string | null;
  current_period_end: string | null;
  /** From schema_v65; missing before it runs. */
  plan?: PlanInterval | null;
};

function shortDate(iso: string | null) {
  return iso ? new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : null;
}

/** The athlete plan on Settings (F-37): start the trial, or manage it. */
export function AthletePlan() {
  const { userId } = useTrackerContext();
  const supabase = useMemo(() => createClient(), []);
  const [billing, setBilling] = useState<BillingRow | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [plan, setPlan] = useState<PlanInterval>("annual");

  useEffect(() => {
    if (!userId) return;
    // "*" rather than a column list, so the card still loads before schema_v65 adds `plan`.
    supabase
      .from("athlete_billing")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle()
      .then(({ data }) => setBilling((data as BillingRow | null) ?? null));
    const params = new URLSearchParams(window.location.search);
    if (params.get("billing") === "success") setMessage("You're in. Your free trial has started.");
  }, [supabase, userId]);

  async function go(path: "/api/billing/checkout" | "/api/billing/portal") {
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch(path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan })
      });
      const body = (await response.json().catch(() => ({}))) as { url?: string; error?: string };
      if (body.url) {
        window.location.assign(body.url);
        return;
      }
      setMessage(
        body.error === "billing_off"
          ? "Payments open soon. Everything stays free until then."
          : body.error === "plan_unavailable"
            ? "The annual plan isn't open yet. Pick monthly for now."
            : "Something went wrong. Try again."
      );
    } catch {
      setMessage("Couldn't reach the server. Check your connection.");
    }
    setBusy(false);
  }

  const status = billing?.status ?? "none";
  const paid = hasPaidAccess(status);
  const renews = shortDate(status === "trialing" ? billing?.trial_ends_at ?? null : billing?.current_period_end ?? null);

  return (
    <section className="panel athlete-plan">
      <h2>{ATHLETE_PLAN.name}</h2>
      <p className="muted">
        Your plan built around your level, age and anything sore, a week that adjusts around practice and games, and
        results you can share. {ATHLETE_PLAN.trialDays}-day free trial, then {PLAN_OPTIONS.monthly.priceLabel} or{" "}
        {PLAN_OPTIONS.annual.priceLabel}. Cancel any time.
      </p>
      <p>
        <strong>Status:</strong> {billingStatusLabel(status)}
        {billing?.plan && paid && <span className="muted"> · {PLAN_OPTIONS[billing.plan].name}</span>}
        {renews && paid && <span className="muted"> · {status === "trialing" ? "trial ends" : "renews"} {renews}</span>}
      </p>
      {paid || status === "past_due" ? (
        <button type="button" className="secondary" onClick={() => go("/api/billing/portal")} disabled={busy}>
          {busy ? "Opening…" : "Manage plan"}
        </button>
      ) : (
        <>
          <fieldset className="athlete-plan-options">
            <legend className="sr-only">Choose a plan</legend>
            {(["annual", "monthly"] as const).map((option) => (
              <label key={option} className={plan === option ? "is-selected" : undefined}>
                <input
                  type="radio"
                  name="athlete-plan"
                  value={option}
                  checked={plan === option}
                  onChange={() => setPlan(option)}
                />
                <span>
                  <strong>{PLAN_OPTIONS[option].name}</strong> {PLAN_OPTIONS[option].priceLabel}
                  <span className="muted">
                    {option === "annual" ? ` · ${ANNUAL_PER_MONTH}/month, save ${ANNUAL_SAVE_PERCENT}%` : " · cancel any time"}
                  </span>
                </span>
              </label>
            ))}
          </fieldset>
          <button type="button" onClick={() => go("/api/billing/checkout")} disabled={busy}>
            {busy ? "Opening checkout…" : `Start ${ATHLETE_PLAN.trialDays}-day free trial`}
          </button>
        </>
      )}
      {message && (
        <p className="muted" role="status">
          {message}
        </p>
      )}
    </section>
  );
}
