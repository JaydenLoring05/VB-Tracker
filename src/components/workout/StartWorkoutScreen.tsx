"use client";

import { useState } from "react";

import { getWorkoutDays } from "@/data/workoutPlan";
import { getExerciseTarget } from "@/lib/customProgram";
import { resolveWorkoutDays } from "@/lib/programResolution";
import { useStartWorkout } from "@/hooks/useStartWorkout";
import { useTrackerContext } from "@/context/TrackerContext";
import { useTrainingProfile } from "@/hooks/useTrainingProfile";
import { useTodayName } from "@/hooks/useToday";
import { countAdaptations } from "@/lib/trainingProfile";
import { TrainingProfileCard } from "@/components/workouts/TrainingProfileCard";

export function StartWorkoutScreen() {
  const { week, teamOverride, substitutions } = useTrackerContext();
  const { effectiveProfile: trainingProfile } = useTrainingProfile();
  const { loading, starting, openSession, startWorkout, resumeWorkout } = useStartWorkout();
  const today = useTodayName();
  const [pickedDay, setSelectedDay] = useState<string | null>(null);
  const selectedDay = pickedDay ?? today;

  const workoutDays = resolveWorkoutDays(getWorkoutDays(week), week, teamOverride, substitutions, trainingProfile);
  const day = workoutDays.find((d) => d.day === selectedDay) ?? workoutDays[0];

  return (
    <div className="workout-mode-shell">
      {openSession && (
        <div className="panel resume-banner">
          <div>
            <h3>Unfinished workout</h3>
            <p className="muted">
              You have an open session from {openSession.day}, week {openSession.week}.
            </p>
          </div>
          <button onClick={resumeWorkout}>
            Resume
          </button>
        </div>
      )}

      <TrainingProfileCard adaptedCount={countAdaptations(workoutDays)} />

      <div className="panel">
        <h2>Start a Workout</h2>
        <p className="muted">Pick a day, then log sets as you go with a rest timer between them.</p>

        <div className="filter-row">
          {workoutDays.map((d) => (
            <button
              key={d.day}
              className={d.day === selectedDay ? "" : "ghost"}
              onClick={() => setSelectedDay(d.day)}
            >
              {d.day}
            </button>
          ))}
        </div>

        <div className="workout-mode-preview">
          <h3>{day.title}</h3>
          <p className="muted">⏱ {day.minutes}</p>
          {day.adjustNote && <p className="day-adjust-note">{day.adjustNote}</p>}

          <ul>
            {day.exercises.map((exercise) => (
              <li key={exercise}>
                {exercise}: {getExerciseTarget(day, week, exercise)}
                {day.adaptNotes?.[exercise] && <span className="muted exercise-adapt-note"> ({day.adaptNotes[exercise]})</span>}
              </li>
            ))}
          </ul>
        </div>

        {day.exercises.length === 0 && <p className="muted">Rest day. Nothing to log.</p>}

        <button disabled={loading || starting || day.exercises.length === 0} onClick={() => startWorkout(selectedDay)}>
          {starting ? "Starting…" : "Start Workout"}
        </button>
      </div>
    </div>
  );
}
