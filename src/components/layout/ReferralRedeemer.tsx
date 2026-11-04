"use client";

import { useEffect } from "react";

import { useSupabase } from "@/hooks/useSupabase";
import { isFinalRedeemResult, normalizeReferralCode, REFERRAL_KEY } from "@/lib/referral";

/**
 * After sign-up, links the new account to the friend whose code brought them
 * here (RF-01). Runs once on any signed-in page while a code is stored, and
 * forgets the code once the database gives a final answer.
 */
export function ReferralRedeemer() {
  const supabase = useSupabase();

  useEffect(() => {
    let stored: string | null = null;
    try {
      stored = normalizeReferralCode(window.localStorage.getItem(REFERRAL_KEY));
    } catch {
      return;
    }
    if (!stored) return;
    supabase.rpc("redeem_referral", { p_code: stored }).then(({ data, error }) => {
      // Network trouble or schema_v64 missing: keep the code and try next time.
      if (error || !isFinalRedeemResult(data)) return;
      try {
        window.localStorage.removeItem(REFERRAL_KEY);
      } catch {
        // Nothing to clear.
      }
    });
  }, [supabase]);

  return null;
}
