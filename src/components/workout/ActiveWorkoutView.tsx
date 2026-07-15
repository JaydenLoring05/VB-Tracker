"use client";

import { CheckCircle2, ChevronLeft, ChevronRight } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";

import { getPrescription, workoutDays } from "@/data/workoutPlan";
import { useActiveWorkoutSession } from "@/hooks/useActiveWorkoutSession";
import { formatDuration } from "@/lib/time";

import { RestTimer } from "./RestTimer";
import { WorkoutSummary } from "./WorkoutSummary";

const REST_DURATION = 90;

export function ActiveWorkoutView({ sessionId }: { sessionId: string }) {
  const { loading, notFound, session, sets, logSet, deleteSet, finishWorkout } =
    useActiveWorkoutSession(sessionId);

  const [exerciseIndex, setExerciseIndex] = useState(0);
  const [weight, setWeight] = useState("");
  const [reps, setReps] = useState("");
  const [restSecondsLeft, setRestSecondsLeft] = useState<number | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [finished, setFinished] = useState(false);
  const [finishResult, setFinishResult] = useState<{ durationSeconds: number } | null>(null);

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
    if (restSecondsLeft === null || restSecondsLeft <= 0) return;

    const timeout = setTimeout(
      () => setRestSecondsLeft((current) => (current !== null ? current - 1 : null)),
      1000
    );
    return () => clearTimeout(timeout);
  }, [restSecondsLeft]);

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

  function goToExercise(nextIndex: number) {
    setExerciseIndex(Math.max(0, Math.min(day!.exercises.length - 1, nextIndex)));
    setWeight("");
    setReps("");
    setRestSecondsLeft(null);
  }

  async function handleLogSet(event: FormEvent) {
    event.preventDefault();

    await logSet(
      exercise,
      weight.trim() === "" ? null : Number(weight),
      reps.trim() === "" ? null : Number(reps)
    );

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

        {exerciseSets.length > 0 && (
          <div className="logged-sets">
            {exerciseSets.map((set) => (
              <div className="logged-set" key={set.id}>
                <span>
                  Set {set.set_number}: {set.weight ?? "-"} x {set.reps ?? "-"}
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
            <input
              type="number"
              inputMode="decimal"
              placeholder="Weight"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
            />
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
  );
}
