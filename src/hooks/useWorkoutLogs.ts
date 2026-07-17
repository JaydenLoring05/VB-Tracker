import { useMemo } from "react";

import { useTrackerContext } from "@/context/TrackerContext";

export function useWorkoutLogs() {
  const { week, workoutLogs, updateWorkoutLog, workoutNotes, updateWorkoutNote } =
    useTrackerContext();

  const weeklyLogCount = useMemo(
    () => Object.keys(workoutLogs).filter((key) => key.split("-")[0] === String(week)).length,
    [workoutLogs, week]
  );

  return {
    workoutLogs,
    updateWorkoutLog,
    workoutNotes,
    updateWorkoutNote,
    weeklyLogCount
  };
}
