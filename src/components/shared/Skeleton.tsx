import type { CSSProperties } from "react";

/** A single shimmering placeholder block. Decorative, so hidden from screen readers. */
export function Skeleton({ className = "", style }: { className?: string; style?: CSSProperties }) {
  return <span className={`skeleton ${className}`.trim()} style={style} aria-hidden="true" />;
}

/**
 * Wrapper for a group of skeletons. Announces one polite "Loading" status to
 * assistive tech instead of a dozen empty shapes.
 */
export function SkeletonRegion({
  label,
  className,
  children
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div role="status" aria-live="polite" aria-busy="true" className={className}>
      <span className="sr-only">{label}</span>
      {children}
    </div>
  );
}

/** Mirrors a dashboard stat card: icon, label, big value, caption. */
export function SkeletonCard() {
  return (
    <div className="card skeleton-card">
      <Skeleton className="skeleton-icon" />
      <Skeleton className="skeleton-line" style={{ width: "40%", marginBottom: 14 }} />
      <Skeleton className="skeleton-line-lg" style={{ width: "55%", marginBottom: 14 }} />
      <Skeleton className="skeleton-line" style={{ width: "80%" }} />
    </div>
  );
}

/** Mirrors a roster / list row: name and detail on the left, a pill on the right. */
export function SkeletonRow() {
  return (
    <div className="skeleton-row">
      <div className="skeleton-stack">
        <Skeleton className="skeleton-line" style={{ width: "38%" }} />
        <Skeleton className="skeleton-line" style={{ width: "24%" }} />
      </div>
      <Skeleton className="skeleton-pill" />
    </div>
  );
}
