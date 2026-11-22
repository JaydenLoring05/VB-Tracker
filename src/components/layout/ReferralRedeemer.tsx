"use client";

import { useEffect } from "react";

import { useSupabase } from "@/hooks/useSupabase";
import { codeToRedeem, isFinalRedeemResult, REFERRAL_KEY } from "@/lib/referral";

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
      stored = window.localStorage.getItem(REFERRAL_KEY);
    } catch {
      // Storage blocked: the code on the account may still be there.
    }
    supabase.auth.getUser().then(({ data }) => {
      const code = codeToRedeem(stored, data.user?.user_metadata);
      if (!code) return;
      supabase.rpc("redeem_referral", { p_code: code }).then(({ data: result, error }) => {
        // Network trouble or schema_v64 missing: keep the code and try next time.
        if (error || !isFinalRedeemResult(result)) return;
        try {
          window.localStorage.removeItem(REFERRAL_KEY);
        } catch {
          // Nothing to clear.
        }
        // Drop the code from the account too, so it isn't tried again.
        if (data.user?.user_metadata?.pending_referral) {
          supabase.auth.updateUser({ data: { pending_referral: null } });
        }
      });
    });
  }, [supabase]);

  return null;
}
