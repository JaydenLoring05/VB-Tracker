"use client";

import { useEffect, useState } from "react";

import { useDemo } from "@/context/DemoContext";
import { useTrackerContext } from "@/context/TrackerContext";
import { useSupabase } from "@/hooks/useSupabase";

/**
 * Opt in to the morning summary email (profiles.daily_summary_opt_in,
 * schema_v47). Hidden until the column exists, so it never shows a switch
 * that can't save.
 */
export function DailySummaryToggle() {
  const { userId } = useTrackerContext();
  const supabase = useSupabase();
  const demo = useDemo();

  const [available, setAvailable] = useState(Boolean(demo));
  const [enabled, setEnabled] = useState(false);
  const [saving, setSaving] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (demo) return;
    let cancelled = false;
    supabase
      .from("profiles")
      .select("daily_summary_opt_in")
      .eq("user_id", userId)
      .maybeSingle()
      .then(({ data, error }) => {
        if (cancelled || error) return;
        setAvailable(true);
        setEnabled(Boolean(data?.daily_summary_opt_in));
      });
    return () => {
      cancelled = true;
    };
  }, [supabase, demo, userId]);

  async function toggle(next: boolean) {
    if (demo) {
      demo.requestSignup("Morning summary emails");
      return;
    }
    setSaving(true);
    setFailed(false);
    setEnabled(next);
    const { error } = await supabase
      .from("profiles")
      .upsert({ user_id: userId, daily_summary_opt_in: next }, { onConflict: "user_id" });
    setSaving(false);
    if (error) {
      console.error("Failed to save the morning summary setting", error);
      setEnabled(!next);
      setFailed(true);
    }
  }

  if (!available) return null;

  return (
    <label className="daily-summary-toggle">
      <input type="checkbox" checked={enabled} disabled={saving} onChange={(e) => toggle(e.target.checked)} />
      Email me a morning summary: who checked in, who needs attention, readiness, pain alerts and today&apos;s workout.
      {failed && <span className="muted"> Couldn&apos;t save that. Try again.</span>}
    </label>
  );
}
