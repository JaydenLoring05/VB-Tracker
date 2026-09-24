"use client";

import { Trophy } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Celebrate } from "@/components/shared/Celebrate";
import { formatDuration } from "@/lib/time";
import { WorkoutSet } from "@/types";

const RPE_SCALE = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

export function WorkoutSummary({
  day,
  durationSeconds,
  sets,
  rpe,
  onRateRPE
}: {
  day: string;
  durationSeconds: number | null;
  sets: WorkoutSet[];
  rpe?: number | null;
  onRateRPE?: (rpe: number) => Promise<boolean>;
}) {
  const router = useRouter();
  const [savingRPE, setSavingRPE] = useState(false);

  async function handleRate(value: number) {
    if (!onRateRPE || savingRPE) return;
    setSavingRPE(true);
    await onRateRPE(value);
    setSavingRPE(false);
  }

  const exerciseNames = Array.from(new Set(sets.map((s) => s.exercise)));

  const totalVolume = sets.reduce((sum, s) => {
    if (s.weight == null || s.reps == null) return sum;
    return sum + s.weight * s.reps;
  }, 0);

  return (
    <div className="panel workout-summary">
      <div className="workout-summary-hero">
        <div className="success-mark">
          <Trophy size={28} aria-hidden="true" />
          <Celebrate />
        </div>
        <div>
          <h2>Workout Complete</h2>
          <p className="muted">{day}</p>
        </div>
      </div>

      <div className="grid-4 workout-summary-stats">
        <div className="card">
          <h3>Duration</h3>
          <h2>{durationSeconds != null ? formatDuration(durationSeconds) : "--"}</h2>
        </div>

        <div className="card">
          <h3>Sets Logged</h3>
          <h2>{sets.length}</h2>
        </div>

        <div className="card">
          <h3>Exercises</h3>
          <h2>{exerciseNames.length}</h2>
        </div>

        <div className="card">
          <h3>Total Volume</h3>
          <h2>{totalVolume > 0 ? totalVolume.toLocaleString() : "--"}</h2>
        </div>
      </div>

      {exerciseNames.length > 0 && (
        <div className="workout-summary-list">
          <h3>Logged</h3>
          <ul>
            {exerciseNames.map((exercise) => {
              const exerciseSets = sets.filter((s) => s.exercise === exercise);
              return (
                <li key={exercise}>
                  <strong>{exercise}:</strong>
                  <span className="muted">
                    {" "}
                    {exerciseSets
                      .map((s) => `${s.weight ?? "-"}x${s.reps ?? "-"}`)
                      .join(", ")}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {onRateRPE && (
        <div className="workout-rpe">
          <h3 id="rpe-heading">How hard did that feel?</h3>
          <p className="muted">1 = very easy, 10 = maximum effort.</p>
          <div className="workout-rpe-scale" role="group" aria-labelledby="rpe-heading">
            {RPE_SCALE.map((value) => (
              <button
                key={value}
                type="button"
                className={rpe === value ? "" : "ghost"}
                aria-pressed={rpe === value}
                disabled={savingRPE}
                onClick={() => handleRate(value)}
              >
                {value}
              </button>
            ))}
          </div>
          {rpe != null && (
            <p className="muted" role="status">
              Saved: {rpe}/10.
            </p>
          )}
        </div>
      )}

      <button onClick={() => router.push("/dashboard")}>Back to Dashboard</button>
    </div>
  );
}
