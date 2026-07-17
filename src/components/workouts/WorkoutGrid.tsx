"use client";

import { Dumbbell } from "lucide-react";

import { getWorkoutDays } from "@/data/workoutPlan";
import { useWorkoutProgress } from "@/hooks/useWorkoutProgress";
import { todayName } from "@/lib/storage";

import { DayCard } from "./DayCard";

export function WorkoutGrid() {
  const today = todayName();
  const { week } = useWorkoutProgress();
  const workoutDays = getWorkoutDays(week);

  return (
    <section id="workouts">
      <h2>
        <Dumbbell size={22} /> Weekly Workouts
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
