"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";

import { useTrackerContext } from "@/context/TrackerContext";

/**
 * Persistent (unlike SyncErrorToast) because a failed initial load leaves the
 * screen looking like an empty account, which is worse than an error.
 */
export function LoadErrorBanner() {
  const { loadError, reloadData } = useTrackerContext();

  if (!loadError) return null;

  return (
    <div className="load-error-banner" role="alert">
      <AlertTriangle size={18} aria-hidden="true" />
      <p>
        We couldn&apos;t load your latest data, so some of what you see may be missing. Your saved
        data is safe.
      </p>
      <button type="button" className="sync-toast-retry" onClick={reloadData}>
        <RefreshCw size={14} aria-hidden="true" /> Try again
      </button>
    </div>
  );
}
