"use client";

import { Repeat } from "lucide-react";
import { useState } from "react";

import { getPrescription } from "@/data/workoutPlan";
import { useExerciseLibrary } from "@/hooks/useExerciseLibrary";
import { getSubstitutionCandidates, useExerciseSubstitutions } from "@/hooks/useExerciseSubstitutions";
import { useWorkoutLogs } from "@/hooks/useWorkoutLogs";
import { useWorkoutProgress } from "@/hooks/useWorkoutProgress";
import { WorkoutDay } from "@/types";

export function DayCard({ day, isToday }: { day: WorkoutDay; isToday: boolean }) {
  const { week, checked, toggleExercise } = useWorkoutProgress();
  const { workoutLogs, updateWorkoutLog, workoutNotes, updateWorkoutNote } = useWorkoutLogs();
  const { openExerciseFromWorkout } = useExerciseLibrary();
  const { resolveExercise, setSubstitution, clearSubstitution } = useExerciseSubstitutions();

  const [swapOpenFor, setSwapOpenFor] = useState<string | null>(null);

  const noteKey = `${week}-${day.day}-notes`;

  return (
    <div className={`panel day-card ${isToday ? "today" : ""}`}>
      <h3>{day.day}</h3>
      <h4>{day.title}</h4>
      <p className="muted">⏱ {day.minutes}</p>

      {day.exercises.map((originalExercise) => {
        const exercise = resolveExercise(originalExercise);
        const isSubstituted = exercise !== originalExercise;
        const key = `${week}-${day.day}-${exercise}`;
        const logKey = `${week}-${day.day}-${exercise}-log`;
        const candidates = getSubstitutionCandidates(originalExercise);
        const swapOpen = swapOpenFor === originalExercise;

        return (
          <div key={originalExercise} className="exercise-log-block">
            <label className="exercise-row">
              <input
                type="checkbox"
                checked={Boolean(checked[key])}
                onChange={() => toggleExercise(day.day, exercise)}
              />

              <span>
                <button
                  type="button"
                  className="exercise-name-button"
                  onClick={(event) => {
                    event.preventDefault();
                    openExerciseFromWorkout(exercise);
                  }}
                >
                  {exercise}
                </button>
                : {getPrescription(week, exercise)}
                {isSubstituted && <span className="substituted-badge">swapped</span>}
              </span>

              {candidates.length > 0 && (
                <button
                  type="button"
                  className="ghost swap-toggle"
                  aria-label={`Swap ${originalExercise}`}
                  onClick={() => setSwapOpenFor(swapOpen ? null : originalExercise)}
                >
                  <Repeat size={14} />
                </button>
              )}
            </label>

            {swapOpen && (
              <div className="swap-picker">
                <select
                  value={exercise}
                  onChange={(event) => {
                    const chosen = event.target.value;
                    if (chosen === originalExercise) {
                      clearSubstitution(originalExercise);
                    } else {
                      setSubstitution(originalExercise, chosen);
                    }
                    setSwapOpenFor(null);
                  }}
                >
                  <option value={originalExercise}>{originalExercise} (default)</option>
                  {candidates.map((candidate) => (
                    <option key={candidate.name} value={candidate.name}>
                      {candidate.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <input
              className="exercise-log-input"
              value={workoutLogs[logKey] || ""}
              onChange={(event) => updateWorkoutLog(day.day, exercise, event.target.value)}
              placeholder="Log: weight x reps, jump height, pain level, speed..."
            />
          </div>
        );
      })}

      <div className="day-notes">
        <label>
          Day Notes
          <textarea
            value={workoutNotes[noteKey] || ""}
            onChange={(event) => updateWorkoutNote(day.day, event.target.value)}
            placeholder="How did the workout feel? Knee pain? Shoulder pain? Energy? Explosiveness?"
          />
        </label>
      </div>

      <p className="muted">{day.notes}</p>
    </div>
  );
}
