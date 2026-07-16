"use client";

import { CheckCircle2, ChevronLeft, ChevronRight, Trophy } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";

import { getPrescription, workoutDays } from "@/data/workoutPlan";
import { useActiveWorkoutSession } from "@/hooks/useActiveWorkoutSession";
import { formatDuration } from "@/lib/time";

import { RestTimer } from "./RestTimer";
import { WorkoutSummary } from "./WorkoutSummary";

const REST_DURATION = 90;
const WEIGHT_INCREMENTS = [5, 10];

function vibrate(pattern: number | number[]) {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    navigator.vibrate(pattern);
  }
}

export function ActiveWorkoutView({ sessionId }: { sessionId: string }) {
  const { loading, notFound, session, sets, previousSets, logSet, deleteSet, finishWorkout } =
    useActiveWorkoutSession(sessionId);

  const [exerciseIndex, setExerciseIndex] = useState(0);
  const [weight, setWeight] = useState("");
  const [reps, setReps] = useState("");
  const [restSecondsLeft, setRestSecondsLeft] = useState<number | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [finished, setFinished] = useState(false);
  const [finishResult, setFinishResult] = useState<{ durationSeconds: number } | null>(null);
  const [prSetIds, setPrSetIds] = useState<Record<string, boolean>>({});

  const day = useMemo(
    () => (session ? workoutDays.find((d) => d.day === session.day) : undefined),
    [session]
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
    if (restSecondsLeft === null) return;

    if (restSecondsLeft <= 0) {
      vibrate(200);
      return;
    }

    const timeout = setTimeout(
      () => setRestSecondsLeft((current) => (current !== null ? current - 1 : null)),
      1000
    );
    return () => clearTimeout(timeout);
  }, [restSecondsLeft]);

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

  const exercise = day.exercises[exerciseIndex];
  const exerciseSets = sets.filter((s) => s.exercise === exercise);
  const lastTime = previousSets[exercise];

  function goToExercise(nextIndex: number) {
    setExerciseIndex(Math.max(0, Math.min(day!.exercises.length - 1, nextIndex)));
    setWeight("");
    setReps("");
    setRestSecondsLeft(null);
  }

  function bumpWeight(amount: number) {
    const current = Number(weight) || 0;
    setWeight(String(Math.max(0, current + amount)));
  }

  async function handleLogSet(event: FormEvent) {
    event.preventDefault();

    const result = await logSet(
      exercise,
      weight.trim() === "" ? null : Number(weight),
      reps.trim() === "" ? null : Number(reps)
    );

    if (result?.isNewPR) {
      vibrate([80, 40, 80]);
      setPrSetIds((current) => ({ ...current, [result.set.id]: true }));
    }

    setRestSecondsLeft(REST_DURATION);
  }

  async function handleFinish() {
    const result = await finishWorkout(day!.exercises);
    setFinishResult(result);
    setFinished(true);
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
        {day.exercises.map((name, index) => (
          <button
            key={name}
            type="button"
            className={`exercise-dot ${index === exerciseIndex ? "active" : ""} ${
              sets.some((s) => s.exercise === name) ? "done" : ""
            }`}
            onClick={() => goToExercise(index)}
            title={name}
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
              <div className="weight-increments">
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
            <input
              type="number"
              inputMode="decimal"
              placeholder="Reps"
              value={reps}
              onChange={(e) => setReps(e.target.value)}
            />
            <button type="submit">
              <CheckCircle2 size={16} /> Log Set
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
            disabled={exerciseIndex === day.exercises.length - 1}
            onClick={() => goToExercise(exerciseIndex + 1)}
          >
            Next <ChevronRight size={16} />
          </button>
        </div>

        <button onClick={handleFinish}>Finish Workout</button>
      </div>
    </div>
  );
}
