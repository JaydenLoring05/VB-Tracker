/**
 * The NextRep mark: a volleyball whose seams form an "N", drawn in the
 * on-gold ink inside a gold rounded square, and the wordmark with "REP" in
 * gold. Server-safe (no hooks) so static pages can use it. The same paths
 * generate the PWA icons (scripts/generate-pwa-icons.mjs).
 */
export const MONOGRAM_PATHS = {
  ball: { cx: 16, cy: 16, r: 11.2 },
  // Left seam, right seam, and the diagonal that turns them into an N.
  seams: "M11.2 7.2 Q8.6 16 11.2 24.8 M20.8 7.2 Q23.4 16 20.8 24.8 M11.2 7.2 C14.6 12.6 17.4 19.4 20.8 24.8"
} as const;

export function BrandMark({ size = 32 }: { size?: number }) {
  const { ball, seams } = MONOGRAM_PATHS;
  return (
    <span className="brand-mark" style={{ width: size, height: size }} aria-hidden="true">
      <svg width={Math.round(size * 0.86)} height={Math.round(size * 0.86)} viewBox="4 4 24 24" focusable="false">
        <circle cx={ball.cx} cy={ball.cy} r={ball.r} fill="none" stroke="currentColor" strokeWidth={2.4} />
        <path
          d={seams}
          fill="none"
          stroke="currentColor"
          strokeWidth={2.4}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

export function Brand({ tagline, size = 32 }: { tagline?: string; size?: number }) {
  return (
    <span className="brand-lockup">
      <BrandMark size={size} />
      <span className="brand-text">
        <span className="brand-wordmark">
          NEXT<span>REP</span>
        </span>
        {tagline && <span className="brand-tagline">{tagline}</span>}
      </span>
    </span>
  );
}
