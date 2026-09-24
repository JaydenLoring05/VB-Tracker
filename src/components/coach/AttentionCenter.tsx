"use client";

import { AlertTriangle, PartyPopper, ShieldAlert } from "lucide-react";
import { ComponentType } from "react";

import { InlineError } from "@/components/shared/InlineError";
import { SkeletonRegion, SkeletonRow } from "@/components/shared/Skeleton";
import { AttentionItem, AttentionPriority } from "@/lib/attentionCenter";

const PRIORITY_META: Record<AttentionPriority, { icon: ComponentType<{ size?: number }>; className: string }> = {
  high: { icon: ShieldAlert, className: "attention-high" },
  medium: { icon: AlertTriangle, className: "attention-medium" },
  positive: { icon: PartyPopper, className: "attention-positive" }
};

export function AttentionCenter({
  items,
  loading,
  error,
  onRetry,
  onSelectAthlete
}: {
  items: AttentionItem[];
  loading: boolean;
  error?: string | null;
  onRetry?: () => void;
  onSelectAthlete: (userId: string, displayName: string) => void;
}) {
  return (
    <div className="panel attention-center">
      <h2>Attention Center</h2>
      <p className="muted">What needs your attention today, ranked by priority.</p>

      {loading ? (
        <SkeletonRegion label="Loading attention items">
          <SkeletonRow />
          <SkeletonRow />
          <SkeletonRow />
        </SkeletonRegion>
      ) : error ? (
        // Never fall through to "All caught up" here: a failed load would tell
        // a coach nothing needs attention when pain flags may be sitting unread.
        <InlineError message={error} onRetry={onRetry} />
      ) : items.length === 0 ? (
        <div className="empty-state">
          <p className="muted">All caught up. Nothing needs your attention today.</p>
        </div>
      ) : (
        <ul className="attention-list">
          {items.map((item) => {
            const meta = PRIORITY_META[item.priority];
            const Icon = meta.icon;

            return (
              <li key={item.id} className={`attention-row ${meta.className}`}>
                <Icon size={18} />
                <div className="attention-row-body">
                  <strong>{item.displayName}</strong>
                  <span className="muted">{item.reason}</span>
                </div>
                <button
                  type="button"
                  className="ghost"
                  onClick={() => onSelectAthlete(item.userId, item.displayName)}
                >
                  {item.action}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
