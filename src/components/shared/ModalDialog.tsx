"use client";

import { useLayoutEffect, useRef } from "react";

/**
 * Modal built on the native <dialog> element, so the browser supplies the focus trap,
 * the inert background and the top-layer stacking. On top of that it:
 *  - moves focus to the element marked data-autofocus (or the first control),
 *  - closes on Escape and on a click outside the card,
 *  - hands focus back to whatever opened it when it goes away.
 *
 * Render it only while it should be open; unmounting closes it.
 */
export function ModalDialog({
  label,
  alert = false,
  onClose,
  cardClassName = "",
  children
}: {
  /** Accessible name for the dialog. */
  label: string;
  /** Use for confirmations that need an answer (announced as an alert dialog). */
  alert?: boolean;
  onClose: () => void;
  cardClassName?: string;
  children: React.ReactNode;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const onCloseRef = useRef(onClose);

  useLayoutEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useLayoutEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;

    if (!dialog.open) dialog.showModal();
    dialog.querySelector<HTMLElement>("[data-autofocus]")?.focus();

    return () => {
      if (dialog.open) dialog.close();
      // If the opener was removed while the modal was open (a deleted row), land on the page's main
      // landmark rather than dropping focus to the top of the document.
      const target = opener?.isConnected ? opener : document.getElementById("main-content");
      target?.focus();
    };
  }, []);

  return (
    <dialog
      ref={dialogRef}
      className="modal-overlay"
      role={alert ? "alertdialog" : undefined}
      aria-label={label}
      onCancel={(event) => {
        // Escape: let the parent decide (it unmounts us) instead of the browser closing silently.
        event.preventDefault();
        onCloseRef.current();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onCloseRef.current();
      }}
    >
      <div className={`panel modal-card ${cardClassName}`.trim()}>{children}</div>
    </dialog>
  );
}
