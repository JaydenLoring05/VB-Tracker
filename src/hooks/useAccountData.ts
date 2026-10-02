"use client";

import { useCallback, useEffect, useState } from "react";

import { useTrackerContext } from "@/context/TrackerContext";
import { useSupabase } from "@/hooks/useSupabase";
import { EXPORT_TABLES, buildDataExport, exportFileName } from "@/lib/accountData";

type OwnedTeam = { id: string; name: string };

/**
 * Settings-page data actions: download everything the user owns as JSON,
 * and delete their account. Both run with the user's own session, so RLS
 * applies to every read and the delete RPC can only remove the caller.
 */
export function useAccountData() {
  const { userId } = useTrackerContext();
  const supabase = useSupabase();

  const [ownedTeams, setOwnedTeams] = useState<OwnedTeam[]>([]);
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    supabase
      .from("teams")
      .select("id, name")
      .eq("coach_id", userId)
      .then(({ data }) => {
        if (!cancelled) setOwnedTeams((data ?? []) as OwnedTeam[]);
      });
    return () => {
      cancelled = true;
    };
  }, [supabase, userId]);

  const exportData = useCallback(async () => {
    setExporting(true);
    setError(null);

    const { data: auth } = await supabase.auth.getUser();
    const results = await Promise.all(
      EXPORT_TABLES.map(async ({ table, column }) => {
        const { data, error: readError } = await supabase.from(table).select("*").eq(column, userId);
        return { table, rows: (data ?? []) as unknown[], failed: Boolean(readError) };
      })
    );

    const sections: Record<string, unknown[]> = {};
    const skipped: string[] = [];
    results.forEach(({ table, rows, failed }) => {
      if (failed) skipped.push(table);
      else sections[table] = rows;
    });

    const now = new Date();
    const file = buildDataExport({
      userId,
      email: auth.user?.email ?? null,
      exportedAt: now,
      sections,
      skipped
    });

    const blob = new Blob([JSON.stringify(file, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = exportFileName(now);
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);

    setExporting(false);
  }, [supabase, userId]);

  /** Deletes the account. Resolves true when it is gone and the user is signed out. */
  const deleteAccount = useCallback(async () => {
    setDeleting(true);
    setError(null);

    const { error: deleteError } = await supabase.rpc("delete_my_account", {
      p_delete_owned_teams: ownedTeams.length > 0
    });

    if (deleteError) {
      console.error("Failed to delete account", deleteError);
      setError("Couldn't delete your account. Try again, or email us and we'll do it for you.");
      setDeleting(false);
      return false;
    }

    // The account no longer exists; clear the local session too.
    await supabase.auth.signOut().catch(() => undefined);
    return true;
  }, [supabase, ownedTeams.length]);

  return { ownedTeams, exporting, deleting, error, exportData, deleteAccount };
}
