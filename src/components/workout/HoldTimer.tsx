"use client";

import { Pause, Play, RotateCcw } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { fireHoldAlert, primeRestAlert } from "@/lib/restAlert";
import { formatDuration } from "@/lib/time";

/**
 * Countdown for timed sets (planks, holds, stretches). Counts down from the
 * target; when it hits zero, or the athlete stops early, the time actually
 * held is handed back through onDone so the seconds field fills itself in.
 */
export function HoldTimer({
  targetSeconds,
  onTargetChange,
  onDone
}: {
  targetSeconds: number;
  onTargetChange: (seconds: number) => void;
  onDone: (heldSeconds: number) => void;
}) {
  const [endsAt, setEndsAt] = useState<number | null>(null);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(targetSeconds);
  const firedRef = useRef(false);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  const running = endsAt !== null;

  useEffect(() => {
    if (!running) setSecondsLeft(targetSeconds);
  }, [targetSeconds, running]);

  useEffect(() => {
    if (endsAt === null || startedAt === null) return;
    firedRef.current = false;

    function tick() {
      const left = Math.max(0, Math.ceil((endsAt! - Date.now()) / 1000));
      setSecondsLeft(left);
      if (left <= 0 && !firedRef.current) {
        firedRef.current = true;
        fireHoldAlert();
        setEndsAt(null);
        setStartedAt(null);
        onDoneRef.current(Math.round((endsAt! - startedAt!) / 1000));
      }
    }

    tick();
    const interval = setInterval(tick, 250);
    document.addEventListener("visibilitychange", tick);
    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [endsAt, startedAt]);

  function start() {
    // The tap unlocks audio on phones so the end-of-hold beeps can play.
    primeRestAlert();
    const now = Date.now();
    setStartedAt(now);
    setEndsAt(now + targetSeconds * 1000);
  }

  function stopEarly() {
    if (startedAt === null) return;
    const held = Math.max(0, Math.round((Date.now() - startedAt) / 1000));
    setEndsAt(null);
    setStartedAt(null);
    onDoneRef.current(held);
  }

  function bumpTarget(amount: number) {
    onTargetChange(Math.max(5, targetSeconds + amount));
  }

  const progress = targetSeconds > 0 ? Math.max(0, Math.min(100, (secondsLeft / targetSeconds) * 100)) : 0;

  return (
    <div className="rest-timer hold-timer" role="timer" aria-label="Hold timer">
      <div className="rest-timer-header">
        <span>{running ? "Hold" : "Hold timer"}</span>
        <span aria-live="off">{formatDuration(secondsLeft)}</span>
      </div>
      <div className="progress-bar" aria-hidden="true">
        <div className="progress-fill" style={{ width: `${running ? progress : 100}%` }} />
      </div>
      <div className="input-increments hold-timer-controls">
        {running ? (
          <button type="button" className="secondary" onClick={stopEarly}>
            <Pause size={16} /> Stop
          </button>
        ) : (
          <>
            <button type="button" className="ghost" onClick={() => bumpTarget(-5)} aria-label="Shorten target by 5 seconds">
              -5s
            </button>
            <button type="button" onClick={start}>
              <Play size={16} /> Start {formatDuration(targetSeconds)}
            </button>
            <button type="button" className="ghost" onClick={() => bumpTarget(5)} aria-label="Lengthen target by 5 seconds">
              +5s
            </button>
          </>
        )}
        {!running && secondsLeft !== targetSeconds && (
          <button type="button" className="ghost" onClick={() => setSecondsLeft(targetSeconds)} aria-label="Reset timer">
            <RotateCcw size={16} />
          </button>
        )}
      </div>
    </div>
  );
}
