"use client";

import { useEffect, useMemo, useState } from "react";

import { createClient } from "@/lib/supabase/client";
import { PRRecord } from "@/context/TrackerContext";

export function useAthletePRs(userId: string | null) {
  const supabase = useMemo(() => createClient(), []);

  const [loading, setLoading] = useState(false);
  const [prs, setPrs] = useState<PRRecord[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setPrs([]);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    supabase
      .from("prs")
      .select("id, date, exercise, value, unit, note")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .then(({ data, error: fetchError }) => {
        if (cancelled) return;

        if (fetchError) {
          console.error("Failed to load athlete PRs", fetchError);
          setError("Couldn't load this athlete's PRs.");
          setLoading(false);
          return;
        }

        setPrs((data ?? []) as PRRecord[]);
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [supabase, userId]);

  return { loading, prs, error };
}
