"use client";

import { Gift } from "lucide-react";
import { useEffect, useState } from "react";

import { normalizeReferralCode, REFERRAL_KEY, REFERRAL_TRIAL_BONUS_DAYS } from "@/lib/referral";

/**
 * On /join?ref=CODE (RF-01): keeps the code in this browser so the new
 * account can redeem it after sign-up, and tells the visitor about the
 * extra free week.
 */
export function ReferralCapture() {
  const [code, setCode] = useState<string | null>(null);

  useEffect(() => {
    const found = normalizeReferralCode(new URLSearchParams(window.location.search).get("ref"));
    if (!found) return;
    try {
      window.localStorage.setItem(REFERRAL_KEY, found);
    } catch {
      // Storage blocked: the invite still shows, the bonus just can't follow.
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect -- the URL is only readable after mount
    setCode(found);
  }, []);

  if (!code) return null;
  return (
    <p className="join-referral" role="status">
      <Gift size={18} aria-hidden="true" />
      <span>
        A friend invited you. Sign up and your free trial is {REFERRAL_TRIAL_BONUS_DAYS} days longer.
      </span>
    </p>
  );
}
