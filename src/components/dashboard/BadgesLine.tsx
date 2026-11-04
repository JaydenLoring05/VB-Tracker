"use client";

import { useEffect, useState } from "react";

import { Celebrate } from "@/components/shared/Celebrate";
import { ModalDialog } from "@/components/shared/ModalDialog";
import { useDemo } from "@/context/DemoContext";
import { useTrackerContext } from "@/context/TrackerContext";
import { BADGES, newlyEarned, type BadgeId } from "@/lib/badges";

const SEEN_KEY = "nextrep-seen-badges";

function readSeen(userId: string): string[] {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(`${SEEN_KEY}:${userId}`) ?? "[]");
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [];
  }
}

function writeSeen(userId: string, ids: string[]) {
  try {
    window.localStorage.setItem(`${SEEN_KEY}:${userId}`, JSON.stringify(ids));
  } catch {
    // Storage blocked: the celebration may show again next visit.
  }
}

/**
 * The Today screen's badges (G-03): one summary line that opens to all six,
 * and a short celebration the first time a badge is earned on this device.
 * The demo never celebrates, so it can't cover the sample screens.
 */
export function BadgesLine({ earned }: { earned: BadgeId[] }) {
  const { userId, loadError } = useTrackerContext();
  const demo = useDemo();
  const [celebrating, setCelebrating] = useState<BadgeId[]>([]);

  useEffect(() => {
    if (demo || !userId || loadError || earned.length === 0) return;
    const fresh = newlyEarned(earned, readSeen(userId));
    if (fresh.length === 0) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reads localStorage, which only exists after mount
    setCelebrating(fresh);
    writeSeen(userId, earned);
  }, [demo, userId, loadError, earned]);

  const earnedSet = new Set(earned);
  const latest = BADGES.filter((badge) => earnedSet.has(badge.id)).at(-1);
  const shown = BADGES.filter((badge) => celebrating.includes(badge.id));

  return (
    <>
      <details className="today-line">
        <summary>
          <span className="today-line-label">Badges</span>
          <span className="today-line-value">
            <strong>
              {earned.length} of {BADGES.length}
            </strong>
            {latest && (
              <span className="muted">
                {latest.icon} {latest.name}
              </span>
            )}
          </span>
        </summary>
        <ul className="today-line-body badge-grid">
          {BADGES.map((badge) => {
            const has = earnedSet.has(badge.id);
            return (
              <li key={badge.id} className={has ? "badge badge-earned" : "badge badge-locked"}>
                <span className="badge-icon" aria-hidden="true">
                  {badge.icon}
                </span>
                <strong>{badge.name}</strong>
                <span className="muted">{has ? "Earned" : badge.description}</span>
              </li>
            );
          })}
        </ul>
      </details>

      {shown.length > 0 && (
        <ModalDialog label="Badge unlocked" onClose={() => setCelebrating([])} cardClassName="badge-unlock">
          <div className="badge-unlock-burst">
            <span className="badge-unlock-icon" aria-hidden="true">
              {shown[0].icon}
            </span>
            <Celebrate />
          </div>
          <h2>{shown.length === 1 ? "Badge unlocked!" : `${shown.length} badges unlocked!`}</h2>
          <ul className="badge-unlock-list">
            {shown.map((badge) => (
              <li key={badge.id}>
                <strong>
                  {badge.icon} {badge.name}
                </strong>
                <span className="muted"> {badge.description}</span>
              </li>
            ))}
          </ul>
          <button type="button" data-autofocus onClick={() => setCelebrating([])}>
            Let&apos;s go
          </button>
        </ModalDialog>
      )}
    </>
  );
}
