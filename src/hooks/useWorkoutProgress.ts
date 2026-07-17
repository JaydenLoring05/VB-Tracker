import { useMemo } from "react";

import { getWorkoutDays } from "@/data/workoutPlan";
import { useTrackerContext } from "@/context/TrackerContext";

export function useWorkoutProgress() {
  const { week, setWeek, checked, toggleExercise } = useTrackerContext();

  const workoutDays = useMemo(() => getWorkoutDays(week), [week]);

  const totalExercises = useMemo(
    () => workoutDays.reduce((sum, day) => sum + day.exercises.length, 0),
    [workoutDays]
  );

  const completedExercises = useMemo(() => {
    return workoutDays.reduce((sum, day) => {
      return (
        sum +
        day.exercises.filter((exercise) => {
          const key = `${week}-${day.day}-${exercise}`;
          return checked[key];
        }).length
      );
    }, 0);
  }, [workoutDays, week, checked]);

  const progress = Math.round((completedExercises / totalExercises) * 100);

  return {
    week,
    setWeek,
    checked,
    toggleExercise,
    totalExercises,
    completedExercises,
    progress
  };
}
