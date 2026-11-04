"use client";

import { useEffect, useState } from "react";

import { useDemo } from "@/context/DemoContext";
import { useTrackerContext } from "@/context/TrackerContext";
import { useSupabase } from "@/hooks/useSupabase";

/**
 * The caller's referral code and how many people signed up with it (RF-01).
 * Code is null until loaded, and before schema_v64 exists.
 */
export function useReferrals(): { code: string | null; signups: number } {
  const { userId } = useTrackerContext();
  const supabase = useSupabase();
  const demo = useDemo();
  const [state, setState] = useState<{ code: string | null; signups: number }>({ code: null, signups: 0 });

  useEffect(() => {
    if (demo || !userId) return;
    let cancelled = false;
    supabase.rpc("my_referral_stats").then(({ data, error }) => {
      if (cancelled) return;
      if (error) {
        console.error("Failed to load referral code", error);
        return;
      }
      const row = (Array.isArray(data) ? data[0] : data) as { code?: string; signups?: number } | null;
      if (row?.code) setState({ code: row.code, signups: Number(row.signups ?? 0) });
    });
    return () => {
      cancelled = true;
    };
  }, [supabase, demo, userId]);

  return demo ? { code: "AVA7K2", signups: 2 } : state;
}
