"use client";

import { Share2 } from "lucide-react";
import { useState } from "react";

import { useReferrals } from "@/hooks/useReferrals";
import { REFERRAL_TRIAL_BONUS_DAYS, referralLink, XP_PER_REFERRAL } from "@/lib/referral";

/** Settings card with the athlete's (or coach's) referral code and link (RF-01). */
export function InviteFriends() {
  const { code, signups } = useReferrals();
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");
  if (!code) return null;

  const link = referralLink(code);

  async function share() {
    try {
      if (navigator.share) {
        await navigator.share({ title: "Train with me on NextRep", text: `Use my code ${code} for an extra free week.`, url: link });
        return;
      }
      await navigator.clipboard.writeText(link);
      setState("copied");
    } catch (error) {
      setState(error instanceof DOMException && error.name === "AbortError" ? "idle" : "failed");
    }
  }

  return (
    <section className="panel invite-friends">
      <h2>Invite friends</h2>
      <p className="muted">
        Friends who sign up with your code get an extra {REFERRAL_TRIAL_BONUS_DAYS}-day free trial. You get{" "}
        {XP_PER_REFERRAL} XP for each one and the Recruiter badge.
      </p>
      <p className="invite-code">
        Your code <strong>{code}</strong>
      </p>
      <button type="button" onClick={share}>
        <Share2 size={16} aria-hidden="true" /> Share your link
      </button>
      <p className="muted" role="status">
        {state === "copied" ? "Link copied." : state === "failed" ? `Couldn't share. Your link: ${link}` : ""}
        {signups > 0 && ` ${signups} friend${signups === 1 ? "" : "s"} joined with your code.`}
      </p>
    </section>
  );
}
