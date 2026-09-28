"use client";

import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { useTrackerContext } from "@/context/TrackerContext";
import { createClient } from "@/lib/supabase/client";
import { TeamRole } from "@/types";

const ROLE_CACHE_KEY = "nextrep:navRole";

function readCachedRole(): TeamRole | null {
  try {
    const cached = window.sessionStorage.getItem(ROLE_CACHE_KEY);
    return cached === "coach" || cached === "athlete" ? cached : null;
  } catch {
    return null;
  }
}

function cacheRole(role: TeamRole | null) {
  try {
    if (role) window.sessionStorage.setItem(ROLE_CACHE_KEY, role);
    else window.sessionStorage.removeItem(ROLE_CACHE_KEY);
  } catch {
    // Storage can be blocked; the nav just resolves after the query.
  }
}

/**
 * The role that picks the nav. Resolves the same way as useTeam() (the first
 * membership's role) but only reads team_members: useTeam() also consumes
 * removal notices, which must stay put for the /coach page to show them.
 * The last role is cached for the tab so a coach's nav doesn't flash the
 * athlete layout on reload, and it re-checks on navigation so creating or
 * joining a team updates the nav without a reload.
 */
export function useNavRole(): TeamRole | null {
  const { userId } = useTrackerContext();
  const pathname = usePathname();
  const supabase = useMemo(() => createClient(), []);
  const [role, setRole] = useState<TeamRole | null>(null);

  useEffect(() => {
    setRole((current) => current ?? readCachedRole());

    let cancelled = false;

    supabase
      .from("team_members")
      .select("role")
      .eq("user_id", userId)
      .limit(1)
      .then(({ data, error }) => {
        if (cancelled || error) return;

        const next = (data?.[0]?.role as TeamRole | undefined) ?? null;
        setRole(next);
        cacheRole(next);
      });

    return () => {
      cancelled = true;
    };
  }, [supabase, userId, pathname]);

  return role;
}
