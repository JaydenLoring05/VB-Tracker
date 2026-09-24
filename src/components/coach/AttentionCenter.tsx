"use client";

import { AlertTriangle, PartyPopper, ShieldAlert } from "lucide-react";
import { ComponentType } from "react";

import { InlineError } from "@/components/shared/InlineError";
import { SkeletonRegion, SkeletonRow } from "@/components/shared/Skeleton";
import { Avatar } from "@/components/shared/Avatar";
import { EmptyState } from "@/components/shared/EmptyState";

import { AttentionItem, AttentionPriority } from "@/lib/attentionCenter";

import "@/styles/roster.css";

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
  hasAthletes = true,
  onSelectAthlete
}: {
  items: AttentionItem[];
  loading: boolean;
  error?: string | null;
  onRetry?: () => void;
  /** False when the roster is empty, so "all caught up" isn't claimed about nobody. */
  hasAthletes?: boolean;
  onSelectAthlete: (userId: string, displayName: string) => void;
}) {
  return (
    <div className="panel attention-center">
      <div className="section-heading">
        <h2>Attention Center</h2>
        <p className="section-caption">Ranked by priority</p>
      </div>
      <p className="muted attention-lead">What needs your attention today.</p>

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
      ) : !hasAthletes ? (
        <EmptyState
          compact
          icon={ShieldAlert}
          title="Nothing to watch yet"
          description="Once athletes join and check in, this lists who is run down, in pain, or has missed workouts, plus new PRs to celebrate."
        />
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
                <Avatar name={item.displayName} />
                <div className="attention-row-body">
                  <strong>{item.displayName}</strong>
                  <span className="muted">{item.reason}</span>
                </div>
                <Icon size={18} />
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
