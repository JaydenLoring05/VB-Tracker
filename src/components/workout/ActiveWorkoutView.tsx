"use client";

import { CheckCircle2, ChevronLeft, ChevronRight, Trophy } from "lucide-react";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";

import { getPrescription, getWorkoutDays } from "@/data/workoutPlan";
import { useActiveWorkoutSession } from "@/hooks/useActiveWorkoutSession";
import { useExerciseSubstitutions } from "@/hooks/useExerciseSubstitutions";
import { formatDuration } from "@/lib/time";

import { RestTimer } from "./RestTimer";
import { WorkoutSummary } from "./WorkoutSummary";

const REST_DURATION = 90;
const WEIGHT_INCREMENTS = [5, 10];
const REPS_INCREMENTS = [1, 5];

function vibrate(pattern: number | number[]) {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    navigator.vibrate(pattern);
  }
}

function playRestCompleteTone() {
  if (typeof window === "undefined") return;
  const AudioContextClass =
    window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextClass) return;

  try {
    const ctx = new AudioContextClass();
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();

    oscillator.type = "sine";
    oscillator.frequency.value = 880;
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.4);

    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.start();
    oscillator.stop(ctx.currentTime + 0.45);
    oscillator.onended = () => ctx.close();
  } catch {
    // Audio isn't critical to the workout flow; fail silently.
  }
}

