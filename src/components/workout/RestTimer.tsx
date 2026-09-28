"use client";

import { Bell, BellRing, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { notificationsSupported, requestRestNotifications } from "@/lib/restAlert";
import { formatDuration } from "@/lib/time";

const BANNER_MS = 20000;

export function RestTimer({
  secondsLeft,
  totalSeconds,
  onSkip
}: {
  secondsLeft: number;
  totalSeconds: number;
  onSkip: () => void;
}) {
  const progress = Math.max(0, Math.min(100, (secondsLeft / totalSeconds) * 100));
  const [notifyState, setNotifyState] = useState<"unsupported" | "ask" | "on" | "blocked">("unsupported");

  useEffect(() => {
    if (!notificationsSupported()) return;
    const permission = Notification.permission;
    setNotifyState(permission === "granted" ? "on" : permission === "denied" ? "blocked" : "ask");
  }, []);

  async function handleEnableNotifications() {
    const allowed = await requestRestNotifications();
    setNotifyState(allowed ? "on" : "blocked");
  }

  return (
    <div className="rest-timer" role="timer" aria-label="Rest timer">
      <div className="rest-timer-header">
        <span>Rest</span>
        <span>{formatDuration(secondsLeft)}</span>
      </div>

      {/* The time above says the same thing, so the bar is decoration for assistive tech. */}
      <div className="progress-bar" aria-hidden="true">
        <div className="progress-fill" style={{ width: `${progress}%` }} />
      </div>

      <button type="button" className="ghost" onClick={onSkip}>
        Skip Rest
      </button>

      {notifyState === "ask" && (
        <button type="button" className="ghost rest-timer-notify" onClick={handleEnableNotifications}>
          <Bell size={14} aria-hidden="true" /> Alert me if I leave the app
        </button>
      )}
      {notifyState === "on" && (
        <p className="muted rest-timer-note">
          <BellRing size={14} aria-hidden="true" /> You&apos;ll get a notification if you switch apps.
        </p>
      )}
    </div>
  );
}

/** Shown over the set form the moment rest ends. */
export function RestOverBanner({ onDismiss }: { onDismiss: () => void }) {
  // The workout screen re-renders every second (elapsed clock), so an
  // inline onDismiss is a new function each time. A ref keeps the
  // auto-dismiss timer from restarting on every render.
  const onDismissRef = useRef(onDismiss);
  useEffect(() => {
    onDismissRef.current = onDismiss;
  });

  useEffect(() => {
    const timeout = setTimeout(() => onDismissRef.current(), BANNER_MS);
    return () => clearTimeout(timeout);
  }, []);

  return (
    <div className="rest-over-banner" role="alert">
      <BellRing size={22} aria-hidden="true" />
      <div>
        <strong>Rest&apos;s over</strong>
        <span>Time for your next set.</span>
      </div>
      <button type="button" className="ghost rest-over-dismiss" onClick={onDismiss} aria-label="Dismiss">
        <X size={16} />
      </button>
    </div>
  );
}
