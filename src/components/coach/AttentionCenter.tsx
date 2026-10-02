"use client";

import { AlertTriangle, PartyPopper, ShieldAlert, X } from "lucide-react";
import { ComponentType, ReactNode, useEffect, useRef, useState } from "react";

import { InlineError } from "@/components/shared/InlineError";
import { SkeletonRegion, SkeletonRow } from "@/components/shared/Skeleton";
import { Avatar } from "@/components/shared/Avatar";
import { EmptyState } from "@/components/shared/EmptyState";

import { attentionMessage } from "@/lib/attentionActions";
import { AttentionItem, AttentionPriority } from "@/lib/attentionCenter";

import "@/styles/roster.css";

type ShareResult = "shared" | "copied" | "cancelled" | "failed";

/** The phone's share sheet when there is one (text, team chat), otherwise the clipboard. */
async function shareOrCopy(text: string): Promise<ShareResult> {
  if (typeof navigator.share === "function") {
    try {
      await navigator.share({ text });
      return "shared";
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return "cancelled";
      // Share sheet unavailable here (e.g. not allowed in this context): fall back to copying.
    }
  }
  try {
    await navigator.clipboard.writeText(text);
    return "copied";
  } catch {
    return "failed";
  }
}

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
  summary,
  onSelectAthlete,
  onDismiss,
  onRestore,
  messageActions = false
}: {
  items: AttentionItem[];
  loading: boolean;
  error?: string | null;
  onRetry?: () => void;
  /** False when the roster is empty, so "all caught up" isn't claimed about nobody. */
  hasAthletes?: boolean;
  /** A one-line team summary shown under the heading in place of the generic lead. */
  summary?: ReactNode;
  onSelectAthlete: (userId: string, displayName: string) => void;
  /** Clears an item from the list (it comes back if something new happens). */
  onDismiss?: (item: AttentionItem) => void;
  onRestore?: (item: AttentionItem) => void;
  /** "Send reminder" / "Recognize achievement" share a ready-written message. Off for the landing-page demo. */
  messageActions?: boolean;
}) {
  const [notice, setNotice] = useState<{ text: string; item: AttentionItem | null } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  function announce(text: string, cleared: AttentionItem | null) {
    setNotice({ text, item: cleared });
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setNotice(null), 8000);
  }

  function clear(item: AttentionItem, text: string) {
    onDismiss?.(item);
    announce(text, onDismiss ? item : null);
  }

  async function handleAction(item: AttentionItem) {
    const message = messageActions ? attentionMessage(item) : null;
    if (!message) {
      onSelectAthlete(item.userId, item.displayName);
      return;
    }
    const result = await shareOrCopy(message);
    if (result === "cancelled") return;
    if (result === "failed") {
      announce(`Couldn't open sharing or copy the message. Opening ${item.displayName} instead.`, null);
      onSelectAthlete(item.userId, item.displayName);
      return;
    }
    clear(
      item,
      result === "shared"
        ? `Message to ${item.displayName} ready to send. Cleared from the list.`
        : `Message to ${item.displayName} copied. Paste it in a text or your team chat. Cleared from the list.`
    );
  }

  return (
    <div className="panel attention-center">
      <div className="section-heading">
        <h2>Attention Center</h2>
        <p className="section-caption">Ranked by priority</p>
      </div>
      {summary ?? <p className="muted attention-lead">What needs your attention today.</p>}

      <div className="attention-notice" role="status" aria-live="polite">
        {notice && (
          <>
            <span>{notice.text}</span>
            {notice.item && onRestore && (
              <button
                type="button"
                className="ghost"
                onClick={() => {
                  if (notice.item) onRestore(notice.item);
                  setNotice(null);
                }}
              >
                Undo
              </button>
            )}
          </>
        )}
      </div>

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
                  <button
                    type="button"
                    className="attention-name"
                    onClick={() => onSelectAthlete(item.userId, item.displayName)}
                  >
                    {item.displayName}
                  </button>
                  <span className="muted">{item.reason}</span>
                </div>
                <Icon size={18} />
                <button type="button" className="ghost attention-action" onClick={() => handleAction(item)}>
                  {item.action}
                </button>
                {onDismiss && (
                  <button
                    type="button"
                    className="ghost attention-dismiss"
                    aria-label={`Clear ${item.displayName}: ${item.reason}`}
                    title="Clear from list"
                    onClick={() => clear(item, `Cleared ${item.displayName}.`)}
                  >
                    <X size={18} />
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
