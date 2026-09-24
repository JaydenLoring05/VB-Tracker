"use client";

import { Check, Copy } from "lucide-react";
import { ReactNode, useEffect, useRef, useState } from "react";

/**
 * Copies text on click and confirms it in place. `getText` runs at click time
 * so callers can read window.location without touching it during render.
 */
export function CopyButton({
  getText,
  children,
  className = "secondary",
  copiedLabel = "Copied"
}: {
  getText: () => string;
  children: ReactNode;
  className?: string;
  copiedLabel?: string;
}) {
  const [status, setStatus] = useState<"idle" | "copied" | "failed">("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  async function handleCopy() {
    let next: "copied" | "failed" = "copied";
    try {
      await navigator.clipboard.writeText(getText());
    } catch {
      next = "failed";
    }
    setStatus(next);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setStatus("idle"), 2500);
  }

  return (
    <>
      <button type="button" className={className} onClick={handleCopy}>
        {status === "copied" ? <Check size={16} aria-hidden="true" /> : <Copy size={16} aria-hidden="true" />}
        {status === "copied" ? copiedLabel : children}
      </button>
      <span className="sr-only" role="status" aria-live="polite">
        {status === "copied" ? "Copied to clipboard." : status === "failed" ? "Couldn't copy. Copy it manually." : ""}
      </span>
      {status === "failed" && <span className="muted copy-failed">Couldn&apos;t copy. Select and copy it manually.</span>}
    </>
  );
}
