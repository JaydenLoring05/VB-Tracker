"use client";

import { useMemo } from "react";

import { useDemo } from "@/context/DemoContext";
import { createClient } from "@/lib/supabase/client";

type SupabaseBrowserClient = ReturnType<typeof createClient>;

/**
 * In the public demo no Supabase client may exist. Hooks branch on useDemo()
 * before touching data, and this guard makes any missed branch fail loudly
 * instead of quietly reaching the network.
 */
function createDemoGuardClient(): SupabaseBrowserClient {
  return new Proxy({} as SupabaseBrowserClient, {
    get() {
      throw new Error("Supabase is not available in the NextRep demo.");
    }
  });
}

export function useSupabase(): SupabaseBrowserClient {
  const isDemo = useDemo() !== null;
  return useMemo(() => (isDemo ? createDemoGuardClient() : createClient()), [isDemo]);
}
