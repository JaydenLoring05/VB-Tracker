// Maps the app's recovery labels onto the three status colors:
// ready (green), monitor (orange), limited (red). "none" is neutral.
const TONE: Record<string, "ready" | "monitor" | "limited"> = {
  elite: "ready",
  good: "ready",
  caution: "monitor",
  low: "limited"
};

export function statusTone(label: string) {
  return TONE[label.toLowerCase()];
}

/** A status dot followed by its label, e.g. "Good" in green. */
export function StatusLabel({ label, className = "" }: { label: string; className?: string }) {
  const tone = statusTone(label);
  return <span className={`status${tone ? ` status-${tone}` : ""}${className ? ` ${className}` : ""}`}>{label}</span>;
}
