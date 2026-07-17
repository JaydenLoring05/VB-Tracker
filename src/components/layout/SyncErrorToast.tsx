"use client";

import { AlertTriangle, X } from "lucide-react";
import { useEffect } from "react";

import { useTrackerContext } from "@/context/TrackerContext";

const AUTO_DISMISS_MS = 6000;

export function SyncErrorToast() {
  const { syncError, clearSyncError } = useTrackerContext();

  useEffect(() => {
    if (!syncError) return;

    const timeout = setTimeout(clearSyncError, AUTO_DISMISS_MS);
    return () => clearTimeout(timeout);
  }, [syncError, clearSyncError]);

  if (!syncError) return null;

  return (
    <div className="sync-toast" role="alert">
      <AlertTriangle size={18} />
      <span>{syncError}</span>
      <button
        type="button"
        className="sync-toast-dismiss"
        onClick={clearSyncError}
        aria-label="Dismiss"
      >
        <X size={16} />
      </button>
    </div>
  );
}
