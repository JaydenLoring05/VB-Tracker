import { useTrackerContext } from "@/context/TrackerContext";
import { earnedBadges } from "@/lib/badges";

/** Badges the athlete has earned (G-03). `trainingDaysPerWeek` is from their current plan week. */
export function useBadges(trainingDaysPerWeek: number) {
  const { workoutDates, prs } = useTrackerContext();
  return earnedBadges({ workoutDates, prs, trainingDaysPerWeek });
}
