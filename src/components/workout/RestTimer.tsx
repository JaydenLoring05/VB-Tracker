"use client";

import { formatDuration } from "@/lib/time";

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
    </div>
  );
}
