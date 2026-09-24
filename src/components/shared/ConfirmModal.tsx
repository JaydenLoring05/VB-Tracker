"use client";

import { ModalDialog } from "@/components/shared/ModalDialog";

export function ConfirmModal({
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  danger = false,
  onConfirm,
  onCancel
}: {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <ModalDialog label={title} alert onClose={onCancel} cardClassName="confirm-modal-card">
      <h2>{title}</h2>
      <p className="muted">{message}</p>

      <div className="button-row">
        <button type="button" className={danger ? "ghost danger-button" : ""} onClick={onConfirm}>
          {confirmLabel}
        </button>
        {/* Focus starts on the safe choice, so a stray Enter never confirms a removal. */}
        <button type="button" className="ghost" onClick={onCancel} data-autofocus>
          {cancelLabel}
        </button>
      </div>
    </ModalDialog>
  );
}
