"use client";


import { useWorkoutProgress } from "@/hooks/useWorkoutProgress";
import { todayName } from "@/lib/storage";
import { countAdaptations } from "@/lib/trainingProfile";

import { DayCard } from "./DayCard";
import { TrainingProfileCard } from "./TrainingProfileCard";

export function WorkoutGrid() {
  const today = todayName();
  const { workoutDays } = useWorkoutProgress();

  return (
    <section id="workouts">
      <TrainingProfileCard adaptedCount={countAdaptations(workoutDays)} />

      <h2>
        Weekly Workouts
      </h2>

      <p className="muted">
        Click an exercise name to jump to its cues. Log weight, reps, pain, speed, or notes under each movement.
      </p>

      <div className="workout-grid">
        {workoutDays.map((day) => (
          <DayCard key={day.day} day={day} isToday={day.day === today} />
        ))}
      </div>
    </section>
  );
}
