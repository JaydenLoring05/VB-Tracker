"use client";

import { useState } from "react";

import { getWorkoutDays } from "@/data/workoutPlan";
import { getExerciseTarget } from "@/lib/customProgram";
import { resolveWorkoutDays } from "@/lib/programResolution";
import { useStartWorkout } from "@/hooks/useStartWorkout";
import { useTrackerContext } from "@/context/TrackerContext";
import { todayName } from "@/lib/storage";

export function StartWorkoutScreen() {
  const { week, teamOverride, substitutions } = useTrackerContext();
  const { loading, starting, openSession, startWorkout, resumeWorkout } = useStartWorkout();
  const [selectedDay, setSelectedDay] = useState(todayName());

  const workoutDays = resolveWorkoutDays(getWorkoutDays(week), week, teamOverride, substitutions);
  const day = workoutDays.find((d) => d.day === selectedDay) ?? workoutDays[0];

  return (
    <div className="workout-mode-shell">
      {openSession && (
        <div className="panel resume-banner">
          <div>
            <h3>Workout in progress</h3>
            <p className="muted">
              {openSession.day}, week {openSession.week}. Your sets are saved. Pick up where you left off.
            </p>
          </div>
          <button onClick={resumeWorkout}>
            Continue Workout
          </button>
        </div>
      )}

      <div className="panel">
        <h2>{openSession ? "Or start a new workout" : "Start a Workout"}</h2>
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

          <ul>
            {day.exercises.map((exercise) => (
              <li key={exercise}>
                {exercise}: {getExerciseTarget(day, week, exercise)}
              </li>
            ))}
          </ul>
        </div>

        {day.exercises.length === 0 && <p className="muted">Rest day. Nothing to log.</p>}

        {/* With a workout in progress, Continue above is the main button. This one starts a
            second, empty session, so it is the quiet one and says so. */}
        <button
          className={openSession ? "ghost" : undefined}
          disabled={loading || starting || day.exercises.length === 0}
          onClick={() => startWorkout(selectedDay)}
        >
          {starting ? "Starting…" : openSession ? "Start a new workout" : "Start Workout"}
        </button>
      </div>
    </div>
  );
}
