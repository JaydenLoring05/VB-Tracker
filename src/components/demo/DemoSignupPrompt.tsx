"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";

/**
 * The friendly stand-in for anything that would write data. Uses a native
 * modal <dialog> so focus trapping, Escape and inert background come free.
 */
export function DemoSignupPrompt({ feature, onClose }: { feature: string | null; onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const open = feature !== null;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      className="demo-prompt"
      aria-labelledby="demo-prompt-title"
      onClose={onClose}
      onKeyDown={(event) => {
        // Keep Escape from also closing a modal that sits underneath this prompt.
        if (event.key === "Escape") event.stopPropagation();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="demo-prompt-card">
        <p className="demo-prompt-kicker">Sample data</p>
        <h2 id="demo-prompt-title">This is a demo</h2>
        <p>This is a demo. Start your free pilot to do this with your team.</p>
        {feature && <p className="muted demo-prompt-feature">Not available in the demo: {feature}.</p>}

        <div className="demo-prompt-actions">
          <Link href="/login?mode=sign-up" className="demo-cta">
            Start Free Team Pilot
          </Link>
          <button type="button" className="ghost" onClick={onClose} autoFocus>
            Keep exploring
          </button>
        </div>
      </div>
    </dialog>
  );
}
