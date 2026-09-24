import { Activity } from "lucide-react";

/**
 * The NextRep mark: a gold rounded square with a pulse line, and the wordmark
 * with "REP" in gold. Server-safe (no hooks) so static pages can use it.
 */
export function BrandMark({ size = 32 }: { size?: number }) {
  return (
    <span className="brand-mark" style={{ width: size, height: size }} aria-hidden="true">
      <Activity size={Math.round(size * 0.56)} strokeWidth={2.6} />
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
