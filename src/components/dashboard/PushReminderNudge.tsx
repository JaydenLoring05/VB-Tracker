"use client";

import { ArrowRight, BellRing, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { useDemo } from "@/context/DemoContext";
import { useTrackerContext } from "@/context/TrackerContext";
import { useSupabase } from "@/hooks/useSupabase";
import { currentPushSupport } from "@/lib/pushClient";

const DISMISS_KEY = "nextrep:dismissed:push-reminder-nudge";

/**
 * Today screen card asking players to turn on phone reminders (schema_v55).
 * Only shows where reminders can work, until they're on or the card is closed.
 */
export function PushReminderNudge() {
  const isDemo = useDemo() !== null;
  const { userId } = useTrackerContext();
  const supabase = useSupabase();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isDemo) return;
    let cancelled = false;
    try {
      if (window.localStorage.getItem(DISMISS_KEY) === "1") return;
    } catch {
      // No storage: still fine to show.
    }
    const support = currentPushSupport();
    if (support !== "supported" && support !== "needs-home-screen") return;
    supabase
      .from("profiles")
      .select("push_reminder_hour")
      .eq("user_id", userId)
      .maybeSingle()
      .then(({ data, error }) => {
        // An error usually means schema_v55 isn't in yet: show nothing.
        if (!cancelled && !error && data?.push_reminder_hour == null) setVisible(true);
      });
    return () => {
      cancelled = true;
    };
  }, [isDemo, supabase, userId]);

  if (!visible) return null;

  function dismiss() {
    setVisible(false);
    try {
      window.localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      // Hidden for this visit only.
    }
  }

  return (
    <div className="panel today-checkin push-nudge">
      <BellRing size={26} aria-hidden="true" />
      <Link href="/settings#phone-reminders" className="push-nudge-link">
        <strong>Get a reminder on your phone</strong>
        <span className="muted">One nudge a day if you haven&apos;t checked in or trained. Pick the time.</span>
      </Link>
      <ArrowRight size={20} aria-hidden="true" />
      <button type="button" className="ghost push-nudge-close" onClick={dismiss} aria-label="Hide this">
        <X size={16} aria-hidden="true" />
      </button>
    </div>
  );
}
