"use client";

import { AlertTriangle, PartyPopper, ShieldAlert } from "lucide-react";
import { ComponentType } from "react";

import { EmptyState } from "@/components/shared/EmptyState";

import { AttentionItem, AttentionPriority } from "@/lib/attentionCenter";

const PRIORITY_META: Record<AttentionPriority, { icon: ComponentType<{ size?: number }>; className: string }> = {
  high: { icon: ShieldAlert, className: "attention-high" },
  medium: { icon: AlertTriangle, className: "attention-medium" },
  positive: { icon: PartyPopper, className: "attention-positive" }
};

export function AttentionCenter({
  items,
  loading,
  hasAthletes = true,
  onSelectAthlete
}: {
  items: AttentionItem[];
  loading: boolean;
  /** False when the roster is empty, so "all caught up" isn't claimed about nobody. */
  hasAthletes?: boolean;
  onSelectAthlete: (userId: string, displayName: string) => void;
}) {
  return (
    <div className="panel attention-center">
      <h2>Attention Center</h2>
      <p className="muted">What needs your attention today, ranked by priority.</p>

      {loading ? (
        <p className="muted">Loading...</p>
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