export function ActiveWorkoutView({ sessionId }: { sessionId: string }) {
  const { loading, notFound, loadError, session, sets, previousSets, logSet, deleteSet, finishWorkout } =
    useActiveWorkoutSession(sessionId);

  const [exerciseIndex, setExerciseIndex] = useState(0);
  const [weight, setWeight] = useState("");
  const [reps, setReps] = useState("");
  const [restEndsAt, setRestEndsAt] = useState<number | null>(null);
  const [restSecondsLeft, setRestSecondsLeft] = useState<number | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [finished, setFinished] = useState(false);
  const [finishResult, setFinishResult] = useState<{ durationSeconds: number } | null>(null);
  const [prSetIds, setPrSetIds] = useState<Record<string, boolean>>({});
  const [isLogging, setIsLogging] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);
  const restCompleteFiredRef = useRef(false);
  const isLoggingRef = useRef(false);
  const isFinishingRef = useRef(false);

  const { resolveExercise } = useExerciseSubstitutions();

  const day = useMemo(
    () => (session ? getWorkoutDays(session.week).find((d) => d.day === session.day) : undefined),
    [session]
  );

  const resolvedExercises = useMemo(
    () => (day ? day.exercises.map(resolveExercise) : []),
    [day, resolveExercise]
  );

  const showSummary = finished || session?.ended_at != null;

  useEffect(() => {
    if (!session || showSummary) return;

    const startedAt = new Date(session.started_at).getTime();
    const tick = () =>
      setElapsedSeconds(Math.max(0, Math.floor((Date.now() - startedAt) / 1000)));
    tick();

    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [session, showSummary]);

  useEffect(() => {
    if (restEndsAt === null) {
      setRestSecondsLeft(null);
      return;
    }

    restCompleteFiredRef.current = false;

    function tick() {
      const secondsLeft = Math.max(0, Math.round((restEndsAt! - Date.now()) / 1000));
      setRestSecondsLeft(secondsLeft);

      if (secondsLeft <= 0 && !restCompleteFiredRef.current) {
        restCompleteFiredRef.current = true;
        vibrate(200);
        playRestCompleteTone();
      }
    }

    tick();
    const interval = setInterval(tick, 250);
    document.addEventListener("visibilitychange", tick);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [restEndsAt]);

  useEffect(() => {
    if (showSummary || typeof navigator === "undefined" || !("wakeLock" in navigator)) return;

    let sentinel: WakeLockSentinel | null = null;
    let cancelled = false;

    async function acquire() {
      try {
        sentinel = await navigator.wakeLock.request("screen");
      } catch {
        // Wake lock isn't critical to the workout flow; fail silently.
      }
    }

    acquire();

    function handleVisibilityChange() {
      if (document.visibilityState === "visible" && !cancelled) acquire();
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      sentinel?.release().catch(() => {});
    };
  }, [showSummary]);

  if (loading) {
    return (
      <div className="panel">
        <p className="muted">Loading workout...</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="panel">
        <h2>Couldn&apos;t load this workout</h2>
        <p className="muted">Check your connection and refresh the page to try again.</p>
      </div>
    );
  }

  if (notFound || !session || !day) {
    return (
      <div className="panel">
        <h2>Workout not found</h2>
        <p className="muted">This session doesn&apos;t exist or doesn&apos;t belong to you.</p>
      </div>
    );
  }

  if (showSummary) {
    return (
      <WorkoutSummary
        day={session.day}
        durationSeconds={finishResult?.durationSeconds ?? session.duration_seconds}
        sets={sets}
      />
    );
  }

  const exercise = resolvedExercises[exerciseIndex];
  const exerciseSets = sets.filter((s) => s.exercise === exercise);
  const lastTime = previousSets[exercise];

  function goToExercise(nextIndex: number) {
    setExerciseIndex(Math.max(0, Math.min(resolvedExercises.length - 1, nextIndex)));
    setWeight("");
    setReps("");
    setRestEndsAt(null);
  }

  function bumpWeight(amount: number) {
    const current = Number(weight) || 0;
    setWeight(String(Math.max(0, current + amount)));
  }

  function bumpReps(amount: number) {
    const current = Number(reps) || 0;
    setReps(String(Math.max(0, current + amount)));
  }

  const canLogSet = reps.trim() !== "" && !isLogging;

  async function handleLogSet(event: FormEvent) {
    event.preventDefault();
    if (!canLogSet) return;

    setIsLogging(true);
    try {
      const result = await logSet(exercise, weight.trim() === "" ? null : Number(weight), Number(reps));

      if (result?.isNewPR) {
        vibrate([80, 40, 80]);
        setPrSetIds((current) => ({ ...current, [result.set.id]: true }));
      }

      if (result) {
        setRestEndsAt(Date.now() + REST_DURATION * 1000);
      }
    } finally {
      setIsLogging(false);
    }
  }

  async function handleFinish() {
    if (isFinishing) return;

    const loggedCount = sets.length;
    const confirmed = window.confirm(
      loggedCount > 0
        ? `Finish workout? ${loggedCount} set${loggedCount === 1 ? "" : "s"} logged.`
        : "Finish workout? No sets have been logged yet."
    );
    if (!confirmed) return;

    setIsFinishing(true);
    const result = await finishWorkout(resolvedExercises);
    setIsFinishing(false);

    if (result) {
      setFinishResult(result);
      setFinished(true);
    }
  }

  return (
    <div className="workout-mode-shell">
      <div className="panel workout-session-header">
        <div>
          <h2>{day.title}</h2>
          <p className="muted">
            {session.day}, Week {session.week}
          </p>
        </div>

        <div className="workout-elapsed">{formatDuration(elapsedSeconds)}</div>
      </div>

      <div className="exercise-dots">
        {resolvedExercises.map((name, index) => (
          <button
            key={name}
            type="button"
            className={`exercise-dot ${index === exerciseIndex ? "active" : ""} ${
              sets.some((s) => s.exercise === name) ? "done" : ""
            }`}
            onClick={() => goToExercise(index)}
            title={name}
            aria-label={name}
          />
        ))}
      </div>

      <div className="panel">
        <h3>{exercise}</h3>
        <p className="muted">Target: {getPrescription(session.week, exercise)}</p>
        {lastTime && (
          <p className="muted last-time">
            Last time: {lastTime.weight ?? "-"} x {lastTime.reps ?? "-"}
          </p>
        )}

        {exerciseSets.length > 0 && (
          <div className="logged-sets">
            {exerciseSets.map((set) => (
              <div className="logged-set" key={set.id}>
                <span>
                  Set {set.set_number}: {set.weight ?? "-"} x {set.reps ?? "-"}
                  {prSetIds[set.id] && (
                    <span className="pr-badge">
                      <Trophy size={12} /> New PR
                    </span>
                  )}
                </span>
                <button className="ghost danger-button" onClick={() => deleteSet(set.id)}>
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}

        {restSecondsLeft !== null ? (
          <RestTimer
            secondsLeft={restSecondsLeft}
            totalSeconds={REST_DURATION}
            onSkip={() => setRestSecondsLeft(null)}
          />
        ) : (
          <form className="log-set-form" onSubmit={handleLogSet}>
            <div className="weight-input-group">
              <input
                type="number"
                inputMode="decimal"
                placeholder="Weight"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
              />
              <div className="input-increments">
                {WEIGHT_INCREMENTS.map((amount) => (
                  <button
                    type="button"
                    key={amount}
                    className="ghost"
                    onClick={() => bumpWeight(amount)}
                  >
                    +{amount}
                  </button>
                ))}
              </div>
            </div>
            <div className="weight-input-group">
              <input
                type="number"
                inputMode="decimal"
                placeholder="Reps"
                value={reps}
                onChange={(e) => setReps(e.target.value)}
                required
              />
              <div className="input-increments">
                {REPS_INCREMENTS.map((amount) => (
                  <button
                    type="button"
                    key={amount}
                    className="ghost"
                    onClick={() => bumpReps(amount)}
                  >
                    +{amount}
                  </button>
                ))}
              </div>
            </div>
            <button type="submit" disabled={!canLogSet}>
              <CheckCircle2 size={16} /> {isLogging ? "Saving…" : "Log Set"}
            </button>
          </form>
        )}
      </div>

      <div className="workout-actions">
        <div className="workout-nav-row">
          <button
            className="ghost"
            disabled={exerciseIndex === 0}
            onClick={() => goToExercise(exerciseIndex - 1)}
          >
            <ChevronLeft size={16} /> Previous
          </button>

          <button
            className="ghost"
            disabled={exerciseIndex === resolvedExercises.length - 1}
            onClick={() => goToExercise(exerciseIndex + 1)}
          >
            Next <ChevronRight size={16} />
          </button>
        </div>

        <button className="secondary" onClick={handleFinish} disabled={isFinishing}>
          {isFinishing ? "Finishing…" : "Finish Workout"}
        </button>
      </div>
    </div>
  );
}
