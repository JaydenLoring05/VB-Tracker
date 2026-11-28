"use client";

import { useCallback, useEffect, useState } from "react";

import { useDemo } from "@/context/DemoContext";
import { useTrackerContext } from "@/context/TrackerContext";
import { useSupabase } from "@/hooks/useSupabase";
import { isViewerRole, normalizeViewerLabel, parseViewerToken, type ViewerRole } from "@/lib/viewerLinks";

export type ViewerLinkRow = {
  id: string;
  role: ViewerRole;
  label: string | null;
  createdAt: string;
  lastViewedAt: string | null;
};

/**
 * The athlete's read-only viewer links (P-06): the ones that still work, and
 * actions to make and revoke one. `available` is false before schema_v67 is
 * run, so the Settings card can hide itself instead of showing an error.
 */
export function useViewerLinks() {
  const { userId } = useTrackerContext();
  const supabase = useSupabase();
  const demo = useDemo();
  const [links, setLinks] = useState<ViewerLinkRow[]>([]);
  const [available, setAvailable] = useState(false);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    if (demo || !userId) return;
    let cancelled = false;
    supabase
      .from("viewer_links")
      .select("id, role, label, created_at, last_viewed_at")
      .eq("athlete_id", userId)
      .is("revoked_at", null)
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          console.error("Failed to load viewer links", error);
          setAvailable(false);
          return;
        }
        setAvailable(true);
        setLinks(
          (data ?? [])
            .filter((row) => isViewerRole(row.role))
            .map((row) => ({
              id: row.id as string,
              role: row.role as ViewerRole,
              label: (row.label as string | null) ?? null,
              createdAt: row.created_at as string,
              lastViewedAt: (row.last_viewed_at as string | null) ?? null
            }))
        );
      });
    return () => {
      cancelled = true;
    };
  }, [supabase, demo, userId, reload]);

  /** Makes a link and returns its token (shown once), or throws with a message to show. */
  const createLink = useCallback(
    async (role: ViewerRole, label: string): Promise<string> => {
      const { data, error } = await supabase.rpc("create_viewer_link", {
        p_role: role,
        p_label: normalizeViewerLabel(label)
      });
      const token = parseViewerToken(typeof data === "string" ? data : null);
      if (error || !token) {
        throw new Error(error?.message?.includes("10 people") ? error.message : "Couldn't make a link right now. Try again.");
      }
      setReload((n) => n + 1);
      return token;
    },
    [supabase]
  );

  const revokeLink = useCallback(
    async (id: string): Promise<boolean> => {
      const { error } = await supabase.rpc("revoke_viewer_link", { p_id: id });
      if (error) {
        console.error("Failed to revoke viewer link", error);
        return false;
      }
      setLinks((current) => current.filter((link) => link.id !== id));
      return true;
    },
    [supabase]
  );

  return { links, available: !demo && available, createLink, revokeLink };
}
