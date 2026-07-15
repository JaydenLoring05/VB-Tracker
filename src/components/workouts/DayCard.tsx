"use client";

import { getPrescription } from "@/data/workoutPlan";
import { useExerciseLibrary } from "@/hooks/useExerciseLibrary";
import { useWorkoutLogs } from "@/hooks/useWorkoutLogs";
import { useWorkoutProgress } from "@/hooks/useWorkoutProgress";
import { WorkoutDay } from "@/types";

export function DayCard({ day, isToday }: { day: WorkoutDay; isToday: boolean }) {
  const { week, checked, toggleExercise } = useWorkoutProgress();
  const { workoutLogs, updateWorkoutLog, workoutNotes, updateWorkoutNote } = useWorkoutLogs();
  const { openExerciseFromWorkout } = useExerciseLibrary();

  const noteKey = `${week}-${day.day}-notes`;

  return (
    <div className={`panel day-card ${isToday ? "today" : ""}`}>
      <h3>{day.day}</h3>
      <h4>{day.title}</h4>
      <p className="muted">⏱ {day.minutes}</p>

      {day.exercises.map((exercise) => {
        const key = `${week}-${day.day}-${exercise}`;
        const logKey = `${week}-${day.day}-${exercise}-log`;

        return (
          <div key={exercise} className="exercise-log-block">
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
              </span>
            </label>

            <input
              className="exercise-log-input"
              value={workoutLogs[logKey] || ""}
              onChange={(event) => updateWorkoutLog(logKey, event.target.value)}
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
            onChange={(event) => updateWorkoutNote(noteKey, event.target.value)}
            placeholder="How did the workout feel? Knee pain? Shoulder pain? Energy? Explosiveness?"
          />
        </label>
      </div>

      <p className="muted">{day.notes}</p>
    </div>
  );
}
