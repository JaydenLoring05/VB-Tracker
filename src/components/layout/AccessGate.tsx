"use client";

import { usePathname } from "next/navigation";

import { AthletePlan } from "@/components/settings/AthletePlan";
import { isOpenWithoutPlan, paywallMessage } from "@/lib/access";
import type { BillingStatus } from "@/lib/billing";

import "@/styles/settings.css";

/**
 * Shows the plan picker in place of the page for athletes who need a plan
 * (P-02). The layout decides `locked` on the server; this only adds the
 * pages that stay open (Settings, onboarding, team setup, feedback).
 */
export function AccessGate({
  locked,
  status,
  children
}: {
  locked: boolean;
  status: BillingStatus | null;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  if (!locked || isOpenWithoutPlan(pathname)) return <>{children}</>;

  return (
    <div className="paywall">
      <p className="micro micro-gold">Your plan is ready</p>
      <h1>{status === "past_due" ? "Update your card" : "Start your free trial"}</h1>
      <p className="muted paywall-lead">{paywallMessage(status)}</p>
      <AthletePlan />
    </div>
  );
}
