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
    <div className="rest-timer">
      <div className="rest-timer-header">
        <span>Rest</span>
        <span>{formatDuration(secondsLeft)}</span>
      </div>

      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${progress}%` }} />
      </div>

      <button className="ghost" onClick={onSkip}>
        Skip Rest
      </button>
    </div>
  );
}
