"use client";

import { Trophy } from "lucide-react";
import { useRouter } from "next/navigation";

import { formatDuration } from "@/lib/time";
import { WorkoutSet } from "@/types";

export function WorkoutSummary({
  day,
  durationSeconds,
  sets
}: {
  day: string;
  durationSeconds: number | null;
  sets: WorkoutSet[];
}) {
  const router = useRouter();

  const exerciseNames = Array.from(new Set(sets.map((s) => s.exercise)));

  const totalVolume = sets.reduce((sum, s) => {
    if (s.weight == null || s.reps == null) return sum;
    return sum + s.weight * s.reps;
  }, 0);

  return (
    <div className="panel workout-summary">
      <h2>
        <Trophy size={22} /> Workout Complete
      </h2>
      <p className="muted">{day}</p>

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

      <button onClick={() => router.push("/dashboard")}>Back to Dashboard</button>
    </div>
  );
}
