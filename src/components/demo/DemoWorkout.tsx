"use client";

import { WorkoutModeView } from "@/components/workout/ActiveWorkoutView";
import type { DemoWorkout as DemoWorkoutData } from "@/data/demoData";
import { useDemoWorkoutSession } from "@/hooks/useDemoWorkoutSession";

/** Workout Mode on an in-memory session: log sets, run the rest timer, finish and see the summary. */
export function DemoWorkout({ workout, onExit }: { workout: DemoWorkoutData; onExit: () => void }) {
  const controller = useDemoWorkoutSession(workout);
  return <WorkoutModeView controller={controller} onExit={onExit} />;
}
