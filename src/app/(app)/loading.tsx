import { Skeleton, SkeletonCard, SkeletonRegion, SkeletonRow } from "@/components/shared/Skeleton";

// Shown while a page in the app shell is being fetched. The shape mirrors the
// dashboard (CTA bar, four stat cards, two panels) since that is the most common
// landing spot, so the content settles in without a jump.
export default function AppLoading() {
  return (
    <SkeletonRegion label="Loading">
      <Skeleton className="skeleton-cta" />

      <div className="skeleton-grid">
        {Array.from({ length: 4 }, (_, index) => (
          <SkeletonCard key={index} />
        ))}
      </div>

      <div className="skeleton-lower">
        <div className="panel">
          <Skeleton className="skeleton-line-lg" style={{ width: "45%", marginBottom: 16 }} />
          <SkeletonRow />
          <SkeletonRow />
          <SkeletonRow />
        </div>
        <div className="panel">
          <Skeleton className="skeleton-line-lg" style={{ width: "35%", marginBottom: 16 }} />
          <SkeletonRow />
          <SkeletonRow />
          <SkeletonRow />
        </div>
      </div>
    </SkeletonRegion>
  );
}
