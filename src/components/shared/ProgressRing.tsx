import type { CSSProperties, ReactNode } from "react";

const RADIUS = 44;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/**
 * Circular progress. Draws itself on first paint (CSS, transform-free stroke
 * animation) and holds still under prefers-reduced-motion. `value` is 0 to 100.
 * Purely presentational: put the meaning in the surrounding text.
 */
export function ProgressRing({
  value,
  size = 96,
  color,
  children
}: {
  value: number;
  size?: number;
  /** Any CSS color, defaults to the gold accent. */
  color?: string;
  /** Centered label, e.g. the percentage. */
  children?: ReactNode;
}) {
  const clamped = Math.max(0, Math.min(100, Number.isFinite(value) ? value : 0));
  const style = {
    "--ring-size": `${size}px`,
    "--ring-c": CIRCUMFERENCE.toFixed(2),
    "--ring-p": String(clamped / 100),
    ...(color ? { "--ring-color": color } : {})
  } as CSSProperties;

  return (
    <div className="ring" style={style}>
      <svg viewBox="0 0 100 100" aria-hidden="true" focusable="false">
        <circle className="ring-track" cx="50" cy="50" r={RADIUS} strokeWidth="9" />
        <circle className="ring-value" cx="50" cy="50" r={RADIUS} strokeWidth="9" />
      </svg>
      {children && <div className="ring-label">{children}</div>}
    </div>
  );
}
