"use client";

import { X } from "lucide-react";
import { useEffect } from "react";

export const TOAST_MS = 5000;

export type FilmToastMessage = {
  id: number;
  text: string;
  tone: "saved" | "error";
  /** Present only for saved tags, for 5 seconds. */
  onUndo?: () => void;
};

export function FilmToast({ toast, onDismiss }: { toast: FilmToastMessage; onDismiss: () => void }) {
  useEffect(() => {
    const timeout = setTimeout(onDismiss, TOAST_MS);
    return () => clearTimeout(timeout);
  }, [toast.id, onDismiss]);

  return (
    <div className={`film-toast film-toast-${toast.tone}`} role="status" aria-live="polite">
      <span>{toast.text}</span>
      {toast.onUndo && (
        <button
          type="button"
          className="ghost film-toast-undo"
          onClick={() => {
            toast.onUndo?.();
            onDismiss();
          }}
        >
          Undo
        </button>
      )}
      <button type="button" className="ghost film-toast-dismiss" aria-label="Dismiss" onClick={onDismiss}>
        <X size={14} aria-hidden="true" />
      </button>
    </div>
  );
}
