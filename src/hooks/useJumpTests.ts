"use client";

import { useCallback, useEffect, useState } from "react";

import { useDemo } from "@/context/DemoContext";
import { useTrackerContext } from "@/context/TrackerContext";
import { useSupabase } from "@/hooks/useSupabase";
import type { JumpKind, JumpTest } from "@/lib/jumps";

/**
 * The athlete's logged jumps (G-04, `jump_tests` from schema_v62). Empty and
 * read-only in the demo. Before schema_v62 the read fails quietly and only
 * the older stats-form values show.
 */
export function useJumpTests() {
  const { userId } = useTrackerContext();
  const supabase = useSupabase();
  const demo = useDemo();
  const [tests, setTests] = useState<JumpTest[]>([]);

  useEffect(() => {
    if (demo || !userId) return;
    let cancelled = false;
    supabase
      .from("jump_tests")
      .select("tested_on, kind, value_in")
      .eq("user_id", userId)
      .order("tested_on", { ascending: true })
      .limit(1000)
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          console.error("Failed to load jumps", error);
          return;
        }
        setTests((data ?? []).map((row) => ({ ...row, value_in: Number(row.value_in) })) as JumpTest[]);
      });
    return () => {
      cancelled = true;
    };
  }, [supabase, demo, userId]);

  /** Saves one jump for today. Resolves false (and leaves the list as it was) if it didn't save. */
  const addJump = useCallback(
    async (kind: JumpKind, valueIn: number, testedOn: string): Promise<boolean> => {
      if (demo || !userId) return false;
      const row: JumpTest = { tested_on: testedOn, kind, value_in: valueIn };
      setTests((current) => [...current, row]);
      const { error } = await supabase.from("jump_tests").insert({ user_id: userId, ...row });
      if (error) {
        console.error("Failed to save jump", error);
        setTests((current) => current.filter((item) => item !== row));
        return false;
      }
      return true;
    },
    [supabase, demo, userId]
  );

  return { tests, addJump };
}
