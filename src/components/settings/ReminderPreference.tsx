"use client";

import { useEffect, useState } from "react";

import { useTrackerContext } from "@/context/TrackerContext";
import { useSupabase } from "@/hooks/useSupabase";

/**
 * Athlete opt-out for check-in reminder emails (profiles.checkin_reminder_opt_out,
 * schema_v50). Hidden until that column exists.
 */
export function ReminderPreference() {
  const { userId } = useTrackerContext();
  const supabase = useSupabase();
  const [optedOut, setOptedOut] = useState<boolean | null>(null);
  const [status, setStatus] = useState<"idle" | "saved" | "error">("idle");

  useEffect(() => {
    let cancelled = false;
    supabase
      .from("profiles")
      .select("checkin_reminder_opt_out")
      .eq("user_id", userId)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!cancelled && !error) setOptedOut(Boolean(data?.checkin_reminder_opt_out));
      });
    return () => {
      cancelled = true;
    };
  }, [supabase, userId]);

  if (optedOut === null) return null;

  async function toggle(wantsReminders: boolean) {
    setOptedOut(!wantsReminders);
    const { error } = await supabase
      .from("profiles")
      .upsert({ user_id: userId, checkin_reminder_opt_out: !wantsReminders }, { onConflict: "user_id" });
    if (error) {
      console.error("Failed to save reminder preference", error);
      setOptedOut(wantsReminders);
    }
    setStatus(error ? "error" : "saved");
  }

  return (
    <section className="panel">
      <h2>Check-in reminders</h2>
      <label className="settings-checkbox">
        <input type="checkbox" checked={!optedOut} onChange={(e) => toggle(e.target.checked)} />
        Email me if I haven&apos;t checked in by my team&apos;s reminder time
      </label>
      <p className="muted" role="status">
        {status === "saved" ? "Saved." : status === "error" ? "Couldn't save. Try again." : "Your coach sets the time. Only sent on days you haven't checked in."}
      </p>
    </section>
  );
}
