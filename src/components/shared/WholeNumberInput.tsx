"use client";

import { useState } from "react";

import { parseWholeNumber } from "@/lib/numberInput";

/**
 * A number field that can be cleared and retyped. While focused it shows
 * exactly what was typed (even nothing); every valid whole number is passed
 * up right away, and on blur the field goes back to the last saved value.
 */
export function WholeNumberInput({
  value,
  min = 1,
  onCommit,
  "aria-label": ariaLabel
}: {
  value: number | null;
  min?: number;
  onCommit: (value: number) => void;
  "aria-label": string;
}) {
  // Null when not being edited, so the saved value shows.
  const [typed, setTyped] = useState<string | null>(null);

  return (
    <input
      type="number"
      inputMode="numeric"
      min={min}
      step={1}
      aria-label={ariaLabel}
      value={typed ?? (value == null ? "" : String(value))}
      onChange={(event) => {
        const text = event.target.value;
        setTyped(text);
        const parsed = parseWholeNumber(text, min);
        if (parsed != null) onCommit(parsed);
      }}
      onBlur={() => setTyped(null)}
    />
  );
}
