"use client";

import { X } from "lucide-react";
import { useEffect, useState } from "react";

import {
  PAID_PRICE_LABEL,
  PILOT_ROSTER_LIMIT,
  formatPilotEnd,
  paymentLink,
  pilotBanner,
  pilotDismissKey,
  rosterOverPilotLimit
} from "@/lib/pilot";
import { Team } from "@/types";

function wasDismissed(key: string) {
  try {
    return window.localStorage.getItem(key) === "1";
  } catch {
    return false;
  }
}

/**
 * Coach-only pilot notices: from day 25 of the pilot, a dismissible banner
 * with the end date and (if NEXT_PUBLIC_PAYMENT_LINK is set) a "Continue for
 * $29/month" button; and a soft warning, never a block, once the roster passes
 * the pilot's 16 athletes. Paid teams and the demo (a paid team) see nothing.
 */
export function PilotNotices({ team, athleteCount }: { team: Team; athleteCount: number }) {
  // Dates depend on "now" and dismissal on localStorage, so decide after mount.
  const [banner, setBanner] = useState<ReturnType<typeof pilotBanner>>(null);
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    const next = pilotBanner(team);
    setBanner(next);
    setDismissed(next ? wasDismissed(pilotDismissKey(team.id, next.ended)) : true);
  }, [team]);

  const link = paymentLink(process.env.NEXT_PUBLIC_PAYMENT_LINK);
  const overLimit = rosterOverPilotLimit(athleteCount, team.plan_tier);

  function dismiss() {
    if (!banner) return;
    setDismissed(true);
    try {
      window.localStorage.setItem(pilotDismissKey(team.id, banner.ended), "1");
    } catch {
      // Storage blocked: it just shows again next visit.
    }
  }

  if ((!banner || dismissed) && !overLimit) return null;

  return (
    <div className="pilot-notices">
      {banner && !dismissed && (
        <section className="panel pilot-banner" aria-label="Pilot ending">
          <div>
            <strong>
              {banner.ended
                ? `Your free pilot ended on ${formatPilotEnd(banner.endsOn)}.`
                : `Your free pilot ends on ${formatPilotEnd(banner.endsOn)}.`}
            </strong>{" "}
            <span className="muted">
              {banner.ended
                ? "Everything still works while we sort out next steps."
                : `${banner.daysLeft} day${banner.daysLeft === 1 ? "" : "s"} left. Nothing changes for your athletes.`}
            </span>
          </div>
          <div className="pilot-banner-actions">
            {link && (
              <a href={link} target="_blank" rel="noopener noreferrer" className="button-link">
                Continue for {PAID_PRICE_LABEL}
              </a>
            )}
            <button type="button" className="ghost pilot-dismiss" onClick={dismiss} aria-label="Dismiss pilot notice">
              <X size={16} aria-hidden="true" />
            </button>
          </div>
        </section>
      )}

      {overLimit && (
        <p className="pilot-roster-warning" role="note">
          Your roster has {athleteCount} athletes. The pilot covers up to {PILOT_ROSTER_LIMIT}. Everyone can keep using
          NextRep; we&apos;ll reach out about the right plan.
        </p>
      )}
    </div>
  );
}
