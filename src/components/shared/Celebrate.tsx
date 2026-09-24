import type { CSSProperties } from "react";

const COLORS = ["var(--gold)", "var(--gold-2)", "var(--green)", "var(--text)", "var(--gold)"];
const COUNT = 16;

// Fixed layout so server and client markup match and nothing re-randomizes on re-render.
const BITS = Array.from({ length: COUNT }, (_, i) => {
  const angle = (i / COUNT) * Math.PI * 2 + (i % 2 ? 0.2 : -0.1);
  const distance = 44 + (i % 4) * 14;
  return {
    x: Math.round(Math.cos(angle) * distance),
    y: Math.round(Math.sin(angle) * distance - 10),
    rot: (i % 2 ? 1 : -1) * (120 + i * 23),
    delay: (i % 5) * 18,
    color: COLORS[i % COLORS.length]
  };
});

/**
 * A short confetti burst that plays once when it mounts. Decorative only, hidden
 * from assistive tech, and removed entirely under prefers-reduced-motion. Place
 * it inside a `position: relative` parent; it bursts from that parent's center.
 */
export function Celebrate() {
  return (
    <span className="celebrate" aria-hidden="true">
      {BITS.map((bit, i) => (
        <span
          key={i}
          className="celebrate-bit"
          style={
            {
              "--bit-x": `${bit.x}px`,
              "--bit-y": `${bit.y}px`,
              "--bit-rot": `${bit.rot}deg`,
              "--bit-delay": `${bit.delay}ms`,
              "--bit-color": bit.color
            } as CSSProperties
          }
        />
      ))}
    </span>
  );
}
