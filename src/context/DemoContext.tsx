"use client";

import { createContext, useContext } from "react";

import type { DemoData } from "@/data/demoData";

export type DemoContextValue = {
  data: DemoData;
  /** Explain that an action is unavailable in the demo and invite the visitor to start a pilot. */
  requestSignup: (feature?: string) => void;
};

const DemoContext = createContext<DemoContextValue | null>(null);

export const DemoProvider = DemoContext.Provider;

/**
 * Returns the demo seam when rendered under the public /demo experience, and
 * null everywhere else. Data hooks use it to swap Supabase reads for static
 * sample data and to turn writes into a friendly sign-up prompt.
 */
export function useDemo() {
  return useContext(DemoContext);
}
