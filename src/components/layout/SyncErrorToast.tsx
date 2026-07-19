"use client";

import { AlertTriangle, RefreshCw, X } from "lucide-react";
import { useEffect } from "react";

import { useTrackerContext } from "@/context/TrackerContext";

const AUTO_DISMISS_MS = 6000;

export function SyncErrorToast() {
  const { syncError, syncRetry, retrySyncError, clearSyncError } = useTrackerContext();

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
      {syncRetry && (
        <button type="button" className="sync-toast-retry" onClick={retrySyncError} aria-label="Retry">
          <RefreshCw size={14} /> Retry
        </button>
      )}
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
